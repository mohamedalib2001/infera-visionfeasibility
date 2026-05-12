import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ChevronRight, Plus } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Reports() {
  const { user } = useAuth();
  const lang = (user?.language || "en") as "en" | "ar";

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const texts = {
    en: {
      title: "Reports",
      noReports: "No reports yet",
      createFirst: "Create a project to generate feasibility reports",
      newProject: "New Project",
      viewReport: "View Report",
      completed: "Completed",
      generating: "Generating",
      draft: "Draft",
    },
    ar: {
      title: "التقارير",
      noReports: "لا توجد تقارير بعد",
      createFirst: "أنشئ مشروعاً لإنشاء تقارير الجدوى",
      newProject: "مشروع جديد",
      viewReport: "عرض التقرير",
      completed: "مكتمل",
      generating: "جاري الإنشاء",
      draft: "مسودة",
    },
  };

  const t = texts[lang];

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

  if (isLoading) {
    return (
      <DashboardLayout title={t.title}>
        <div className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  const projectsWithReports = projects?.filter(p => p.status !== "draft") || [];

  return (
    <DashboardLayout title={t.title}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
          <Link href="/projects/new">
            <Button className="gap-2 w-full sm:w-auto" data-testid="button-new-project">
              <Plus className="w-4 h-4" />
              {t.newProject}
            </Button>
          </Link>
        </div>

        {projectsWithReports.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t.noReports}</p>
            <p className="text-sm text-muted-foreground mt-2">{t.createFirst}</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {projectsWithReports.map((project) => (
              <Card key={project.id} className="hover-elevate">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate">{project.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.industry} • {project.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 justify-end">
                      {getStatusBadge(project.status || "draft")}
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="ghost" size="icon" data-testid={`button-view-project-${project.id}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
