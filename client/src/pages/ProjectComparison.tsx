import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GitCompare, TrendingUp, TrendingDown, Minus, ArrowUpDown, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface Project {
  id: number;
  name: string;
  industry: string;
  country: string;
  status: string;
  createdAt: string;
}

interface ComparisonData {
  projectId: number;
  projectName: string;
  npv: number;
  irr: number;
  roi: number;
  paybackPeriod: number;
  breakEvenPoint: number;
  totalCapex: number;
  totalOpex: number;
  year1Revenue: number;
  year5Revenue: number;
  riskScore: number;
  decision: string;
}

export default function ProjectComparison() {
  const { user } = useAuth();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<string>("irr");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const texts = {
    en: {
      title: "Project Comparison",
      subtitle: "Compare multiple projects side by side",
      selectProjects: "Select Projects to Compare",
      compare: "Compare Selected",
      metric: "Metric",
      npv: "Net Present Value (NPV)",
      irr: "Internal Rate of Return (IRR)",
      roi: "Return on Investment (ROI)",
      payback: "Payback Period",
      breakeven: "Break-even Point",
      capex: "Total CAPEX",
      opex: "Annual OPEX",
      revenue1: "Year 1 Revenue",
      revenue5: "Year 5 Revenue",
      risk: "Risk Score",
      decision: "Investment Decision",
      sortBy: "Sort By",
      ranking: "Project Ranking",
      best: "Best",
      noProjects: "No completed projects to compare",
      selectAtLeast: "Select at least 2 projects to compare",
      go: "GO",
      conditionalGo: "Conditional GO",
      noGo: "NO-GO",
      years: "years",
      months: "months",
    },
    ar: {
      title: "مقارنة المشاريع",
      subtitle: "قارن عدة مشاريع جنباً إلى جنب",
      selectProjects: "اختر المشاريع للمقارنة",
      compare: "قارن المختار",
      metric: "المقياس",
      npv: "صافي القيمة الحالية (NPV)",
      irr: "معدل العائد الداخلي (IRR)",
      roi: "العائد على الاستثمار (ROI)",
      payback: "فترة الاسترداد",
      breakeven: "نقطة التعادل",
      capex: "إجمالي CAPEX",
      opex: "OPEX السنوي",
      revenue1: "إيرادات السنة الأولى",
      revenue5: "إيرادات السنة الخامسة",
      risk: "درجة المخاطر",
      decision: "قرار الاستثمار",
      sortBy: "ترتيب حسب",
      ranking: "ترتيب المشاريع",
      best: "الأفضل",
      noProjects: "لا توجد مشاريع مكتملة للمقارنة",
      selectAtLeast: "اختر مشروعين على الأقل للمقارنة",
      go: "موافقة",
      conditionalGo: "موافقة مشروطة",
      noGo: "رفض",
      years: "سنوات",
      months: "أشهر",
    },
  };

  const t = texts[lang];

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const { data: comparisonData, isLoading: comparisonLoading } = useQuery<ComparisonData[]>({
    queryKey: ["/api/projects/compare", selectedProjects],
    enabled: selectedProjects.length >= 2,
  });

  const toggleProject = (projectId: number) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  const sortedData = comparisonData
    ? [...comparisonData].sort((a, b) => {
        const aVal = a[sortBy as keyof ComparisonData] as number;
        const bVal = b[sortBy as keyof ComparisonData] as number;
        return sortOrder === "desc" ? bVal - aVal : aVal - bVal;
      })
    : [];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getDecisionBadge = (decision: string) => {
    if (decision.toLowerCase().includes("go") && !decision.toLowerCase().includes("no")) {
      if (decision.toLowerCase().includes("conditional")) {
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <AlertCircle className="w-3 h-3 mr-1" />
            {t.conditionalGo}
          </Badge>
        );
      }
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t.go}
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
        <XCircle className="w-3 h-3 mr-1" />
        {t.noGo}
      </Badge>
    );
  };

  const getBestIndicator = (data: ComparisonData[], current: ComparisonData, metric: keyof ComparisonData, higherIsBetter: boolean = true) => {
    if (data.length < 2) return null;
    const values = data.map((d) => d[metric] as number);
    const best = higherIsBetter ? Math.max(...values) : Math.min(...values);
    const isBest = (current[metric] as number) === best;
    
    if (isBest) {
      return <Badge variant="outline" className="ml-2 text-xs bg-green-500/10 text-green-600">{t.best}</Badge>;
    }
    return null;
  };

  const getComparisonIcon = (value: number, average: number) => {
    if (value > average * 1.1) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (value < average * 0.9) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-8 h-8 text-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">{t.selectProjects}</CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : completedProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noProjects}</p>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {completedProjects.map((project) => (
                      <div
                        key={project.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedProjects.includes(project.id)
                            ? "bg-primary/5 border-primary"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleProject(project.id)}
                        data-testid={`checkbox-project-${project.id}`}
                      >
                        <Checkbox
                          checked={selectedProjects.includes(project.id)}
                          onCheckedChange={() => toggleProject(project.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{project.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {project.industry} • {project.country}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle className="text-lg">{t.ranking}</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort-by">
                    <SelectValue placeholder={t.sortBy} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="irr">{t.irr}</SelectItem>
                    <SelectItem value="npv">{t.npv}</SelectItem>
                    <SelectItem value="roi">{t.roi}</SelectItem>
                    <SelectItem value="paybackPeriod">{t.payback}</SelectItem>
                    <SelectItem value="riskScore">{t.risk}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                  data-testid="button-sort-order"
                >
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {selectedProjects.length < 2 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t.selectAtLeast}</p>
                </div>
              ) : comparisonLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : sortedData.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="sticky left-0 bg-background">{t.metric}</TableHead>
                        {sortedData.map((data, idx) => (
                          <TableHead key={data.projectId} className="text-center min-w-[150px]">
                            <div className="flex items-center justify-center gap-2">
                              {idx === 0 && (
                                <Badge className="bg-primary/10 text-primary text-xs">#{idx + 1}</Badge>
                              )}
                              <span className="truncate max-w-[100px]">{data.projectName}</span>
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.irr}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            <span className="font-semibold">{formatPercent(data.irr)}</span>
                            {getBestIndicator(sortedData, data, "irr")}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.npv}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            <span className="font-semibold">{formatCurrency(data.npv)}</span>
                            {getBestIndicator(sortedData, data, "npv")}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.roi}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            {formatPercent(data.roi)}
                            {getBestIndicator(sortedData, data, "roi")}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.payback}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            {data.paybackPeriod.toFixed(1)} {t.years}
                            {getBestIndicator(sortedData, data, "paybackPeriod", false)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.capex}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            {formatCurrency(data.totalCapex)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.opex}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            {formatCurrency(data.totalOpex)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.revenue5}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            {formatCurrency(data.year5Revenue)}
                            {getBestIndicator(sortedData, data, "year5Revenue")}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.risk}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            <Badge variant={data.riskScore > 3 ? "destructive" : data.riskScore > 2 ? "secondary" : "default"}>
                              {data.riskScore.toFixed(1)}/5
                            </Badge>
                            {getBestIndicator(sortedData, data, "riskScore", false)}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium sticky left-0 bg-background">{t.decision}</TableCell>
                        {sortedData.map((data) => (
                          <TableCell key={data.projectId} className="text-center">
                            {getDecisionBadge(data.decision)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
