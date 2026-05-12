import { useState, useEffect } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingFooter } from "@/components/LandingFooter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  BarChart3, FileText, Globe, Shield, Sparkles, 
  TrendingUp, Users, Check, ArrowRight, ArrowLeft, Zap, Menu
} from "lucide-react";

const texts = {
  en: {
    tagline: "AI-Powered Feasibility Studies",
    heroTitle1: "Generate Investment",
    heroTitle2: "Feasibility Studies",
    heroTitle3: "in Minutes",
    heroDesc: "INFERA Vision uses advanced AI to create comprehensive feasibility studies with financial analysis, market research, and risk assessment in both English and Arabic.",
    startTrial: "Start Free Trial",
    viewPricing: "View Pricing",
    pricing: "Pricing",
    login: "Login",
    getStarted: "Get Started",
    featuresTitle: "Everything You Need for Investment Analysis",
    featuresDesc: "Professional-grade feasibility studies powered by cutting-edge AI technology",
  },
  ar: {
    tagline: "دراسات الجدوى بالذكاء الاصطناعي",
    heroTitle1: "توليد دراسات",
    heroTitle2: "الجدوى الاستثمارية",
    heroTitle3: "في دقائق",
    heroDesc: "تستخدم INFERA Vision الذكاء الاصطناعي المتقدم لإنشاء دراسات جدوى شاملة مع التحليل المالي وأبحاث السوق وتقييم المخاطر باللغتين العربية والإنجليزية.",
    startTrial: "ابدأ تجربتك المجانية",
    viewPricing: "عرض الأسعار",
    pricing: "الأسعار",
    login: "تسجيل الدخول",
    getStarted: "ابدأ الآن",
    featuresTitle: "كل ما تحتاجه لتحليل الاستثمار",
    featuresDesc: "دراسات جدوى احترافية مدعومة بأحدث تقنيات الذكاء الاصطناعي",
  },
};

export default function Landing() {
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });
  const isRtl = lang === "ar";
  const t = texts[lang];

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <div className={`min-h-screen w-full bg-background ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
              <span className="font-bold text-primary-foreground text-xs">IV</span>
            </div>
            <span className="font-bold text-lg">
              INFERA<span className="text-primary">Vision</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} data-testid="button-language">
              <Globe className="w-4 h-4" />
            </Button>
            <Link href="/pricing">
              <Button variant="ghost" data-testid="link-pricing">{t.pricing}</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" data-testid="link-login">{t.login}</Button>
            </Link>
            <Link href="/register">
              <Button data-testid="link-register">{t.getStarted}</Button>
            </Link>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} data-testid="button-language-mobile">
              <Globe className="w-4 h-4" />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side={isRtl ? "left" : "right"} className="w-64">
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/pricing">
                    <Button variant="ghost" className="w-full justify-start" data-testid="link-pricing-mobile">
                      {t.pricing}
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full justify-start" data-testid="link-login-mobile">
                      {t.login}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full" data-testid="link-register-mobile">
                      {t.getStarted}
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              {t.tagline}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
          >
            {t.heroTitle1}
            <span className="block text-primary">{t.heroTitle2}</span>
            {t.heroTitle3}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            {t.heroDesc}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/register">
              <Button size="lg" className="gap-2" data-testid="button-hero-cta">
                {t.startTrial}
                {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" data-testid="button-hero-pricing">
                {t.viewPricing}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.featuresDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Financial Analysis"
              description="NPV, IRR, ROI, payback period, cash flow projections, and sensitivity analysis"
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Market Research"
              description="TAM/SAM/SOM analysis, market trends, and competitive landscape"
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Risk Assessment"
              description="Comprehensive risk identification, scoring, and mitigation strategies"
            />
            <FeatureCard
              icon={<Globe className="w-6 h-6" />}
              title="Bilingual Reports"
              description="Full reports in both English and Arabic for MENA markets"
            />
            <FeatureCard
              icon={<FileText className="w-6 h-6" />}
              title="PDF Export"
              description="Professional PDF reports ready for investors and stakeholders"
            />
            <FeatureCard
              icon={<Zap className="w-6 h-6" />}
              title="AI-Powered"
              description="Leveraging GPT-4 for intelligent analysis and recommendations"
            />
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                How It Works
              </h2>
              <div className="space-y-6">
                <Step number={1} title="Enter Project Details" 
                  description="Provide basic information about your business idea, industry, and target market" />
                <Step number={2} title="AI Analysis" 
                  description="Our AI analyzes your inputs and generates comprehensive financial models and market research" />
                <Step number={3} title="Get Your Report" 
                  description="Download a professional feasibility study with actionable insights and recommendations" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <StatCard value="50+" label="Industries Covered" />
                <StatCard value="1000+" label="Reports Generated" />
              </div>
              <div className="space-y-4 pt-8">
                <StatCard value="15+" label="Countries Supported" />
                <StatCard value="95%" label="Client Satisfaction" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start?
          </h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Join thousands of investors and entrepreneurs who trust INFERA Vision 
            for their feasibility studies.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-bottom">
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <LandingFooter lang={lang} />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="hover-elevate">
      <CardContent className="p-6">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <div className="text-3xl font-bold text-primary mb-1">{value}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
