import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Plus, FileText, TrendingUp, ChevronRight, Briefcase
} from "lucide-react";
import type { Project } from "@shared/schema";

export default function Dashboard() {
  const { user, subscription } = useAuth();
  const [, setLocation] = useLocation();
  const lang = (user?.language || "en") as "en" | "ar";

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const texts = {
    en: {
      welcome: "Welcome back",
      dashboard: "Dashboard",
      projects: "Projects",
      newProject: "New Project",
      reportsUsed: "Reports Used",
      currentPlan: "Current Plan",
      upgrade: "Upgrade",
      noProjects: "No projects yet",
      startFirst: "Create your first feasibility study",
      viewReport: "View Report",
      generating: "Generating...",
      completed: "Completed",
      draft: "Draft",
    },
    ar: {
      welcome: "مرحباً بعودتك",
      dashboard: "لوحة التحكم",
      projects: "المشاريع",
      newProject: "مشروع جديد",
      reportsUsed: "التقارير المستخدمة",
      currentPlan: "الخطة الحالية",
      upgrade: "ترقية",
      noProjects: "لا توجد مشاريع بعد",
      startFirst: "أنشئ أول دراسة جدوى لك",
      viewReport: "عرض التقرير",
      generating: "جاري الإنشاء...",
      completed: "مكتمل",
      draft: "مسودة",
    },
  };

  const t = texts[lang as keyof typeof texts];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{t.completed}</Badge>;
      case "generating":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{t.generating}</Badge>;
      default:
        return <Badge variant="secondary">{t.draft}</Badge>;
    }
  };

  return (
    <DashboardLayout title={t.dashboard}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.welcome}, {user?.name}</h1>
            <p className="text-muted-foreground">{t.dashboard}</p>
          </div>
          
          <Link href="/projects/new">
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-new-project">
              <Plus className="w-4 h-4" />
              {t.newProject}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.projects}</CardTitle>
              <Briefcase className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects?.length || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.reportsUsed}</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscription?.reportsUsed || 0} / {subscription?.reportsLimit || 3}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.currentPlan}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold capitalize">{subscription?.plan || "Free"}</div>
                <Link href="/pricing">
                  <Button variant="outline" size="sm" data-testid="button-upgrade">
                    {t.upgrade}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{t.projects}</h2>
          
          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card 
                  key={project.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setLocation(`/projects/${project.id}`)}
                  data-testid={`card-project-${project.id}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {project.name}
                        {getStatusBadge(project.status)}
                      </CardTitle>
                      <CardDescription>
                        {project.industry} • {project.country}
                      </CardDescription>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{t.noProjects}</h3>
                  <p className="text-muted-foreground">{t.startFirst}</p>
                </div>
                <Link href="/projects/new">
                  <Button data-testid="button-create-first-project">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.newProject}
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
