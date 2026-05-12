import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Globe, ArrowLeft, ArrowRight } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const texts = {
  en: {
    title: "Cookie Policy",
    lastUpdated: "Last Updated",
    backHome: "Back to Home",
    sections: [
      {
        title: "1. What Are Cookies",
        content: "Cookies are small text files stored on your device when you visit INFERA VisionFeasibility. They help us provide essential functionality, remember your preferences, and improve your experience on our platform."
      },
      {
        title: "2. Essential Cookies",
        content: "These cookies are necessary for the platform to function and cannot be disabled. They include: session cookies for authentication, security cookies for protection against attacks, and preference cookies for language and theme settings."
      },
      {
        title: "3. Analytics Cookies",
        content: "We use analytics cookies to understand how users interact with our platform. This helps us improve functionality and user experience. Analytics data is aggregated and does not identify individual users."
      },
      {
        title: "4. Functional Cookies",
        content: "These cookies enable enhanced functionality: remembering your language preference (English/Arabic), storing your theme preference (light/dark mode), and maintaining your session state across page visits."
      },
      {
        title: "5. Third-Party Cookies",
        content: "Our payment processor Stripe may set cookies for payment security and fraud prevention. These cookies are subject to Stripe's privacy policy. We do not allow advertising cookies on our platform."
      },
      {
        title: "6. Cookie Duration",
        content: "Session cookies are deleted when you close your browser. Persistent cookies remain for: authentication tokens (7 days), language preferences (1 year), and theme settings (1 year)."
      },
      {
        title: "7. Managing Cookies",
        content: "You can manage cookies through your browser settings. Disabling essential cookies may affect platform functionality. You can clear cookies at any time, though this will log you out and reset preferences."
      },
      {
        title: "8. Updates to This Policy",
        content: "We may update this Cookie Policy as our platform evolves. Significant changes will be communicated through our platform. Continued use after updates constitutes acceptance of the revised policy."
      }
    ]
  },
  ar: {
    title: "سياسة ملفات تعريف الارتباط",
    lastUpdated: "آخر تحديث",
    backHome: "العودة للرئيسية",
    sections: [
      {
        title: "1. ما هي ملفات تعريف الارتباط",
        content: "ملفات تعريف الارتباط هي ملفات نصية صغيرة تُخزن على جهازك عند زيارة INFERA VisionFeasibility. تساعدنا في توفير الوظائف الأساسية وتذكر تفضيلاتك وتحسين تجربتك على منصتنا."
      },
      {
        title: "2. ملفات تعريف الارتباط الأساسية",
        content: "هذه الملفات ضرورية لعمل المنصة ولا يمكن تعطيلها. تشمل: ملفات جلسة للمصادقة، ملفات أمان للحماية من الهجمات، وملفات تفضيلات لإعدادات اللغة والمظهر."
      },
      {
        title: "3. ملفات تعريف الارتباط التحليلية",
        content: "نستخدم ملفات تعريف الارتباط التحليلية لفهم كيفية تفاعل المستخدمين مع منصتنا. يساعدنا هذا في تحسين الوظائف وتجربة المستخدم. البيانات التحليلية مجمعة ولا تحدد المستخدمين الأفراد."
      },
      {
        title: "4. ملفات تعريف الارتباط الوظيفية",
        content: "تتيح هذه الملفات وظائف محسنة: تذكر تفضيل لغتك (الإنجليزية/العربية)، تخزين تفضيل المظهر (الوضع الفاتح/الداكن)، والحفاظ على حالة جلستك عبر زيارات الصفحات."
      },
      {
        title: "5. ملفات تعريف الارتباط الخاصة بطرف ثالث",
        content: "قد يضع معالج المدفوعات Stripe ملفات تعريف ارتباط لأمان الدفع ومنع الاحتيال. تخضع هذه الملفات لسياسة خصوصية Stripe. لا نسمح بملفات تعريف الارتباط الإعلانية على منصتنا."
      },
      {
        title: "6. مدة ملفات تعريف الارتباط",
        content: "تُحذف ملفات الجلسة عند إغلاق متصفحك. تبقى الملفات الدائمة لـ: رموز المصادقة (7 أيام)، تفضيلات اللغة (سنة واحدة)، وإعدادات المظهر (سنة واحدة)."
      },
      {
        title: "7. إدارة ملفات تعريف الارتباط",
        content: "يمكنك إدارة ملفات تعريف الارتباط من خلال إعدادات متصفحك. قد يؤثر تعطيل الملفات الأساسية على وظائف المنصة. يمكنك مسح الملفات في أي وقت، رغم أن هذا سيسجل خروجك ويعيد تعيين التفضيلات."
      },
      {
        title: "8. تحديثات هذه السياسة",
        content: "قد نحدث سياسة ملفات تعريف الارتباط مع تطور منصتنا. سيتم إبلاغ التغييرات الهامة من خلال منصتنا. يشكل الاستمرار في الاستخدام بعد التحديثات قبولاً للسياسة المعدلة."
      }
    ]
  }
};

export default function Cookies() {
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
