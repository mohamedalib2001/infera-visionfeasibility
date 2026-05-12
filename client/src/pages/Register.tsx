import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Globe } from "lucide-react";

const texts = {
  en: {
    back: "Back",
    title: "Create Account",
    subtitle: "Start generating professional feasibility studies",
    name: "Full Name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    creating: "Creating account...",
    createAccount: "Create Account",
    haveAccount: "Already have an account?",
    signIn: "Sign in",
    errorMismatch: "Passwords do not match",
    errorLength: "Password must be at least 6 characters",
  },
  ar: {
    back: "رجوع",
    title: "إنشاء حساب",
    subtitle: "ابدأ في توليد دراسات الجدوى الاحترافية",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    confirmPassword: "تأكيد كلمة المرور",
    creating: "جاري إنشاء الحساب...",
    createAccount: "إنشاء حساب",
    haveAccount: "لديك حساب بالفعل؟",
    signIn: "تسجيل الدخول",
    errorMismatch: "كلمات المرور غير متطابقة",
    errorLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  },
};

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });
  const { register } = useAuth();
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
    
    if (password !== confirmPassword) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: t.errorMismatch,
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: t.errorLength,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await register(email, password, name);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background flex items-center justify-center p-4 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className={`absolute top-4 ${isRtl ? "right-4" : "left-4"}`}>
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="link-back-home">
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
          <CardTitle className="text-2xl font-bold">{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                type="text"
                placeholder={lang === "ar" ? "محمد أحمد" : "John Doe"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">{t.password}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                data-testid="input-confirm-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-register">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.creating}
                </>
              ) : (
                t.createAccount
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t.haveAccount} </span>
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              {t.signIn}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
