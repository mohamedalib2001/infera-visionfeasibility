import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ArrowLeft, ArrowRight, Target, Lightbulb, Users, Shield } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const texts = {
  en: {
    title: "About INFERA VisionFeasibility",
    subtitle: "Transforming Investment Analysis for MENA Markets",
    backHome: "Back to Home",
    mission: {
      title: "Our Mission",
      content: "To democratize access to professional-grade investment feasibility studies by leveraging advanced AI technology. We empower entrepreneurs, investors, and businesses across the MENA region to make data-driven investment decisions with confidence."
    },
    story: {
      title: "Our Story",
      content: "INFERA VisionFeasibility was founded with a clear vision: to bridge the gap between sophisticated financial analysis and accessibility. Traditional feasibility studies require weeks of work and significant consulting fees. Our AI-powered platform delivers the same quality analysis in minutes, making professional investment insights available to businesses of all sizes."
    },
    values: [
      {
        icon: "target",
        title: "Precision",
        content: "We deliver accurate, data-driven analysis using proven financial methodologies including DCF, NPV, IRR, and comprehensive risk assessment frameworks."
      },
      {
        icon: "lightbulb",
        title: "Innovation",
        content: "Our AI engine continuously evolves to incorporate the latest market intelligence and analytical techniques, ensuring cutting-edge feasibility assessments."
      },
      {
        icon: "users",
        title: "Accessibility",
        content: "Full bilingual support in English and Arabic reflects our commitment to serving the diverse MENA market with culturally relevant solutions."
      },
      {
        icon: "shield",
        title: "Trust",
        content: "Enterprise-grade security, transparent methodologies, and reliable outputs build the foundation for confident investment decisions."
      }
    ],
    platform: {
      title: "What We Offer",
      features: [
        "12-section comprehensive feasibility reports",
        "Financial analysis: CAPEX, OPEX, Cash Flow, IRR, NPV, ROI",
        "Market sizing: TAM, SAM, SOM analysis",
        "Risk assessment with mitigation strategies",
        "AI-generated strategic recommendations",
        "Professional PDF exports with RTL Arabic support",
        "Real-time collaboration and project management"
      ]
    }
  },
  ar: {
    title: "عن INFERA VisionFeasibility",
    subtitle: "تحويل تحليل الاستثمار لأسواق الشرق الأوسط وشمال أفريقيا",
    backHome: "العودة للرئيسية",
    mission: {
      title: "مهمتنا",
      content: "توسيع الوصول إلى دراسات الجدوى الاستثمارية الاحترافية من خلال الاستفادة من تقنيات الذكاء الاصطناعي المتقدمة. نمكّن رواد الأعمال والمستثمرين والشركات في منطقة الشرق الأوسط وشمال أفريقيا من اتخاذ قرارات استثمارية مبنية على البيانات بثقة."
    },
    story: {
      title: "قصتنا",
      content: "تأسست INFERA VisionFeasibility برؤية واضحة: سد الفجوة بين التحليل المالي المتطور وإمكانية الوصول. تتطلب دراسات الجدوى التقليدية أسابيع من العمل ورسوم استشارية كبيرة. تقدم منصتنا المدعومة بالذكاء الاصطناعي نفس جودة التحليل في دقائق، مما يجعل رؤى الاستثمار الاحترافية متاحة للشركات بجميع أحجامها."
    },
    values: [
      {
        icon: "target",
        title: "الدقة",
        content: "نقدم تحليلاً دقيقاً مبنياً على البيانات باستخدام منهجيات مالية مثبتة تشمل التدفقات النقدية المخصومة وصافي القيمة الحالية ومعدل العائد الداخلي وأطر تقييم المخاطر الشاملة."
      },
      {
        icon: "lightbulb",
        title: "الابتكار",
        content: "يتطور محرك الذكاء الاصطناعي لدينا باستمرار لدمج أحدث معلومات السوق والتقنيات التحليلية، مما يضمن تقييمات جدوى متطورة."
      },
      {
        icon: "users",
        title: "إمكانية الوصول",
        content: "الدعم الكامل ثنائي اللغة بالإنجليزية والعربية يعكس التزامنا بخدمة سوق الشرق الأوسط وشمال أفريقيا المتنوع بحلول ملائمة ثقافياً."
      },
      {
        icon: "shield",
        title: "الثقة",
        content: "الأمان على مستوى المؤسسات والمنهجيات الشفافة والمخرجات الموثوقة تبني الأساس لقرارات استثمارية واثقة."
      }
    ],
    platform: {
      title: "ما نقدمه",
      features: [
        "تقارير جدوى شاملة من 12 قسماً",
        "تحليل مالي: CAPEX، OPEX، التدفق النقدي، IRR، NPV، ROI",
        "تحديد حجم السوق: تحليل TAM، SAM، SOM",
        "تقييم المخاطر مع استراتيجيات التخفيف",
        "توصيات استراتيجية مولدة بالذكاء الاصطناعي",
        "تصدير PDF احترافي مع دعم RTL للعربية",
        "التعاون في الوقت الحقيقي وإدارة المشاريع"
      ]
    }
  }
};

const iconMap = {
  target: Target,
  lightbulb: Lightbulb,
  users: Users,
  shield: Shield
};

export default function About() {
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
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-xs">IV</span>
              </div>
              <span className="font-bold text-lg">
                INFERA<span className="text-primary">Vision</span>
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleLanguage} data-testid="button-language">
              <Globe className="w-4 h-4" />
            </Button>
            <Link href="/">
              <Button variant="ghost" className="gap-2" data-testid="link-back-home">
                {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
                {t.backHome}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h1>
            <p className="text-xl text-muted-foreground">{t.subtitle}</p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">{t.mission.title}</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">{t.mission.content}</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">{t.story.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{t.story.content}</p>
          </section>

          <section className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {t.values.map((value, index) => {
                const IconComponent = iconMap[value.icon as keyof typeof iconMap];
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.content}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t.platform.title}</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {t.platform.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}
