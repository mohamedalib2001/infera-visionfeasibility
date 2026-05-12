import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { LandingFooter } from "@/components/LandingFooter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, Loader2, Globe, ArrowLeft, ArrowRight } from "lucide-react";

const texts = {
  en: {
    title: "Contact Us",
    subtitle: "We're here to help. Send us a message and we'll respond as soon as possible.",
    subject: "Subject",
    message: "Message",
    name: "Name",
    send: "Send Message",
    sending: "Sending...",
    email: "Email",
    phone: "Phone",
    address: "Address",
    addressValue: "Riyadh, Saudi Arabia",
    success: "Message sent successfully!",
    successDesc: "We'll get back to you soon.",
    backHome: "Back to Home",
  },
  ar: {
    title: "اتصل بنا",
    subtitle: "نحن هنا للمساعدة. أرسل لنا رسالة وسنرد في أقرب وقت ممكن.",
    subject: "الموضوع",
    message: "الرسالة",
    name: "الاسم",
    send: "إرسال الرسالة",
    sending: "جاري الإرسال...",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    address: "العنوان",
    addressValue: "الرياض، المملكة العربية السعودية",
    success: "تم إرسال الرسالة بنجاح!",
    successDesc: "سنرد عليك قريباً.",
    backHome: "العودة للرئيسية",
  },
};

function ContactForm({ lang, userEmail, userName }: { lang: "en" | "ar"; userEmail?: string; userName?: string }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: userName || "",
    email: userEmail || "",
    subject: "",
    message: "",
  });

  const t = texts[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: t.success,
      description: t.successDesc,
    });

    setFormData({ ...formData, subject: "", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!userEmail && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.name}</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </>
              )}

              {userEmail && (
                <div className="space-y-2">
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userEmail}
                    disabled
                    data-testid="input-email"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">{t.subject}</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                  data-testid="input-subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{t.message}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={5}
                  required
                  data-testid="input-message"
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="gap-2" data-testid="button-send">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t.send}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.email}</p>
                <p className="font-medium">support@inferavision.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.phone}</p>
                <p className="font-medium">+966 11 XXX XXXX</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t.address}</p>
                <p className="font-medium">{t.addressValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function Contact() {
  const { user, isLoading } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });

  useEffect(() => {
    if (user?.language) {
      setLang(user.language as "en" | "ar");
    }
  }, [user?.language]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <DashboardLayout title={t.title}>
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-2">{t.subtitle}</p>
          </div>
          <ContactForm lang={lang} userEmail={user.email} userName={user.name} />
        </div>
      </DashboardLayout>
    );
  }

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
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{t.title}</h1>
            <p className="text-muted-foreground">{t.subtitle}</p>
          </div>
          <ContactForm lang={lang} />
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}
