import { useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, ArrowRight, FileText, BarChart3, AlertTriangle, 
  TrendingUp, Target, Lightbulb, CheckCircle, Download, Loader2,
  Building2, DollarSign, Wallet, MapPin, Settings
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import type { FeasibilityReport, FinancialModel, MarketEstimate, RiskItem, Project } from "@shared/schema";

interface ReportData {
  report: FeasibilityReport;
  project: Project;
  financialModel: FinancialModel | null;
  marketEstimate: MarketEstimate | null;
  risks: RiskItem[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function ReportView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = user?.language || "en";
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useQuery<ReportData>({
    queryKey: ["/api/reports", id],
    queryFn: () => api.get(`/api/reports/${id}`),
  });

  const handleExportPDF = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const response = await fetch(`/api/reports/${id}/pdf`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const projectName = data.project.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      a.download = `${projectName}_دراسة_الجدوى_v${data.report.version}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: lang === "ar" ? "تم التصدير" : "Export Complete",
        description: lang === "ar" ? "تم تنزيل التقرير بنجاح" : "Report downloaded successfully",
      });
    } catch (error) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: lang === "ar" ? "فشل تصدير التقرير" : "Failed to export report",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const texts = {
    en: {
      back: "Back to Project",
      executiveSummary: "Executive Summary",
      projectDescription: "Project Description",
      marketAnalysis: "Market Analysis",
      locationAnalysis: "Location Analysis",
      operationalModel: "Operational Model",
      capexAnalysis: "CAPEX Analysis",
      opexAnalysis: "OPEX Analysis",
      revenueProjections: "Revenue Projections",
      financialAnalysis: "Financial Analysis",
      riskAnalysis: "Risk Analysis",
      recommendations: "Recommendations",
      conclusion: "Conclusion",
      keyMetrics: "Key Financial Metrics",
      npv: "Net Present Value (NPV)",
      irr: "Internal Rate of Return (IRR)",
      roi: "Return on Investment (ROI)",
      payback: "Payback Period",
      years: "years",
      marketSize: "Market Size Analysis",
      tam: "Total Addressable Market",
      sam: "Serviceable Addressable Market",
      som: "Serviceable Obtainable Market",
      growthRate: "Market Growth Rate",
      cashFlow: "Cash Flow Projection",
      year: "Year",
      revenue: "Revenue",
      expenses: "Expenses",
      riskMatrix: "Risk Assessment Matrix",
      likelihood: "Likelihood",
      impact: "Impact",
      mitigation: "Mitigation",
      exportPdf: "Export PDF",
      sensitivity: "Sensitivity Analysis",
      bestCase: "Optimistic Scenario",
      worstCase: "Conservative Scenario",
      baseCase: "Base Scenario",
      investmentDecision: "Investment Decision",
      goDecision: "GO - Proceed with Investment",
      noGoDecision: "NO-GO - Do Not Proceed",
      capexBreakdown: "Capital Expenditure Breakdown",
      opexBreakdown: "Operating Expenditure Breakdown",
      equipment: "Equipment",
      fixtures: "Fixtures & Installations",
      licenses: "Licenses & Permits",
      workingCapital: "Working Capital",
      salaries: "Salaries & Benefits",
      rent: "Rent & Utilities",
      marketing: "Marketing & Sales",
      maintenance: "Maintenance",
      other: "Other Expenses",
    },
    ar: {
      back: "العودة للمشروع",
      executiveSummary: "الملخص التنفيذي",
      projectDescription: "وصف المشروع",
      marketAnalysis: "تحليل السوق",
      locationAnalysis: "تحليل الموقع",
      operationalModel: "النموذج التشغيلي",
      capexAnalysis: "النفقات الرأسمالية",
      opexAnalysis: "النفقات التشغيلية",
      revenueProjections: "توقعات الإيرادات",
      financialAnalysis: "التحليل المالي",
      riskAnalysis: "تحليل المخاطر",
      recommendations: "التوصيات",
      conclusion: "الخلاصة",
      keyMetrics: "المؤشرات المالية الرئيسية",
      npv: "صافي القيمة الحالية",
      irr: "معدل العائد الداخلي",
      roi: "العائد على الاستثمار",
      payback: "فترة الاسترداد",
      years: "سنوات",
      marketSize: "تحليل حجم السوق",
      tam: "السوق الكلي المتاح",
      sam: "السوق القابل للخدمة",
      som: "السوق المحتمل الحصول عليه",
      growthRate: "معدل نمو السوق",
      cashFlow: "توقعات التدفق النقدي",
      year: "السنة",
      revenue: "الإيرادات",
      expenses: "المصروفات",
      riskMatrix: "مصفوفة تقييم المخاطر",
      likelihood: "الاحتمالية",
      impact: "التأثير",
      mitigation: "التخفيف",
      exportPdf: "تصدير PDF",
      sensitivity: "تحليل الحساسية",
      bestCase: "السيناريو المتفائل",
      worstCase: "السيناريو المتحفظ",
      baseCase: "السيناريو الأساسي",
      investmentDecision: "قرار الاستثمار",
      goDecision: "موافقة - المضي بالاستثمار",
      noGoDecision: "رفض - عدم المضي",
      capexBreakdown: "توزيع النفقات الرأسمالية",
      opexBreakdown: "توزيع النفقات التشغيلية",
      equipment: "المعدات",
      fixtures: "التجهيزات والتركيبات",
      licenses: "التراخيص والتصاريح",
      workingCapital: "رأس المال العامل",
      salaries: "الرواتب والمزايا",
      rent: "الإيجار والمرافق",
      marketing: "التسويق والمبيعات",
      maintenance: "الصيانة",
      other: "مصاريف أخرى",
    },
  };

  const t = texts[lang as keyof typeof texts];
  const isRtl = lang === "ar";

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: data?.project.currency || "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-background py-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="container mx-auto px-4 max-w-5xl">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`min-h-screen bg-background flex items-center justify-center ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{lang === "ar" ? "التقرير غير موجود" : "Report not found"}</h2>
          <Link href="/dashboard">
            <Button>{lang === "ar" ? "العودة للوحة التحكم" : "Go to Dashboard"}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { report, project, financialModel, marketEstimate, risks } = data;

  const cashFlowData = financialModel?.cashFlows?.map((cf, i) => ({
    year: i === 0 ? "Initial" : `Year ${i}`,
    cashFlow: cf,
    revenue: financialModel.revenueProjections?.[i - 1] || 0,
    expenses: financialModel.expenseProjections?.[i - 1] || 0,
  })) || [];

  const marketData = marketEstimate ? [
    { name: "TAM", value: parseFloat(marketEstimate.tam || "0") },
    { name: "SAM", value: parseFloat(marketEstimate.sam || "0") },
    { name: "SOM", value: parseFloat(marketEstimate.som || "0") },
  ] : [];

  const riskData = risks.map((risk) => ({
    name: lang === "ar" ? risk.titleAr : risk.titleEn,
    likelihood: risk.likelihood || 0,
    impact: risk.impact || 0,
    score: risk.riskScore || 0,
    category: risk.category,
  }));

  const getReportContent = (field: string) => {
    const enField = `${field}En` as keyof FeasibilityReport;
    const arField = `${field}Ar` as keyof FeasibilityReport;
    return (lang === "ar" ? report[arField] : report[enField]) as string || "";
  };

  return (
    <div className={`min-h-screen bg-background py-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm" data-testid="link-back">
              {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t.back}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={handleExportPDF}
            disabled={isExporting}
            data-testid="button-export"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {t.exportPdf}
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <p className="text-muted-foreground">
            {project.industry} • {project.country} • Version {report.version}
          </p>
        </div>

        <Tabs defaultValue="summary" className="space-y-6" dir={isRtl ? "rtl" : "ltr"}>
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <TabsList className="inline-flex gap-1 h-auto min-w-max">
              {(isRtl ? [
                { value: "conclusion", icon: CheckCircle, label: t.conclusion },
                { value: "recommendations", icon: Lightbulb, label: t.recommendations },
                { value: "risk", icon: AlertTriangle, label: t.riskAnalysis },
                { value: "financial", icon: BarChart3, label: t.financialAnalysis },
                { value: "operational", icon: Settings, label: t.operationalModel },
                { value: "market", icon: Target, label: t.marketAnalysis },
                { value: "summary", icon: FileText, label: t.executiveSummary },
              ] : [
                { value: "summary", icon: FileText, label: t.executiveSummary },
                { value: "market", icon: Target, label: t.marketAnalysis },
                { value: "operational", icon: Settings, label: t.operationalModel },
                { value: "financial", icon: BarChart3, label: t.financialAnalysis },
                { value: "risk", icon: AlertTriangle, label: t.riskAnalysis },
                { value: "recommendations", icon: Lightbulb, label: t.recommendations },
                { value: "conclusion", icon: CheckCircle, label: t.conclusion },
              ]).map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="gap-1 text-xs sm:text-sm px-3 py-2" data-testid={`tab-${tab.value}`}>
                  <tab.icon className="w-4 h-4 hidden sm:block" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="summary" className="space-y-6">
            {/* Investment Decision Banner */}
            {financialModel && (
              <Card className={`border-2 ${parseFloat(financialModel.irr || "0") > 15 ? "border-green-500 bg-green-500/5" : "border-yellow-500 bg-yellow-500/5"}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${parseFloat(financialModel.irr || "0") > 15 ? "bg-green-500" : "bg-yellow-500"}`}>
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t.investmentDecision}</p>
                        <p className={`text-xl font-bold ${parseFloat(financialModel.irr || "0") > 15 ? "text-green-500" : "text-yellow-500"}`}>
                          {parseFloat(financialModel.irr || "0") > 15 ? t.goDecision : t.noGoDecision}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">{t.irr}</p>
                        <p className="text-lg font-bold text-green-500">{parseFloat(financialModel.irr || "0").toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.roi}</p>
                        <p className="text-lg font-bold text-blue-500">{parseFloat(financialModel.roi || "0").toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.npv}</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(parseFloat(financialModel.npv || "0"))}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.payback}</p>
                        <p className="text-lg font-bold">{parseFloat(financialModel.paybackPeriod || "0").toFixed(1)} {t.years}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t.executiveSummary}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("executiveSummary")}</div>
              </CardContent>
            </Card>
            
            {/* Project Description Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t.projectDescription}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("projectDescription")}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="market" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  {t.marketAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("marketAnalysis")}</div>
              </CardContent>
            </Card>
            
            {/* Location Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  {t.locationAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("locationAnalysis")}</div>
              </CardContent>
            </Card>

            {marketEstimate && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.marketSize}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">{t.tam}</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(parseFloat(marketEstimate.tam || "0"))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">{t.sam}</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(parseFloat(marketEstimate.sam || "0"))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">{t.som}</span>
                        <span className="text-xl font-bold text-primary">
                          {formatCurrency(parseFloat(marketEstimate.som || "0"))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                        <span className="font-medium">{t.growthRate}</span>
                        <span className="text-xl font-bold text-green-500">
                          {((parseFloat(marketEstimate.marketGrowthRate || "0")) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={marketData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                          >
                            {marketData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="operational" className="space-y-6">
            {/* Operational Model */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  {t.operationalModel}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("operationalModel")}</div>
              </CardContent>
            </Card>
            
            {/* CAPEX Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {t.capexAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("capexAnalysis")}</div>
              </CardContent>
            </Card>
            
            {/* OPEX Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  {t.opexAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("opexAnalysis")}</div>
              </CardContent>
            </Card>
            
            {/* Revenue Projections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  {t.revenueProjections}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("revenueProjections")}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t.financialAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("financialAnalysis")}</div>
              </CardContent>
            </Card>

            {financialModel && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>{t.keyMetrics}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{t.npv}</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(parseFloat(financialModel.npv || "0"))}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{t.irr}</p>
                        <p className="text-2xl font-bold text-green-500">
                          {parseFloat(financialModel.irr || "0").toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{t.roi}</p>
                        <p className="text-2xl font-bold text-blue-500">
                          {parseFloat(financialModel.roi || "0").toFixed(1)}%
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{t.payback}</p>
                        <p className="text-2xl font-bold">
                          {parseFloat(financialModel.paybackPeriod || "0").toFixed(1)} {t.years}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t.cashFlow}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={cashFlowData.slice(1)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(v) => formatCurrency(v)} />
                          <Tooltip formatter={(v) => formatCurrency(v as number)} />
                          <Legend />
                          <Bar dataKey="revenue" name={t.revenue} fill="#00C49F" />
                          <Bar dataKey="expenses" name={t.expenses} fill="#FF8042" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {financialModel.sensitivityAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t.sensitivity}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <h4 className="font-medium text-green-500 mb-2">{t.bestCase}</h4>
                          <p className="text-sm text-muted-foreground mb-1">NPV: {formatCurrency(financialModel.sensitivityAnalysis.bestCase?.npv || 0)}</p>
                          <p className="text-sm text-muted-foreground mb-1">IRR: {(financialModel.sensitivityAnalysis.bestCase?.irr || 0).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">{financialModel.sensitivityAnalysis.bestCase?.assumptions}</p>
                        </div>
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <h4 className="font-medium text-blue-500 mb-2">{t.baseCase}</h4>
                          <p className="text-sm text-muted-foreground mb-1">NPV: {formatCurrency(financialModel.sensitivityAnalysis.baseCase?.npv || 0)}</p>
                          <p className="text-sm text-muted-foreground">IRR: {(financialModel.sensitivityAnalysis.baseCase?.irr || 0).toFixed(1)}%</p>
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <h4 className="font-medium text-red-500 mb-2">{t.worstCase}</h4>
                          <p className="text-sm text-muted-foreground mb-1">NPV: {formatCurrency(financialModel.sensitivityAnalysis.worstCase?.npv || 0)}</p>
                          <p className="text-sm text-muted-foreground mb-1">IRR: {(financialModel.sensitivityAnalysis.worstCase?.irr || 0).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">{financialModel.sensitivityAnalysis.worstCase?.assumptions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  {t.riskAnalysis}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("riskAnalysis")}</div>
              </CardContent>
            </Card>

            {risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.riskMatrix}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {risks.map((risk, i) => (
                      <div key={risk.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <h4 className="font-medium">{lang === "ar" ? risk.titleAr : risk.titleEn}</h4>
                            <p className="text-sm text-muted-foreground">
                              {lang === "ar" ? risk.descriptionAr : risk.descriptionEn}
                            </p>
                          </div>
                          <Badge 
                            variant={risk.riskScore && risk.riskScore > 15 ? "destructive" : risk.riskScore && risk.riskScore > 8 ? "default" : "secondary"}
                          >
                            {risk.category}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">{t.likelihood}:</span>
                            <span className="ml-2 font-medium">{risk.likelihood}/5</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">{t.impact}:</span>
                            <span className="ml-2 font-medium">{risk.impact}/5</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Score:</span>
                            <span className="ml-2 font-medium">{risk.riskScore}/25</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm">
                            <span className="font-medium text-primary">{t.mitigation}:</span>{" "}
                            {lang === "ar" ? risk.mitigationAr : risk.mitigationEn}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  {t.recommendations}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("recommendations")}</div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conclusion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {t.conclusion}
                </CardTitle>
              </CardHeader>
              <CardContent className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap">{getReportContent("conclusion")}</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
