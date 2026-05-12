import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  Search,
  Loader2,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  industry: string;
  status: string;
}

interface Competitor {
  id: number;
  name: string;
  website?: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketShare?: number;
  pricePosition: "premium" | "mid" | "budget";
  scores: {
    product: number;
    price: number;
    marketing: number;
    distribution: number;
    service: number;
  };
}

interface CompetitorAnalysisResult {
  competitors: Competitor[];
  marketPosition: {
    dimension: string;
    you: number;
    average: number;
  }[];
  recommendations: string[];
}

export default function CompetitorAnalysis() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [competitorName, setCompetitorName] = useState("");

  const texts = {
    en: {
      title: "Competitor Analysis",
      subtitle: "AI-powered competitor research and SWOT analysis",
      selectProject: "Select Project",
      analyze: "Analyze Competitors",
      analyzing: "Analyzing with AI...",
      addCompetitor: "Add Competitor",
      competitorName: "Competitor Name",
      strengths: "Strengths",
      weaknesses: "Weaknesses",
      opportunities: "Opportunities",
      threats: "Threats",
      marketShare: "Market Share",
      pricePosition: "Price Position",
      premium: "Premium",
      mid: "Mid-range",
      budget: "Budget",
      swotAnalysis: "SWOT Analysis",
      marketPositioning: "Market Positioning",
      recommendations: "Strategic Recommendations",
      noProject: "Select a project to analyze competitors",
      noCompetitors: "No competitors analyzed yet",
      product: "Product Quality",
      price: "Price Competitiveness",
      marketing: "Marketing Strength",
      distribution: "Distribution",
      service: "Customer Service",
      you: "Your Business",
      competitors: "Competitors Avg",
    },
    ar: {
      title: "تحليل المنافسين",
      subtitle: "بحث وتحليل SWOT بالذكاء الاصطناعي",
      selectProject: "اختر المشروع",
      analyze: "تحليل المنافسين",
      analyzing: "جاري التحليل بالذكاء الاصطناعي...",
      addCompetitor: "إضافة منافس",
      competitorName: "اسم المنافس",
      strengths: "نقاط القوة",
      weaknesses: "نقاط الضعف",
      opportunities: "الفرص",
      threats: "التهديدات",
      marketShare: "الحصة السوقية",
      pricePosition: "التموضع السعري",
      premium: "متميز",
      mid: "متوسط",
      budget: "اقتصادي",
      swotAnalysis: "تحليل SWOT",
      marketPositioning: "التموضع السوقي",
      recommendations: "التوصيات الاستراتيجية",
      noProject: "اختر مشروعاً لتحليل المنافسين",
      noCompetitors: "لا توجد تحليلات بعد",
      product: "جودة المنتج",
      price: "القدرة التنافسية السعرية",
      marketing: "القوة التسويقية",
      distribution: "التوزيع",
      service: "خدمة العملاء",
      you: "مشروعك",
      competitors: "متوسط المنافسين",
    },
  };

  const t = texts[lang];

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const { data: analysisResult } = useQuery<CompetitorAnalysisResult>({
    queryKey: ["/api/projects", selectedProject, "competitors"],
    enabled: !!selectedProject,
  });

  const analyzeMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject}/competitors/analyze`, {
        competitorName: name,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "competitors"] });
      setCompetitorName("");
      toast({ title: lang === "en" ? "Competitor analyzed" : "تم تحليل المنافس" });
    },
  });

  const getPricePositionBadge = (position: string) => {
    switch (position) {
      case "premium":
        return <Badge className="bg-purple-500/10 text-purple-600">{t.premium}</Badge>;
      case "mid":
        return <Badge className="bg-blue-500/10 text-blue-600">{t.mid}</Badge>;
      case "budget":
        return <Badge className="bg-green-500/10 text-green-600">{t.budget}</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <Users className="w-8 h-8 text-primary" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger data-testid="select-project">
                    <SelectValue placeholder={t.selectProject} />
                  </SelectTrigger>
                  <SelectContent>
                    {completedProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProject && (
                <div className="flex gap-2">
                  <Input
                    placeholder={t.competitorName}
                    value={competitorName}
                    onChange={(e) => setCompetitorName(e.target.value)}
                    className="w-[200px]"
                    data-testid="input-competitor-name"
                  />
                  <Button
                    onClick={() => analyzeMutation.mutate(competitorName)}
                    disabled={!competitorName || analyzeMutation.isPending}
                    data-testid="button-analyze"
                  >
                    {analyzeMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.analyzing}
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        {t.analyze}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {analyzeMutation.isPending && (
              <div className="mt-6">
                <Progress value={65} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {!selectedProject ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noProject}</p>
              </div>
            </CardContent>
          </Card>
        ) : analysisResult ? (
          <>
            {analysisResult.marketPosition && analysisResult.marketPosition.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.marketPositioning}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={analysisResult.marketPosition}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="dimension" className="text-sm" />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} />
                        <Radar
                          name={t.you}
                          dataKey="you"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.4}
                        />
                        <Radar
                          name={t.competitors}
                          dataKey="average"
                          stroke="hsl(var(--muted-foreground))"
                          fill="hsl(var(--muted-foreground))"
                          fillOpacity={0.2}
                        />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analysisResult.competitors?.map((competitor) => (
                <Card key={competitor.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{competitor.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        {competitor.marketShare && (
                          <Badge variant="outline">{competitor.marketShare}% {t.marketShare}</Badge>
                        )}
                        {getPricePositionBadge(competitor.pricePosition)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-600">{t.strengths}</p>
                        <ul className="text-sm space-y-1">
                          {competitor.strengths.map((s, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-red-600">{t.weaknesses}</p>
                        <ul className="text-sm space-y-1">
                          {competitor.weaknesses.map((w, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-blue-600">{t.opportunities}</p>
                        <ul className="text-sm space-y-1">
                          {competitor.opportunities.map((o, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Target className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-yellow-600">{t.threats}</p>
                        <ul className="text-sm space-y-1">
                          {competitor.threats.map((th, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <Minus className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                              <span>{th}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t.recommendations}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {analysisResult.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noCompetitors}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
