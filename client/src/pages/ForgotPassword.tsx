import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Globe, Mail, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const texts = {
  en: {
    back: "Back to Login",
    title: "Forgot Password",
    subtitle: "Enter your email address and we'll send you a link to reset your password",
    email: "Email Address",
    emailPlaceholder: "you@example.com",
    sending: "Sending...",
    sendLink: "Send Reset Link",
    successTitle: "Email Sent!",
    successMessage: "If an account exists with this email, you will receive a password reset link shortly.",
    backToLogin: "Back to Login",
  },
  ar: {
    back: "العودة لتسجيل الدخول",
    title: "نسيت كلمة المرور",
    subtitle: "أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور",
    email: "البريد الإلكتروني",
    emailPlaceholder: "you@example.com",
    sending: "جاري الإرسال...",
    sendLink: "إرسال رابط الاستعادة",
    successTitle: "تم الإرسال!",
    successMessage: "إذا كان هناك حساب مرتبط بهذا البريد الإلكتروني، ستتلقى رابط إعادة تعيين كلمة المرور قريباً.",
    backToLogin: "العودة لتسجيل الدخول",
  },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });
  const { toast } = useToast();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/auth/forgot-password", { email });
      setIsSuccess(true);
    } catch (error) {
      toast({
        title: lang === "ar" ? "حدث خطأ" : "Error",
        description: error instanceof Error ? error.message : (lang === "ar" ? "حدث خطأ أثناء الإرسال" : "An error occurred"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className={`absolute top-4 ${isRtl ? "right-4" : "left-4"}`}>
        <Link href="/login">
          <Button variant="ghost" size="sm" data-testid="link-back-login">
            {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
            {t.back}
          </Button>
        </Link>
      </div>
      
      <div className={`absolute top-4 ${isRtl ? "left-4" : "right-4"}`}>
        <Button variant="ghost" size="icon" onClick={toggleLanguage} data-testid="button-language">
          <Globe className="w-4 h-4" />
        </Button>
      </div>
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            {isSuccess ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Mail className="w-6 h-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSuccess ? t.successTitle : t.title}
          </CardTitle>
          <CardDescription>
            {isSuccess ? t.successMessage : t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSuccess ? (
            <Link href="/login">
              <Button className="w-full" data-testid="button-back-to-login">
                {t.backToLogin}
              </Button>
            </Link>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="input-email"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-send-reset">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.sending}
                  </>
                ) : (
                  t.sendLink
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
