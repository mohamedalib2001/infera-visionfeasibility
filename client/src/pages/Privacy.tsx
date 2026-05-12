import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const texts = {
  en: {
    title: "Privacy Policy",
    lastUpdated: "Last Updated",
    backHome: "Back to Home",
    sections: [
      {
        title: "1. Information We Collect",
        content: "INFERA VisionFeasibility collects information you provide directly, including: account registration data (name, email, password), project information for feasibility studies, payment information processed securely via Stripe, and usage data to improve our services."
      },
      {
        title: "2. How We Use Your Information",
        content: "We use your information to: generate AI-powered feasibility studies, process payments and manage subscriptions, communicate service updates and support, improve platform functionality and user experience, and comply with legal obligations."
      },
      {
        title: "3. Data Storage and Security",
        content: "Your data is stored on secure cloud infrastructure with encryption at rest and in transit. We implement industry-standard security measures including access controls, regular security audits, and data backup procedures."
      },
      {
        title: "4. AI Data Processing",
        content: "When generating feasibility studies, your project data is processed by our AI systems. This data is used solely for generating your reports and is not used to train AI models or shared with third parties without consent."
      },
      {
        title: "5. Third-Party Services",
        content: "We integrate with trusted third-party services: Stripe for payment processing, OpenAI for AI-powered analysis, and email providers for communications. Each service has its own privacy policy governing data handling."
      },
      {
        title: "6. Your Rights",
        content: "You have the right to: access your personal data, request data correction or deletion, export your data, withdraw consent for optional processing, and lodge complaints with supervisory authorities."
      },
      {
        title: "7. Data Retention",
        content: "We retain your data for as long as your account is active. Upon account deletion, personal data is removed within 30 days, except where retention is required by law or for legitimate business purposes."
      },
      {
        title: "8. Contact Us",
        content: "For privacy-related inquiries, contact our Data Protection team at privacy@inferavision.com or through our Contact page."
      }
    ]
  },
  ar: {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث",
    backHome: "العودة للرئيسية",
    sections: [
      {
        title: "1. المعلومات التي نجمعها",
        content: "تجمع INFERA VisionFeasibility المعلومات التي تقدمها مباشرة، بما في ذلك: بيانات تسجيل الحساب (الاسم، البريد الإلكتروني، كلمة المرور)، معلومات المشاريع لدراسات الجدوى، معلومات الدفع المعالجة بأمان عبر Stripe، وبيانات الاستخدام لتحسين خدماتنا."
      },
      {
        title: "2. كيف نستخدم معلوماتك",
        content: "نستخدم معلوماتك لـ: إنشاء دراسات الجدوى المدعومة بالذكاء الاصطناعي، معالجة المدفوعات وإدارة الاشتراكات، التواصل بشأن تحديثات الخدمة والدعم، تحسين وظائف المنصة وتجربة المستخدم، والامتثال للالتزامات القانونية."
      },
      {
        title: "3. تخزين البيانات والأمان",
        content: "يتم تخزين بياناتك على بنية تحتية سحابية آمنة مع تشفير أثناء السكون والنقل. نطبق إجراءات أمنية معيارية تشمل ضوابط الوصول والتدقيق الأمني المنتظم وإجراءات النسخ الاحتياطي."
      },
      {
        title: "4. معالجة بيانات الذكاء الاصطناعي",
        content: "عند إنشاء دراسات الجدوى، تتم معالجة بيانات مشروعك بواسطة أنظمة الذكاء الاصطناعي لدينا. تُستخدم هذه البيانات فقط لإنشاء تقاريرك ولا تُستخدم لتدريب نماذج الذكاء الاصطناعي أو مشاركتها مع أطراف ثالثة دون موافقة."
      },
      {
        title: "5. خدمات الطرف الثالث",
        content: "نتكامل مع خدمات موثوقة من أطراف ثالثة: Stripe لمعالجة المدفوعات، OpenAI للتحليل المدعوم بالذكاء الاصطناعي، ومزودي البريد الإلكتروني للاتصالات. لكل خدمة سياسة خصوصية خاصة بها تحكم التعامل مع البيانات."
      },
      {
        title: "6. حقوقك",
        content: "لديك الحق في: الوصول إلى بياناتك الشخصية، طلب تصحيح أو حذف البيانات، تصدير بياناتك، سحب الموافقة على المعالجة الاختيارية، وتقديم شكاوى إلى السلطات الإشرافية."
      },
      {
        title: "7. الاحتفاظ بالبيانات",
        content: "نحتفظ ببياناتك طالما حسابك نشط. عند حذف الحساب، تُزال البيانات الشخصية خلال 30 يومًا، باستثناء الحالات التي يتطلب فيها القانون الاحتفاظ بها أو لأغراض تجارية مشروعة."
      },
      {
        title: "8. اتصل بنا",
        content: "للاستفسارات المتعلقة بالخصوصية، تواصل مع فريق حماية البيانات لدينا على privacy@inferavision.com أو من خلال صفحة الاتصال."
      }
    ]
  }
};

export default function Privacy() {
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h1>
          <p className="text-muted-foreground mb-8">
            {t.lastUpdated}: January 2026
          </p>

          <div className="space-y-8">
            {t.sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-xl font-semibold mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </section>
            ))}
          </div>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}
