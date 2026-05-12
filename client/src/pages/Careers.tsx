import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowLeft, ArrowRight, MapPin, Briefcase } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const texts = {
  en: {
    title: "Careers at INFERA VisionFeasibility",
    subtitle: "Join us in transforming investment analysis for MENA markets",
    backHome: "Back to Home",
    whyJoin: {
      title: "Why Join Us",
      content: "At INFERA VisionFeasibility, you'll work on cutting-edge AI technology that directly impacts how businesses make investment decisions. We offer a collaborative environment where innovation is encouraged and your contributions make a real difference."
    },
    benefits: {
      title: "Benefits",
      items: [
        "Competitive compensation packages",
        "Remote-first work culture",
        "Flexible working hours",
        "Professional development budget",
        "Health and wellness programs",
        "Equity participation opportunities"
      ]
    },
    openings: {
      title: "Open Positions",
      positions: [
        {
          title: "Senior AI/ML Engineer",
          location: "Remote (MENA Region)",
          type: "Full-time",
          description: "Lead the development of our AI-powered feasibility analysis engine. Experience with LLMs, financial modeling, and production ML systems required."
        },
        {
          title: "Full-Stack Developer",
          location: "Remote (MENA Region)",
          type: "Full-time",
          description: "Build and maintain our React/TypeScript frontend and Node.js backend. Strong focus on performance, accessibility, and RTL language support."
        },
        {
          title: "Financial Analyst",
          location: "Dubai, UAE",
          type: "Full-time",
          description: "Develop and validate financial models for feasibility studies. CFA or equivalent certification preferred. Deep knowledge of MENA markets required."
        },
        {
          title: "Product Manager",
          location: "Remote (MENA Region)",
          type: "Full-time",
          description: "Drive product strategy and roadmap for our feasibility platform. Experience in B2B SaaS and fintech products essential."
        }
      ]
    },
    apply: "Apply Now",
    noPositions: "Don't see a role that fits? We're always looking for talented individuals. Send your resume to careers@inferavision.com"
  },
  ar: {
    title: "الوظائف في INFERA VisionFeasibility",
    subtitle: "انضم إلينا في تحويل تحليل الاستثمار لأسواق الشرق الأوسط وشمال أفريقيا",
    backHome: "العودة للرئيسية",
    whyJoin: {
      title: "لماذا تنضم إلينا",
      content: "في INFERA VisionFeasibility، ستعمل على تقنيات الذكاء الاصطناعي المتطورة التي تؤثر مباشرة على كيفية اتخاذ الشركات لقرارات الاستثمار. نوفر بيئة تعاونية حيث يُشجع الابتكار وتُحدث مساهماتك فرقاً حقيقياً."
    },
    benefits: {
      title: "المزايا",
      items: [
        "حزم تعويضات تنافسية",
        "ثقافة العمل عن بُعد أولاً",
        "ساعات عمل مرنة",
        "ميزانية التطوير المهني",
        "برامج الصحة والعافية",
        "فرص المشاركة في الأسهم"
      ]
    },
    openings: {
      title: "الوظائف المتاحة",
      positions: [
        {
          title: "مهندس ذكاء اصطناعي أول",
          location: "عن بُعد (منطقة الشرق الأوسط وشمال أفريقيا)",
          type: "دوام كامل",
          description: "قيادة تطوير محرك تحليل الجدوى المدعوم بالذكاء الاصطناعي. مطلوب خبرة في نماذج اللغة الكبيرة والنمذجة المالية وأنظمة التعلم الآلي في الإنتاج."
        },
        {
          title: "مطور Full-Stack",
          location: "عن بُعد (منطقة الشرق الأوسط وشمال أفريقيا)",
          type: "دوام كامل",
          description: "بناء وصيانة واجهة React/TypeScript وخلفية Node.js. تركيز قوي على الأداء وإمكانية الوصول ودعم لغات RTL."
        },
        {
          title: "محلل مالي",
          location: "دبي، الإمارات",
          type: "دوام كامل",
          description: "تطوير والتحقق من النماذج المالية لدراسات الجدوى. شهادة CFA أو ما يعادلها مفضلة. مطلوب معرفة عميقة بأسواق الشرق الأوسط وشمال أفريقيا."
        },
        {
          title: "مدير منتج",
          location: "عن بُعد (منطقة الشرق الأوسط وشمال أفريقيا)",
          type: "دوام كامل",
          description: "قيادة استراتيجية المنتج وخارطة الطريق لمنصة الجدوى. الخبرة في منتجات B2B SaaS والتكنولوجيا المالية ضرورية."
        }
      ]
    },
    apply: "تقدم الآن",
    noPositions: "لا ترى وظيفة تناسبك؟ نحن نبحث دائماً عن الأفراد الموهوبين. أرسل سيرتك الذاتية إلى careers@inferavision.com"
  }
};

export default function Careers() {
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
            <h2 className="text-2xl font-semibold mb-4">{t.whyJoin.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{t.whyJoin.content}</p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t.benefits.title}</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {t.benefits.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-6">{t.openings.title}</h2>
            <div className="space-y-4">
              {t.openings.positions.map((position, index) => (
                <Card key={index} className="hover-elevate">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <CardTitle className="text-lg">{position.title}</CardTitle>
                      <Button size="sm" data-testid={`button-apply-${index}`}>{t.apply}</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 mb-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {position.location}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Briefcase className="w-4 h-4" />
                        <Badge variant="secondary">{position.type}</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-sm">{position.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section className="text-center">
            <Card className="bg-muted/30">
              <CardContent className="p-8">
                <p className="text-muted-foreground">{t.noPositions}</p>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}
