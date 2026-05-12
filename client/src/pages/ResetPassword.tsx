import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, ArrowRight, Globe, Lock, CheckCircle, Eye, EyeOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const texts = {
  en: {
    back: "Back to Login",
    title: "Reset Password",
    subtitle: "Enter your new password",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    passwordPlaceholder: "••••••••",
    resetting: "Resetting...",
    resetPassword: "Reset Password",
    successTitle: "Password Reset!",
    successMessage: "Your password has been successfully reset. You can now log in with your new password.",
    backToLogin: "Go to Login",
    passwordMismatch: "Passwords do not match",
    passwordTooShort: "Password must be at least 6 characters",
    invalidToken: "Invalid or expired reset link",
  },
  ar: {
    back: "العودة لتسجيل الدخول",
    title: "إعادة تعيين كلمة المرور",
    subtitle: "أدخل كلمة المرور الجديدة",
    newPassword: "كلمة المرور الجديدة",
    confirmPassword: "تأكيد كلمة المرور",
    passwordPlaceholder: "••••••••",
    resetting: "جاري الحفظ...",
    resetPassword: "إعادة تعيين كلمة المرور",
    successTitle: "تم بنجاح!",
    successMessage: "تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    backToLogin: "الذهاب لتسجيل الدخول",
    passwordMismatch: "كلمات المرور غير متطابقة",
    passwordTooShort: "يجب أن تكون كلمة المرور 6 أحرف على الأقل",
    invalidToken: "رابط غير صالح أو منتهي الصلاحية",
  },
};

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [, setLocation] = useLocation();
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });
  const { toast } = useToast();
  const isRtl = lang === "ar";
  const t = texts[lang];

  const token = new URLSearchParams(window.location.search).get("token");

  const toggleLanguage = () => {
    const newLang = lang === "en" ? "ar" : "en";
    setLang(newLang);
    localStorage.setItem("lang", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    if (!token) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: t.invalidToken,
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [token, setLocation, t.invalidToken, lang, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: t.passwordTooShort,
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: t.passwordMismatch,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await apiRequest("POST", "/api/auth/reset-password", { token, password });
      setIsSuccess(true);
    } catch (error) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: error instanceof Error ? error.message : t.invalidToken,
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
              <Lock className="w-6 h-6 text-primary" />
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
              <Button className="w-full" data-testid="button-go-to-login">
                {t.backToLogin}
              </Button>
            </Link>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">{t.newPassword}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t.passwordPlaceholder}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={t.passwordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-reset-password">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t.resetting}
                  </>
                ) : (
                  t.resetPassword
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
