import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Bell,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface Project {
  id: number;
  name: string;
  status: string;
}

interface KPIEntry {
  id: number;
  projectId: number;
  kpiName: string;
  plannedValue: number;
  actualValue: number;
  unit: string;
  period: string;
  variance: number;
  status: "on_track" | "warning" | "critical";
  createdAt: string;
}

interface KPIAlert {
  id: number;
  kpiName: string;
  message: string;
  severity: "warning" | "critical";
  createdAt: string;
}

export default function KPITracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newKPI, setNewKPI] = useState({
    kpiName: "",
    plannedValue: "",
    actualValue: "",
    unit: "",
    period: format(new Date(), "yyyy-MM"),
  });

  const texts = {
    en: {
      title: "KPI Tracker",
      subtitle: "Track actual vs planned performance",
      selectProject: "Select Project",
      addKPI: "Add KPI Entry",
      kpiName: "KPI Name",
      planned: "Planned",
      actual: "Actual",
      variance: "Variance",
      status: "Status",
      unit: "Unit",
      period: "Period",
      save: "Save",
      cancel: "Cancel",
      onTrack: "On Track",
      warning: "Warning",
      critical: "Critical",
      alerts: "Performance Alerts",
      trend: "Performance Trend",
      noProject: "Select a project to track KPIs",
      noData: "No KPI data yet. Add your first entry!",
      revenue: "Revenue",
      customers: "Customers",
      margin: "Profit Margin",
      utilization: "Capacity Utilization",
      saved: "KPI entry saved",
    },
    ar: {
      title: "متتبع مؤشرات الأداء",
      subtitle: "تتبع الأداء الفعلي مقابل المخطط",
      selectProject: "اختر المشروع",
      addKPI: "إضافة مؤشر أداء",
      kpiName: "اسم المؤشر",
      planned: "المخطط",
      actual: "الفعلي",
      variance: "الانحراف",
      status: "الحالة",
      unit: "الوحدة",
      period: "الفترة",
      save: "حفظ",
      cancel: "إلغاء",
      onTrack: "على المسار",
      warning: "تحذير",
      critical: "حرج",
      alerts: "تنبيهات الأداء",
      trend: "اتجاه الأداء",
      noProject: "اختر مشروعاً لتتبع مؤشرات الأداء",
      noData: "لا توجد بيانات. أضف أول إدخال!",
      revenue: "الإيرادات",
      customers: "العملاء",
      margin: "هامش الربح",
      utilization: "نسبة الاستغلال",
      saved: "تم حفظ المؤشر",
    },
  };

  const t = texts[lang];

  const predefinedKPIs = [
    { name: t.revenue, unit: "$" },
    { name: t.customers, unit: "" },
    { name: t.margin, unit: "%" },
    { name: t.utilization, unit: "%" },
  ];

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const { data: kpiData } = useQuery<KPIEntry[]>({
    queryKey: ["/api/projects", selectedProject, "kpis"],
    enabled: !!selectedProject,
  });

  const { data: alerts } = useQuery<KPIAlert[]>({
    queryKey: ["/api/projects", selectedProject, "kpi-alerts"],
    enabled: !!selectedProject,
  });

  const addKPIMutation = useMutation({
    mutationFn: async (data: typeof newKPI) => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject}/kpis`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedProject, "kpis"] });
      setIsAddDialogOpen(false);
      setNewKPI({ kpiName: "", plannedValue: "", actualValue: "", unit: "", period: format(new Date(), "yyyy-MM") });
      toast({ title: t.saved });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "on_track":
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            {t.onTrack}
          </Badge>
        );
      case "warning":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t.warning}
          </Badge>
        );
      case "critical":
        return (
          <Badge className="bg-red-500/10 text-red-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            {t.critical}
          </Badge>
        );
      default:
        return null;
    }
  };

  const groupedKPIs = kpiData?.reduce((acc, kpi) => {
    if (!acc[kpi.kpiName]) acc[kpi.kpiName] = [];
    acc[kpi.kpiName].push(kpi);
    return acc;
  }, {} as Record<string, KPIEntry[]>) || {};

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <Target className="w-8 h-8 text-primary" />
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
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-kpi">
                      <Plus className="w-4 h-4 mr-2" />
                      {t.addKPI}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t.addKPI}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">{t.kpiName}</label>
                        <Select
                          value={newKPI.kpiName}
                          onValueChange={(val) => {
                            const kpi = predefinedKPIs.find((k) => k.name === val);
                            setNewKPI({ ...newKPI, kpiName: val, unit: kpi?.unit || "" });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t.kpiName} />
                          </SelectTrigger>
                          <SelectContent>
                            {predefinedKPIs.map((kpi) => (
                              <SelectItem key={kpi.name} value={kpi.name}>
                                {kpi.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t.planned}</label>
                          <Input
                            type="number"
                            value={newKPI.plannedValue}
                            onChange={(e) => setNewKPI({ ...newKPI, plannedValue: e.target.value })}
                            data-testid="input-planned"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t.actual}</label>
                          <Input
                            type="number"
                            value={newKPI.actualValue}
                            onChange={(e) => setNewKPI({ ...newKPI, actualValue: e.target.value })}
                            data-testid="input-actual"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t.unit}</label>
                          <Input
                            value={newKPI.unit}
                            onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
                            data-testid="input-unit"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t.period}</label>
                          <Input
                            type="month"
                            value={newKPI.period}
                            onChange={(e) => setNewKPI({ ...newKPI, period: e.target.value })}
                            data-testid="input-period"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                          {t.cancel}
                        </Button>
                        <Button
                          onClick={() => addKPIMutation.mutate(newKPI)}
                          disabled={!newKPI.kpiName || !newKPI.plannedValue}
                          data-testid="button-save-kpi"
                        >
                          {t.save}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noProject}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {alerts && alerts.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    {t.alerts}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          alert.severity === "critical" ? "bg-red-500/10" : "bg-yellow-500/10"
                        }`}
                      >
                        <AlertTriangle
                          className={`w-5 h-5 flex-shrink-0 ${
                            alert.severity === "critical" ? "text-red-600" : "text-yellow-600"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{alert.kpiName}</p>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(alert.createdAt), "MMM dd")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {Object.keys(groupedKPIs).length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t.noData}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(groupedKPIs).map(([kpiName, entries]) => {
                  const latestEntry = entries[entries.length - 1];
                  const trendData = entries.map((e) => ({
                    period: e.period,
                    planned: e.plannedValue,
                    actual: e.actualValue,
                  }));

                  return (
                    <Card key={kpiName}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{kpiName}</CardTitle>
                          {getStatusBadge(latestEntry.status)}
                        </div>
                        <CardDescription>
                          {t.variance}: {latestEntry.variance > 0 ? "+" : ""}
                          {latestEntry.variance.toFixed(1)}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">{t.planned}</p>
                            <p className="text-xl font-bold">
                              {latestEntry.unit === "$" ? "$" : ""}
                              {latestEntry.plannedValue.toLocaleString()}
                              {latestEntry.unit === "%" ? "%" : ""}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm text-muted-foreground">{t.actual}</p>
                            <p className={`text-xl font-bold ${
                              latestEntry.variance >= 0 ? "text-green-600" : "text-red-600"
                            }`}>
                              {latestEntry.unit === "$" ? "$" : ""}
                              {latestEntry.actualValue.toLocaleString()}
                              {latestEntry.unit === "%" ? "%" : ""}
                            </p>
                          </div>
                        </div>

                        <div className="h-[150px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis dataKey="period" className="text-xs" />
                              <YAxis className="text-xs" />
                              <Tooltip />
                              <Legend />
                              <Line
                                type="monotone"
                                dataKey="planned"
                                stroke="hsl(var(--muted-foreground))"
                                strokeDasharray="5 5"
                                name={t.planned}
                              />
                              <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                name={t.actual}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
