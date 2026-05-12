import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, ArrowLeft, ArrowRight, Shield, Lock, Server, Eye, FileCheck, AlertTriangle } from "lucide-react";
import { LandingFooter } from "@/components/LandingFooter";

const texts = {
  en: {
    title: "Security at INFERA VisionFeasibility",
    subtitle: "Enterprise-grade security for your investment data",
    backHome: "Back to Home",
    intro: "Protecting your financial data and business intelligence is our top priority. We implement comprehensive security measures to ensure your information remains confidential, integral, and available.",
    sections: [
      {
        icon: "lock",
        title: "Data Encryption",
        content: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Database backups are encrypted and stored in geographically distributed locations. API keys and secrets are managed using industry-standard vault solutions."
      },
      {
        icon: "server",
        title: "Infrastructure Security",
        content: "Our infrastructure runs on SOC 2 compliant cloud providers with 24/7 monitoring. We implement network segmentation, intrusion detection systems, and regular vulnerability scanning. All systems are patched and updated according to strict maintenance schedules."
      },
      {
        icon: "shield",
        title: "Access Control",
        content: "Role-based access control (RBAC) ensures users only access authorized resources. Multi-factor authentication is available for all accounts. Session management includes automatic timeouts and secure token handling."
      },
      {
        icon: "eye",
        title: "Privacy Protection",
        content: "Your project data is processed by AI systems solely for generating your reports. We do not use customer data to train our models. Data retention policies ensure information is removed when no longer needed."
      },
      {
        icon: "filecheck",
        title: "Compliance",
        content: "We maintain compliance with applicable data protection regulations. Regular security audits and penetration testing validate our security posture. Our security practices align with ISO 27001 and SOC 2 frameworks."
      },
      {
        icon: "alert",
        title: "Incident Response",
        content: "Our security team monitors for threats around the clock. We maintain incident response procedures to quickly address any security events. Users are notified promptly of any incidents affecting their data."
      }
    ],
    contact: {
      title: "Report Security Issues",
      content: "If you discover a security vulnerability, please report it responsibly to security@inferavision.com. We appreciate the security community's efforts to keep our platform safe."
    }
  },
  ar: {
    title: "الأمان في INFERA VisionFeasibility",
    subtitle: "أمان على مستوى المؤسسات لبيانات استثمارك",
    backHome: "العودة للرئيسية",
    intro: "حماية بياناتك المالية ومعلومات عملك هي أولويتنا القصوى. نطبق إجراءات أمنية شاملة لضمان بقاء معلوماتك سرية وسليمة ومتاحة.",
    sections: [
      {
        icon: "lock",
        title: "تشفير البيانات",
        content: "جميع البيانات مشفرة أثناء السكون باستخدام AES-256 وأثناء النقل باستخدام TLS 1.3. النسخ الاحتياطية لقاعدة البيانات مشفرة ومخزنة في مواقع موزعة جغرافياً. تُدار مفاتيح API والأسرار باستخدام حلول vault معيارية في الصناعة."
      },
      {
        icon: "server",
        title: "أمان البنية التحتية",
        content: "تعمل بنيتنا التحتية على مزودي سحابة متوافقين مع SOC 2 مع مراقبة على مدار الساعة. نطبق تجزئة الشبكة وأنظمة كشف التسلل وفحص الثغرات المنتظم. يتم تصحيح وتحديث جميع الأنظمة وفقاً لجداول صيانة صارمة."
      },
      {
        icon: "shield",
        title: "التحكم في الوصول",
        content: "يضمن التحكم في الوصول المستند إلى الأدوار (RBAC) وصول المستخدمين فقط إلى الموارد المصرح بها. المصادقة متعددة العوامل متاحة لجميع الحسابات. تتضمن إدارة الجلسات انتهاء الصلاحية التلقائي ومعالجة الرموز الآمنة."
      },
      {
        icon: "eye",
        title: "حماية الخصوصية",
        content: "تتم معالجة بيانات مشروعك بواسطة أنظمة الذكاء الاصطناعي فقط لإنشاء تقاريرك. لا نستخدم بيانات العملاء لتدريب نماذجنا. تضمن سياسات الاحتفاظ بالبيانات إزالة المعلومات عندما لم تعد ضرورية."
      },
      {
        icon: "filecheck",
        title: "الامتثال",
        content: "نحافظ على الامتثال للوائح حماية البيانات المعمول بها. تتحقق عمليات التدقيق الأمني واختبارات الاختراق المنتظمة من وضعنا الأمني. تتوافق ممارساتنا الأمنية مع أطر ISO 27001 وSOC 2."
      },
      {
        icon: "alert",
        title: "الاستجابة للحوادث",
        content: "يراقب فريق الأمان لدينا التهديدات على مدار الساعة. نحتفظ بإجراءات الاستجابة للحوادث لمعالجة أي أحداث أمنية بسرعة. يتم إخطار المستخدمين فوراً بأي حوادث تؤثر على بياناتهم."
      }
    ],
    contact: {
      title: "الإبلاغ عن مشاكل أمنية",
      content: "إذا اكتشفت ثغرة أمنية، يرجى الإبلاغ عنها بمسؤولية إلى security@inferavision.com. نقدر جهود مجتمع الأمان للحفاظ على أمان منصتنا."
    }
  }
};

const iconMap = {
  lock: Lock,
  server: Server,
  shield: Shield,
  eye: Eye,
  filecheck: FileCheck,
  alert: AlertTriangle
};

export default function Security() {
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

          <p className="text-muted-foreground leading-relaxed mb-12 text-center max-w-2xl mx-auto">
            {t.intro}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {t.sections.map((section, index) => {
              const IconComponent = iconMap[section.icon as keyof typeof iconMap];
              return (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{section.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">{t.contact.title}</h2>
              <p className="text-muted-foreground">{t.contact.content}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}
