import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, FileText, TrendingUp, DollarSign } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Analytics() {
  const { user } = useAuth();
  const lang = (user?.language || "en") as "en" | "ar";

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const texts = {
    en: {
      title: "Analytics",
      totalProjects: "Total Projects",
      completedReports: "Completed Reports",
      totalInvestment: "Total Investment",
      avgROI: "Average ROI",
      noData: "No data available yet",
      createProject: "Create your first project to see analytics",
    },
    ar: {
      title: "التحليلات",
      totalProjects: "إجمالي المشاريع",
      completedReports: "التقارير المكتملة",
      totalInvestment: "إجمالي الاستثمار",
      avgROI: "متوسط العائد",
      noData: "لا توجد بيانات حتى الآن",
      createProject: "أنشئ مشروعك الأول لرؤية التحليلات",
    },
  };

  const t = texts[lang];

  const totalProjects = projects?.length || 0;
  const completedReports = projects?.filter(p => p.status === "completed").length || 0;
  const totalInvestment = projects?.reduce((sum, p) => sum + (parseFloat(p.initialInvestment || "0")), 0) || 0;

  if (isLoading) {
    return (
      <DashboardLayout title={t.title}>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t.title}>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalProjects}</CardTitle>
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.completedReports}</CardTitle>
              <FileText className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedReports}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalInvestment}</CardTitle>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalInvestment.toLocaleString(lang === "ar" ? "ar-SA" : "en-US")}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.avgROI}</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        </div>

        {totalProjects === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t.noData}</p>
            <p className="text-sm text-muted-foreground mt-2">{t.createProject}</p>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
