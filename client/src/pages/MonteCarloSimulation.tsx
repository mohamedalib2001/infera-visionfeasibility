import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";
import { Dice5, Play, RefreshCw, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: string;
}

interface SimulationResult {
  iterations: number;
  npvDistribution: { value: number; frequency: number }[];
  irrDistribution: { value: number; frequency: number }[];
  statistics: {
    npvMean: number;
    npvStdDev: number;
    npvP5: number;
    npvP50: number;
    npvP95: number;
    irrMean: number;
    irrStdDev: number;
    irrP5: number;
    irrP50: number;
    irrP95: number;
    probabilityOfSuccess: number;
    probabilityOfLoss: number;
    valueAtRisk: number;
  };
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
}

export default function MonteCarloSimulation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [iterations, setIterations] = useState(1000);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const texts = {
    en: {
      title: "Monte Carlo Simulation",
      subtitle: "Probabilistic analysis with 1000+ scenarios",
      selectProject: "Select Project",
      iterations: "Simulations",
      runSimulation: "Run Simulation",
      running: "Running...",
      results: "Simulation Results",
      npvDistribution: "NPV Distribution",
      irrDistribution: "IRR Distribution",
      statistics: "Statistical Summary",
      mean: "Mean",
      stdDev: "Std. Deviation",
      percentile5: "5th Percentile (Worst)",
      percentile50: "50th Percentile (Median)",
      percentile95: "95th Percentile (Best)",
      probSuccess: "Probability of Success",
      probLoss: "Probability of Loss",
      valueAtRisk: "Value at Risk (5%)",
      confidence: "90% Confidence Interval",
      noProject: "Select a project to run simulation",
      completed: "Simulation completed",
    },
    ar: {
      title: "محاكاة مونت كارلو",
      subtitle: "تحليل احتمالي مع 1000+ سيناريو",
      selectProject: "اختر المشروع",
      iterations: "عدد المحاكاة",
      runSimulation: "تشغيل المحاكاة",
      running: "جاري التشغيل...",
      results: "نتائج المحاكاة",
      npvDistribution: "توزيع صافي القيمة الحالية",
      irrDistribution: "توزيع معدل العائد الداخلي",
      statistics: "الملخص الإحصائي",
      mean: "المتوسط",
      stdDev: "الانحراف المعياري",
      percentile5: "المئين الخامس (الأسوأ)",
      percentile50: "المئين الخمسين (الوسيط)",
      percentile95: "المئين 95 (الأفضل)",
      probSuccess: "احتمالية النجاح",
      probLoss: "احتمالية الخسارة",
      valueAtRisk: "القيمة المعرضة للخطر (5%)",
      confidence: "فترة الثقة 90%",
      noProject: "اختر مشروعاً لتشغيل المحاكاة",
      completed: "اكتملت المحاكاة",
    },
  };

  const t = texts[lang];

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const simulationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject}/monte-carlo`, {
        iterations,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSimulationResult(data);
      toast({ title: t.completed });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatCurrency = (value: number) => {
    if (Math.abs(value) >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <Dice5 className="w-8 h-8 text-primary" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.runSimulation}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t.selectProject}</label>
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

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t.iterations}: {iterations.toLocaleString()}
                </label>
                <Slider
                  value={[iterations]}
                  onValueChange={([val]) => setIterations(val)}
                  min={100}
                  max={10000}
                  step={100}
                  className="mt-2"
                  data-testid="slider-iterations"
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => simulationMutation.mutate()}
                  disabled={!selectedProject || simulationMutation.isPending}
                  className="w-full"
                  data-testid="button-run-simulation"
                >
                  {simulationMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      {t.running}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      {t.runSimulation}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {simulationMutation.isPending && (
              <div className="mt-6">
                <Progress value={65} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  Running {iterations.toLocaleString()} simulations...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {simulationResult && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.probSuccess}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPercent(simulationResult.statistics.probabilityOfSuccess)}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.probLoss}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPercent(simulationResult.statistics.probabilityOfLoss)}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.valueAtRisk}</p>
                      <p className="text-2xl font-bold">
                        {formatCurrency(simulationResult.statistics.valueAtRisk)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.confidence}</p>
                    <p className="text-lg font-bold">
                      {formatCurrency(simulationResult.confidenceInterval.lower)} -{" "}
                      {formatCurrency(simulationResult.confidenceInterval.upper)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t.npvDistribution}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simulationResult.npvDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="value"
                          tickFormatter={(v) => formatCurrency(v)}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [value, "Frequency"]}
                          labelFormatter={(label) => formatCurrency(label as number)}
                        />
                        <ReferenceLine
                          x={simulationResult.statistics.npvMean}
                          stroke="hsl(var(--primary))"
                          strokeDasharray="5 5"
                          label={{ value: t.mean, position: "top" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="frequency"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t.irrDistribution}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={simulationResult.irrDistribution}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="value"
                          tickFormatter={(v) => formatPercent(v)}
                          className="text-xs"
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          formatter={(value: number) => [value, "Frequency"]}
                          labelFormatter={(label) => formatPercent(label as number)}
                        />
                        <ReferenceLine
                          x={simulationResult.statistics.irrMean}
                          stroke="hsl(var(--primary))"
                          strokeDasharray="5 5"
                        />
                        <Bar dataKey="frequency" fill="hsl(var(--accent))" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{t.statistics}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">NPV {t.mean}</p>
                    <p className="text-lg font-semibold">{formatCurrency(simulationResult.statistics.npvMean)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">NPV {t.percentile5}</p>
                    <p className="text-lg font-semibold text-red-600">{formatCurrency(simulationResult.statistics.npvP5)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">NPV {t.percentile50}</p>
                    <p className="text-lg font-semibold">{formatCurrency(simulationResult.statistics.npvP50)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">NPV {t.percentile95}</p>
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(simulationResult.statistics.npvP95)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">IRR {t.mean}</p>
                    <p className="text-lg font-semibold">{formatPercent(simulationResult.statistics.irrMean)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {!selectedProject && !simulationResult && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Dice5 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noProject}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
