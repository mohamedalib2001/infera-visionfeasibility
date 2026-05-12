import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  const [lang, setLang] = useState<"en" | "ar">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("lang") as "en" | "ar") || "en";
    }
    return "en";
  });
  const isRtl = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  return (
    <div className={`min-h-screen w-full flex items-center justify-center bg-background ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">
              {lang === "ar" ? "404 الصفحة غير موجودة" : "404 Page Not Found"}
            </h1>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            {lang === "ar" 
              ? "الصفحة التي تبحث عنها غير موجودة."
              : "The page you are looking for does not exist."}
          </p>

          <Link href="/">
            <Button variant="outline" className="mt-4" data-testid="link-home">
              {isRtl ? <ArrowRight className="w-4 h-4 ml-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
              {lang === "ar" ? "العودة للرئيسية" : "Back to Home"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
