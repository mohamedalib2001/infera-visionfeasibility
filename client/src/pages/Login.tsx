import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Globe, Eye, EyeOff } from "lucide-react";

const texts = {
  en: {
    back: "Back",
    title: "Welcome Back",
    subtitle: "Sign in to your INFERA Vision account",
    email: "Email",
    password: "Password",
    signingIn: "Signing in...",
    signIn: "Sign In",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    signUp: "Sign up",
  },
  ar: {
    back: "رجوع",
    title: "مرحباً بعودتك",
    subtitle: "سجل دخولك إلى حساب INFERA Vision",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    signingIn: "جاري تسجيل الدخول...",
    signIn: "تسجيل الدخول",
    forgotPassword: "نسيت كلمة المرور؟",
    noAccount: "ليس لديك حساب؟",
    signUp: "إنشاء حساب",
  },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });
  const { login } = useAuth();
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
      await login(email, password);
    } catch (error) {
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t.password}</Label>
                <Link href="/forgot-password" className="text-sm text-primary hover:underline" data-testid="link-forgot-password">
                  {t.forgotPassword}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={isRtl ? "pl-10" : "pr-10"}
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute top-1/2 -translate-y-1/2 h-8 w-8 ${isRtl ? "left-1" : "right-1"}`}
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t.signingIn}
                </>
              ) : (
                t.signIn
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t.noAccount} </span>
            <Link href="/register" className="text-primary hover:underline" data-testid="link-register">
              {t.signUp}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
