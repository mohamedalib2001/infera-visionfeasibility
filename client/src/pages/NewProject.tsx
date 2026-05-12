import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2, Plus, X, Globe } from "lucide-react";
import type { Project } from "@shared/schema";

const industries = [
  "Technology", "Healthcare", "Finance", "Real Estate", "E-commerce",
  "Manufacturing", "Education", "Food & Beverage", "Transportation", "Energy",
  "Agriculture", "Tourism", "Retail", "Construction", "Entertainment"
];

const countries = [
  "Saudi Arabia", "UAE", "Egypt", "Jordan", "Kuwait", "Qatar", "Bahrain",
  "Oman", "Morocco", "Tunisia", "USA", "UK", "Germany", "France", "Other"
];

const currencies = ["USD", "SAR", "AED", "EGP", "EUR", "GBP"];

export default function NewProject() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lang") as "en" | "ar";
      return stored || (user?.language as "en" | "ar") || "en";
    }
    return (user?.language as "en" | "ar") || "en";
  });
  const isRtl = lang === "ar";

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    country: "",
    currency: "USD",
    initialInvestment: "",
    projectDuration: "5",
    productDescription: "",
    targetCustomers: "",
    competitiveAdvantage: "",
    revenueStreams: [] as string[],
    monthlyOperatingCosts: "",
    expectedMonthlyRevenue: "",
    marketSize: "",
    growthStrategy: "",
    // Client/Recipient Information
    clientName: "",
    clientCompany: "",
    clientEmail: "",
    clientPhone: "",
    clientAddress: "",
    clientType: "" as "" | "individual" | "company" | "organization" | "government",
  });

  const [newRevenueStream, setNewRevenueStream] = useState("");

  const createProject = useMutation({
    mutationFn: async () => {
      return api.post<Project>("/api/projects", {
        name: formData.name,
        description: formData.description,
        industry: formData.industry,
        country: formData.country,
        currency: formData.currency,
        initialInvestment: formData.initialInvestment ? parseFloat(formData.initialInvestment) : undefined,
        projectDuration: parseInt(formData.projectDuration),
        inputs: {
          productDescription: formData.productDescription,
          targetCustomers: formData.targetCustomers,
          competitiveAdvantage: formData.competitiveAdvantage,
          revenueStreams: formData.revenueStreams,
          monthlyOperatingCosts: formData.monthlyOperatingCosts ? parseFloat(formData.monthlyOperatingCosts) : undefined,
          expectedMonthlyRevenue: formData.expectedMonthlyRevenue ? parseFloat(formData.expectedMonthlyRevenue) : undefined,
          marketSize: formData.marketSize ? parseFloat(formData.marketSize) : undefined,
          growthStrategy: formData.growthStrategy,
        },
        // Client/Recipient Information
        clientName: formData.clientName || undefined,
        clientCompany: formData.clientCompany || undefined,
        clientEmail: formData.clientEmail || undefined,
        clientPhone: formData.clientPhone || undefined,
        clientAddress: formData.clientAddress || undefined,
        clientType: formData.clientType || undefined,
      });
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: lang === "ar" ? "تم إنشاء المشروع" : "Project Created",
        description: lang === "ar" ? "يمكنك الآن توليد دراسة الجدوى" : "You can now generate the feasibility study",
      });
      setLocation(`/projects/${project.id}`);
    },
    onError: (error) => {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.industry || !formData.country) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: lang === "ar" ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createProject.mutate();
  };

  const addRevenueStream = () => {
    if (newRevenueStream.trim()) {
      setFormData({
        ...formData,
        revenueStreams: [...formData.revenueStreams, newRevenueStream.trim()],
      });
      setNewRevenueStream("");
    }
  };

  const removeRevenueStream = (index: number) => {
    setFormData({
      ...formData,
      revenueStreams: formData.revenueStreams.filter((_, i) => i !== index),
    });
  };

  const texts = {
    en: {
      title: "Create New Project",
      subtitle: "Enter your project details to generate a feasibility study",
      basicInfo: "Basic Information",
      projectName: "Project Name",
      projectNamePlaceholder: "e.g., Mobile App Development",
      description: "Description",
      descriptionPlaceholder: "Brief description of your project...",
      industry: "Industry",
      selectIndustry: "Select industry",
      country: "Country",
      selectCountry: "Select country",
      currency: "Currency",
      financialInfo: "Financial Information",
      initialInvestment: "Initial Investment",
      investmentPlaceholder: "e.g., 100000",
      projectDuration: "Project Duration (Years)",
      monthlyOpex: "Monthly Operating Costs",
      monthlyRevenue: "Expected Monthly Revenue",
      businessDetails: "Business Details",
      productDescription: "Product/Service Description",
      productPlaceholder: "Describe your product or service...",
      targetCustomers: "Target Customers",
      customersPlaceholder: "Who are your target customers?",
      competitiveAdvantage: "Competitive Advantage",
      advantagePlaceholder: "What makes you different?",
      revenueStreams: "Revenue Streams",
      addStream: "Add",
      streamPlaceholder: "e.g., Subscription fees",
      marketSize: "Estimated Market Size",
      marketPlaceholder: "Total addressable market",
      growthStrategy: "Growth Strategy",
      strategyPlaceholder: "How will you grow?",
      back: "Back",
      create: "Create Project",
      creating: "Creating...",
      // Client/Recipient Section
      clientInfo: "Study Recipient Information",
      clientInfoDesc: "Details of who this feasibility study is prepared for",
      clientName: "Recipient Name",
      clientNamePlaceholder: "Full name of the client/recipient",
      clientCompany: "Company/Organization",
      clientCompanyPlaceholder: "Company or organization name",
      clientEmail: "Email",
      clientEmailPlaceholder: "recipient@example.com",
      clientPhone: "Phone Number",
      clientPhonePlaceholder: "+966 5XX XXX XXXX",
      clientAddress: "Address",
      clientAddressPlaceholder: "Business address",
      clientType: "Client Type",
      selectClientType: "Select client type",
      clientTypeIndividual: "Individual",
      clientTypeCompany: "Company",
      clientTypeOrganization: "Organization",
      clientTypeGovernment: "Government",
    },
    ar: {
      title: "إنشاء مشروع جديد",
      subtitle: "أدخل تفاصيل مشروعك لتوليد دراسة الجدوى",
      basicInfo: "معلومات أساسية",
      projectName: "اسم المشروع",
      projectNamePlaceholder: "مثال: تطوير تطبيق موبايل",
      description: "الوصف",
      descriptionPlaceholder: "وصف موجز لمشروعك...",
      industry: "القطاع",
      selectIndustry: "اختر القطاع",
      country: "البلد",
      selectCountry: "اختر البلد",
      currency: "العملة",
      financialInfo: "المعلومات المالية",
      initialInvestment: "الاستثمار الأولي",
      investmentPlaceholder: "مثال: 100000",
      projectDuration: "مدة المشروع (سنوات)",
      monthlyOpex: "التكاليف التشغيلية الشهرية",
      monthlyRevenue: "الإيرادات الشهرية المتوقعة",
      businessDetails: "تفاصيل العمل",
      productDescription: "وصف المنتج/الخدمة",
      productPlaceholder: "صف منتجك أو خدمتك...",
      targetCustomers: "العملاء المستهدفون",
      customersPlaceholder: "من هم عملاؤك المستهدفون؟",
      competitiveAdvantage: "الميزة التنافسية",
      advantagePlaceholder: "ما الذي يميزك؟",
      revenueStreams: "مصادر الإيرادات",
      addStream: "إضافة",
      streamPlaceholder: "مثال: رسوم الاشتراك",
      marketSize: "حجم السوق المقدر",
      marketPlaceholder: "إجمالي السوق المتاح",
      growthStrategy: "استراتيجية النمو",
      strategyPlaceholder: "كيف ستنمو؟",
      back: "رجوع",
      create: "إنشاء المشروع",
      creating: "جاري الإنشاء...",
      // Client/Recipient Section
      clientInfo: "بيانات الجهة المستفيدة من الدراسة",
      clientInfoDesc: "تفاصيل من أُعدت له دراسة الجدوى",
      clientName: "اسم المستفيد",
      clientNamePlaceholder: "الاسم الكامل للعميل/المستفيد",
      clientCompany: "الشركة/المؤسسة",
      clientCompanyPlaceholder: "اسم الشركة أو المؤسسة",
      clientEmail: "البريد الإلكتروني",
      clientEmailPlaceholder: "recipient@example.com",
      clientPhone: "رقم الهاتف",
      clientPhonePlaceholder: "+966 5XX XXX XXXX",
      clientAddress: "العنوان",
      clientAddressPlaceholder: "عنوان العمل",
      clientType: "نوع العميل",
      selectClientType: "اختر نوع العميل",
      clientTypeIndividual: "فرد",
      clientTypeCompany: "شركة",
      clientTypeOrganization: "مؤسسة",
      clientTypeGovernment: "جهة حكومية",
    },
  };

  const t = texts[lang as keyof typeof texts];

  return (
    <div className={`min-h-screen bg-background py-8 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" data-testid="link-back">
              {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {t.back}
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={toggleLanguage} data-testid="button-language">
            <Globe className="w-4 h-4" />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t.title}</CardTitle>
            <CardDescription>{t.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.basicInfo}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">{t.projectName} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t.projectNamePlaceholder}
                    required
                    data-testid="input-project-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t.description}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t.descriptionPlaceholder}
                    rows={3}
                    data-testid="input-description"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t.industry} *</Label>
                    <Select value={formData.industry} onValueChange={(v) => setFormData({ ...formData, industry: v })}>
                      <SelectTrigger data-testid="select-industry">
                        <SelectValue placeholder={t.selectIndustry} />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.country} *</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger data-testid="select-country">
                        <SelectValue placeholder={t.selectCountry} />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t.currency}</Label>
                    <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                      <SelectTrigger data-testid="select-currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.financialInfo}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investment">{t.initialInvestment}</Label>
                    <Input
                      id="investment"
                      type="number"
                      value={formData.initialInvestment}
                      onChange={(e) => setFormData({ ...formData, initialInvestment: e.target.value })}
                      placeholder={t.investmentPlaceholder}
                      data-testid="input-investment"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">{t.projectDuration}</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="30"
                      value={formData.projectDuration}
                      onChange={(e) => setFormData({ ...formData, projectDuration: e.target.value })}
                      data-testid="input-duration"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="opex">{t.monthlyOpex}</Label>
                    <Input
                      id="opex"
                      type="number"
                      value={formData.monthlyOperatingCosts}
                      onChange={(e) => setFormData({ ...formData, monthlyOperatingCosts: e.target.value })}
                      data-testid="input-opex"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">{t.monthlyRevenue}</Label>
                    <Input
                      id="revenue"
                      type="number"
                      value={formData.expectedMonthlyRevenue}
                      onChange={(e) => setFormData({ ...formData, expectedMonthlyRevenue: e.target.value })}
                      data-testid="input-revenue"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">{t.businessDetails}</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="product">{t.productDescription}</Label>
                  <Textarea
                    id="product"
                    value={formData.productDescription}
                    onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                    placeholder={t.productPlaceholder}
                    rows={3}
                    data-testid="input-product"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customers">{t.targetCustomers}</Label>
                    <Input
                      id="customers"
                      value={formData.targetCustomers}
                      onChange={(e) => setFormData({ ...formData, targetCustomers: e.target.value })}
                      placeholder={t.customersPlaceholder}
                      data-testid="input-customers"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="advantage">{t.competitiveAdvantage}</Label>
                    <Input
                      id="advantage"
                      value={formData.competitiveAdvantage}
                      onChange={(e) => setFormData({ ...formData, competitiveAdvantage: e.target.value })}
                      placeholder={t.advantagePlaceholder}
                      data-testid="input-advantage"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t.revenueStreams}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newRevenueStream}
                      onChange={(e) => setNewRevenueStream(e.target.value)}
                      placeholder={t.streamPlaceholder}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addRevenueStream())}
                      data-testid="input-revenue-stream"
                    />
                    <Button type="button" onClick={addRevenueStream} size="sm" data-testid="button-add-stream">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.revenueStreams.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.revenueStreams.map((stream, i) => (
                        <div key={i} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm">
                          {stream}
                          <button type="button" onClick={() => removeRevenueStream(i)} className="hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="market">{t.marketSize}</Label>
                    <Input
                      id="market"
                      type="number"
                      value={formData.marketSize}
                      onChange={(e) => setFormData({ ...formData, marketSize: e.target.value })}
                      placeholder={t.marketPlaceholder}
                      data-testid="input-market"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="strategy">{t.growthStrategy}</Label>
                    <Input
                      id="strategy"
                      value={formData.growthStrategy}
                      onChange={(e) => setFormData({ ...formData, growthStrategy: e.target.value })}
                      placeholder={t.strategyPlaceholder}
                      data-testid="input-strategy"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-lg font-semibold">{t.clientInfo}</h3>
                  <p className="text-sm text-muted-foreground">{t.clientInfoDesc}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName">{t.clientName}</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      placeholder={t.clientNamePlaceholder}
                      data-testid="input-client-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientCompany">{t.clientCompany}</Label>
                    <Input
                      id="clientCompany"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      placeholder={t.clientCompanyPlaceholder}
                      data-testid="input-client-company"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">{t.clientEmail}</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      placeholder={t.clientEmailPlaceholder}
                      data-testid="input-client-email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="clientPhone">{t.clientPhone}</Label>
                    <Input
                      id="clientPhone"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder={t.clientPhonePlaceholder}
                      data-testid="input-client-phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientAddress">{t.clientAddress}</Label>
                    <Input
                      id="clientAddress"
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      placeholder={t.clientAddressPlaceholder}
                      data-testid="input-client-address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.clientType}</Label>
                    <Select 
                      value={formData.clientType} 
                      onValueChange={(v) => setFormData({ ...formData, clientType: v as typeof formData.clientType })}
                    >
                      <SelectTrigger data-testid="select-client-type">
                        <SelectValue placeholder={t.selectClientType} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">{t.clientTypeIndividual}</SelectItem>
                        <SelectItem value="company">{t.clientTypeCompany}</SelectItem>
                        <SelectItem value="organization">{t.clientTypeOrganization}</SelectItem>
                        <SelectItem value="government">{t.clientTypeGovernment}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={createProject.isPending}
                data-testid="button-create-project"
              >
                {createProject.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.creating}
                  </>
                ) : (
                  t.create
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
