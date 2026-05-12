import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Download,
  Eye,
  Search,
  Loader2,
  Briefcase,
  Users,
  Building2,
  DollarSign,
  Scale,
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  status: string;
}

interface ContractTemplate {
  id: string;
  name: string;
  nameAr: string;
  category: "partnership" | "loan" | "investment" | "employment" | "nda" | "service";
  description: string;
  descriptionAr: string;
  fields: {
    key: string;
    label: string;
    labelAr: string;
    type: "text" | "number" | "date" | "currency";
    required: boolean;
  }[];
}

const TEMPLATES: ContractTemplate[] = [
  {
    id: "partnership-agreement",
    name: "Partnership Agreement",
    nameAr: "اتفاقية شراكة",
    category: "partnership",
    description: "Standard partnership agreement for business ventures",
    descriptionAr: "اتفاقية شراكة قياسية للمشاريع التجارية",
    fields: [
      { key: "partner1Name", label: "Partner 1 Name", labelAr: "اسم الشريك الأول", type: "text", required: true },
      { key: "partner2Name", label: "Partner 2 Name", labelAr: "اسم الشريك الثاني", type: "text", required: true },
      { key: "partner1Share", label: "Partner 1 Share (%)", labelAr: "حصة الشريك الأول (%)", type: "number", required: true },
      { key: "totalCapital", label: "Total Capital", labelAr: "رأس المال الإجمالي", type: "currency", required: true },
      { key: "startDate", label: "Start Date", labelAr: "تاريخ البدء", type: "date", required: true },
    ],
  },
  {
    id: "loan-agreement",
    name: "Loan Agreement",
    nameAr: "اتفاقية قرض",
    category: "loan",
    description: "Business loan agreement with repayment terms",
    descriptionAr: "اتفاقية قرض تجاري مع شروط السداد",
    fields: [
      { key: "lenderName", label: "Lender Name", labelAr: "اسم المُقرض", type: "text", required: true },
      { key: "borrowerName", label: "Borrower Name", labelAr: "اسم المقترض", type: "text", required: true },
      { key: "loanAmount", label: "Loan Amount", labelAr: "مبلغ القرض", type: "currency", required: true },
      { key: "interestRate", label: "Interest Rate (%)", labelAr: "نسبة الفائدة (%)", type: "number", required: true },
      { key: "termMonths", label: "Term (Months)", labelAr: "المدة (أشهر)", type: "number", required: true },
    ],
  },
  {
    id: "investment-agreement",
    name: "Investment Agreement",
    nameAr: "اتفاقية استثمار",
    category: "investment",
    description: "Equity investment agreement for startups",
    descriptionAr: "اتفاقية استثمار بالأسهم للشركات الناشئة",
    fields: [
      { key: "investorName", label: "Investor Name", labelAr: "اسم المستثمر", type: "text", required: true },
      { key: "companyName", label: "Company Name", labelAr: "اسم الشركة", type: "text", required: true },
      { key: "investmentAmount", label: "Investment Amount", labelAr: "مبلغ الاستثمار", type: "currency", required: true },
      { key: "equityShare", label: "Equity Share (%)", labelAr: "حصة الأسهم (%)", type: "number", required: true },
      { key: "valuation", label: "Pre-Money Valuation", labelAr: "التقييم قبل الاستثمار", type: "currency", required: true },
    ],
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    nameAr: "اتفاقية عدم إفشاء",
    category: "nda",
    description: "Mutual NDA for protecting confidential information",
    descriptionAr: "اتفاقية عدم إفشاء متبادلة لحماية المعلومات السرية",
    fields: [
      { key: "party1Name", label: "Party 1 Name", labelAr: "اسم الطرف الأول", type: "text", required: true },
      { key: "party2Name", label: "Party 2 Name", labelAr: "اسم الطرف الثاني", type: "text", required: true },
      { key: "effectiveDate", label: "Effective Date", labelAr: "تاريخ السريان", type: "date", required: true },
      { key: "duration", label: "Duration (Years)", labelAr: "المدة (سنوات)", type: "number", required: true },
    ],
  },
  {
    id: "service-agreement",
    name: "Service Agreement",
    nameAr: "اتفاقية خدمات",
    category: "service",
    description: "Professional services agreement",
    descriptionAr: "اتفاقية خدمات مهنية",
    fields: [
      { key: "providerName", label: "Service Provider", labelAr: "مقدم الخدمة", type: "text", required: true },
      { key: "clientName", label: "Client Name", labelAr: "اسم العميل", type: "text", required: true },
      { key: "serviceDescription", label: "Service Description", labelAr: "وصف الخدمة", type: "text", required: true },
      { key: "contractValue", label: "Contract Value", labelAr: "قيمة العقد", type: "currency", required: true },
      { key: "startDate", label: "Start Date", labelAr: "تاريخ البدء", type: "date", required: true },
    ],
  },
];

export default function ContractTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const texts = {
    en: {
      title: "Contract Templates",
      subtitle: "Generate customizable legal contracts",
      selectProject: "Select Project",
      search: "Search templates...",
      filterCategory: "Category",
      all: "All",
      partnership: "Partnership",
      loan: "Loan",
      investment: "Investment",
      employment: "Employment",
      nda: "NDA",
      service: "Service",
      generate: "Generate Contract",
      generating: "Generating...",
      preview: "Preview",
      download: "Download PDF",
      customize: "Customize Template",
      fillFields: "Fill in the contract details",
      cancel: "Cancel",
      noTemplates: "No templates found",
      generated: "Contract generated successfully",
      required: "Required",
    },
    ar: {
      title: "قوالب العقود",
      subtitle: "إنشاء عقود قانونية قابلة للتخصيص",
      selectProject: "اختر المشروع",
      search: "بحث في القوالب...",
      filterCategory: "الفئة",
      all: "الكل",
      partnership: "شراكة",
      loan: "قرض",
      investment: "استثمار",
      employment: "توظيف",
      nda: "عدم إفشاء",
      service: "خدمات",
      generate: "إنشاء العقد",
      generating: "جاري الإنشاء...",
      preview: "معاينة",
      download: "تحميل PDF",
      customize: "تخصيص القالب",
      fillFields: "املأ تفاصيل العقد",
      cancel: "إلغاء",
      noTemplates: "لم يتم العثور على قوالب",
      generated: "تم إنشاء العقد بنجاح",
      required: "مطلوب",
    },
  };

  const t = texts[lang];

  const CATEGORIES = [
    { value: "partnership", label: t.partnership, icon: Users },
    { value: "loan", label: t.loan, icon: DollarSign },
    { value: "investment", label: t.investment, icon: Briefcase },
    { value: "nda", label: t.nda, icon: Scale },
    { value: "service", label: t.service, icon: Building2 },
  ];

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/contracts/generate`, {
        templateId: selectedTemplate?.id,
        projectId: selectedProject,
        fields: fieldValues,
        language: lang,
      });
      return res.blob();
    },
    onSuccess: async (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTemplate?.id}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSelectedTemplate(null);
      setFieldValues({});
      toast({ title: t.generated });
    },
  });

  const filteredTemplates = TEMPLATES.filter((template) => {
    if (selectedCategory !== "all" && template.category !== selectedCategory) {
      return false;
    }
    const name = lang === "ar" ? template.nameAr : template.name;
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.icon || FileText;
  };

  const getCategoryLabel = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    return cat?.label || category;
  };

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <FileText className="w-8 h-8 text-primary" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t.filterCategory} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => {
              const Icon = getCategoryIcon(template.category);
              return (
                <Card key={template.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">
                          {lang === "ar" ? template.nameAr : template.name}
                        </CardTitle>
                        <Badge variant="outline" className="mt-2">
                          {getCategoryLabel(template.category)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      {lang === "ar" ? template.descriptionAr : template.description}
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setFieldValues({});
                          }}
                          disabled={!selectedProject}
                          data-testid={`button-template-${template.id}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {t.customize}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>
                            {lang === "ar" ? template.nameAr : template.name}
                          </DialogTitle>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh]">
                          <div className="space-y-4 p-1">
                            <p className="text-sm text-muted-foreground">{t.fillFields}</p>
                            {template.fields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2">
                                  {lang === "ar" ? field.labelAr : field.label}
                                  {field.required && (
                                    <span className="text-red-500 text-xs">*{t.required}</span>
                                  )}
                                </label>
                                <Input
                                  type={field.type === "date" ? "date" : field.type === "number" || field.type === "currency" ? "number" : "text"}
                                  value={fieldValues[field.key] || ""}
                                  onChange={(e) =>
                                    setFieldValues((prev) => ({
                                      ...prev,
                                      [field.key]: e.target.value,
                                    }))
                                  }
                                  placeholder={lang === "ar" ? field.labelAr : field.label}
                                  data-testid={`input-${field.key}`}
                                />
                              </div>
                            ))}
                            <div className="flex justify-end gap-2 pt-4">
                              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                                {t.cancel}
                              </Button>
                              <Button
                                onClick={() => generateMutation.mutate()}
                                disabled={
                                  generateMutation.isPending ||
                                  template.fields
                                    .filter((f) => f.required)
                                    .some((f) => !fieldValues[f.key])
                                }
                                data-testid="button-generate-contract"
                              >
                                {generateMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t.generating}
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-4 h-4 mr-2" />
                                    {t.generate}
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <Card className="col-span-full">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t.noTemplates}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
