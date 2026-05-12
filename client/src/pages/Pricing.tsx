import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Globe } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  currency: string;
  features: string[];
  featuresAr: string[];
  reportsLimit: number;
  stripePriceId?: string;
}

export default function Pricing() {
  const { user, subscription } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("lang") as "en" | "ar";
      return stored || (user?.language as "en" | "ar") || "en";
    }
    return (user?.language as "en" | "ar") || "en";
  });
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
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

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/subscription/plans"],
  });

  const checkout = useMutation({
    mutationFn: async (plan: Plan) => {
      if (!user) {
        setLocation("/login");
        return;
      }
      
      if (plan.price === 0) {
        toast({
          title: lang === "ar" ? "أنت على الخطة المجانية" : "You're on the Free plan",
          description: lang === "ar" ? "قم بالترقية للحصول على المزيد من الميزات" : "Upgrade to get more features",
        });
        return;
      }

      return api.post<{ url: string }>("/api/stripe/checkout", {
        plan: plan.id,
      });
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan.id);
    checkout.mutate(plan);
  };

  const texts = {
    en: {
      title: "Choose Your Plan",
      subtitle: "Start generating professional feasibility studies today",
      back: "Back to Dashboard",
      currentPlan: "Current Plan",
      popular: "Most Popular",
      getStarted: "Get Started",
      upgrade: "Upgrade",
      reports: "reports",
      perMonth: "/month",
      free: "Free forever",
    },
    ar: {
      title: "اختر خطتك",
      subtitle: "ابدأ في توليد دراسات الجدوى الاحترافية اليوم",
      back: "العودة للوحة التحكم",
      currentPlan: "الخطة الحالية",
      popular: "الأكثر شعبية",
      getStarted: "ابدأ الآن",
      upgrade: "ترقية",
      reports: "تقارير",
      perMonth: "/شهر",
      free: "مجاني للأبد",
    },
  };

  const t = texts[lang as keyof typeof texts];

  return (
    <div className={`min-h-screen bg-background py-12 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          {user ? (
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="link-back">
                {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                {t.back}
              </Button>
            </Link>
          ) : (
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="link-back-home">
                {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                {lang === "ar" ? "الرئيسية" : "Home"}
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="icon" onClick={toggleLanguage} data-testid="button-language">
            <Globe className="w-4 h-4" />
          </Button>
        </div>

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-base sm:text-xl text-muted-foreground">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {plans?.map((plan) => {
            const isCurrentPlan = subscription?.plan === plan.id;
            const isPopular = plan.id === "pro";
            const features = lang === "ar" ? plan.featuresAr : plan.features;
            const planName = lang === "ar" ? plan.nameAr : plan.name;

            return (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col ${isPopular ? "border-primary shadow-lg" : ""}`}
                data-testid={`card-plan-${plan.id}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t.popular}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{planName}</CardTitle>
                  <CardDescription>
                    {plan.reportsLimit} {t.reports}
                  </CardDescription>
                  <div className="mt-4">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold">{t.free}</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">{t.perMonth}</span>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrentPlan ? (
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      {t.currentPlan}
                    </Badge>
                  ) : (
                    <Button 
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan)}
                      disabled={checkout.isPending && selectedPlan === plan.id}
                      data-testid={`button-select-${plan.id}`}
                    >
                      {checkout.isPending && selectedPlan === plan.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : plan.price === 0 ? (
                        t.getStarted
                      ) : (
                        t.upgrade
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {!user && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              {lang === "ar" ? "ليس لديك حساب؟" : "Don't have an account?"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <Button data-testid="button-register">
                  {lang === "ar" ? "إنشاء حساب" : "Create Account"}
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" data-testid="button-login">
                  {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
