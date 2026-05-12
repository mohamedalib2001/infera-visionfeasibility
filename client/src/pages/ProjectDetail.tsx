import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, Sparkles, FileText, BarChart3, 
  Eye, Trash2
} from "lucide-react";
import { ReportGenerationModal } from "@/components/ReportGenerationModal";
import type { Project, FeasibilityReport } from "@shared/schema";

interface ProjectWithReports extends Project {
  reports: FeasibilityReport[];
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const lang = user?.language || "en";
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: project, isLoading } = useQuery<ProjectWithReports>({
    queryKey: ["/api/projects", id],
    queryFn: () => api.get(`/api/projects/${id}`),
  });

  const handleGenerateComplete = () => {
    setShowGenerationModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    toast({
      title: lang === "ar" ? "تم إنشاء التقرير" : "Report Generated",
      description: lang === "ar" ? "تم إنشاء دراسة الجدوى بنجاح" : "Feasibility study generated successfully",
    });
  };

  const handleGenerateError = (error: string) => {
    setShowGenerationModal(false);
    toast({
      title: lang === "ar" ? "خطأ" : "Error",
      description: error,
      variant: "destructive",
    });
  };

  const handleDeleteProject = async () => {
    if (!confirm(lang === "ar" ? "هل أنت متأكد؟" : "Are you sure?")) return;
    
    setIsDeleting(true);
    try {
      await api.delete(`/api/projects/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: lang === "ar" ? "تم الحذف" : "Deleted",
        description: lang === "ar" ? "تم حذف المشروع" : "Project deleted successfully",
      });
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const texts = {
    en: {
      back: "Back to Dashboard",
      generate: "Generate Feasibility Study",
      generating: "Generating... This may take a minute",
      delete: "Delete Project",
      reports: "Reports",
      noReports: "No reports generated yet",
      generateFirst: "Generate your first feasibility study",
      viewReport: "View Report",
      projectDetails: "Project Details",
      industry: "Industry",
      country: "Country",
      currency: "Currency",
      investment: "Initial Investment",
      duration: "Project Duration",
      years: "years",
      version: "Version",
    },
    ar: {
      back: "العودة للوحة التحكم",
      generate: "توليد دراسة الجدوى",
      generating: "جاري التوليد... قد يستغرق دقيقة",
      delete: "حذف المشروع",
      reports: "التقارير",
      noReports: "لا توجد تقارير بعد",
      generateFirst: "قم بتوليد أول دراسة جدوى",
      viewReport: "عرض التقرير",
      projectDetails: "تفاصيل المشروع",
      industry: "القطاع",
      country: "البلد",
      currency: "العملة",
      investment: "الاستثمار الأولي",
      duration: "مدة المشروع",
      years: "سنوات",
      version: "الإصدار",
    },
  };

  const t = texts[lang as keyof typeof texts];
  const isRtl = lang === "ar";

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background py-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 max-w-4xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{lang === "ar" ? "المشروع غير موجود" : "Project not found"}</h2>
          <Link href="/dashboard">
            <Button>{lang === "ar" ? "العودة للوحة التحكم" : "Go to Dashboard"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-background py-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="link-back">
              {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t.back}
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowGenerationModal(true)}
              disabled={project.status === "generating"}
              className="gap-2"
              data-testid="button-generate"
            >
              <Sparkles className="w-4 h-4" />
              {t.generate}
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={handleDeleteProject}
              disabled={isDeleting}
              data-testid="button-delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.projectDetails}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t.industry}</p>
                  <p className="font-medium">{project.industry}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.country}</p>
                  <p className="font-medium">{project.country}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.currency}</p>
                  <p className="font-medium">{project.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.duration}</p>
                  <p className="font-medium">{project.projectDuration} {t.years}</p>
                </div>
                {project.initialInvestment && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">{t.investment}</p>
                    <p className="font-medium text-lg">
                      {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: project.currency,
                        minimumFractionDigits: 0,
                      }).format(parseFloat(project.initialInvestment))}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t.reports}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.reports && project.reports.length > 0 ? (
                <div className="space-y-3">
                  {project.reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                      data-testid={`report-item-${report.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BarChart3 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{t.version} {report.version}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(report.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Link href={`/reports/${report.id}`}>
                        <Button variant="outline" size="sm" data-testid={`button-view-${report.id}`}>
                          <Eye className="w-4 h-4 mr-2" />
                          {t.viewReport}
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">{t.noReports}</h3>
                  <p className="text-sm text-muted-foreground">{t.generateFirst}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ReportGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        projectId={parseInt(id!)}
        lang={lang as "en" | "ar"}
        onComplete={handleGenerateComplete}
        onError={handleGenerateError}
      />
    </div>
  );
}
