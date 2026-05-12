import { Link } from "wouter";

interface LandingFooterProps {
  lang: "en" | "ar";
}

const texts = {
  en: {
    platformName: "INFERA VisionFeasibility™",
    platformDesc: "AI-powered platform for generating professional investment feasibility studies. Designed for entrepreneurs, investors, and businesses in MENA markets seeking comprehensive financial analysis, market research, and risk assessment in English and Arabic.",
    company: "Company",
    about: "About",
    careers: "Careers",
    contact: "Contact",
    security: "Security",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    cookies: "Cookie Policy",
    copyright: "All rights reserved.",
  },
  ar: {
    platformName: "INFERA VisionFeasibility™",
    platformDesc: "منصة مدعومة بالذكاء الاصطناعي لإعداد دراسات الجدوى الاستثمارية الاحترافية. مصممة لرواد الأعمال والمستثمرين والشركات في أسواق الشرق الأوسط وشمال أفريقيا، تقدم تحليلاً مالياً شاملاً وأبحاث سوق وتقييم مخاطر باللغتين العربية والإنجليزية.",
    company: "الشركة",
    about: "من نحن",
    careers: "الوظائف",
    contact: "اتصل بنا",
    security: "الأمان",
    legal: "قانوني",
    privacy: "سياسة الخصوصية",
    terms: "شروط الخدمة",
    cookies: "سياسة ملفات تعريف الارتباط",
    copyright: "جميع الحقوق محفوظة.",
  },
};

export function LandingFooter({ lang }: LandingFooterProps) {
  const t = texts[lang];
  const isRtl = lang === "ar";
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="border-t bg-muted/30"
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-xs">IV</span>
              </div>
              <span className="font-bold text-lg">
                {t.platformName}
              </span>
            </div>
            <p className={`text-muted-foreground text-sm leading-relaxed max-w-md ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.platformDesc}
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">
              {t.company}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-about">
                    {t.about}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/careers">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-careers">
                    {t.careers}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-contact">
                    {t.contact}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/security">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-security">
                    {t.security}
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider mb-4">
              {t.legal}
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/privacy">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-privacy">
                    {t.privacy}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-terms">
                    {t.terms}
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/cookies">
                  <span className="text-muted-foreground hover:text-foreground transition-colors text-sm cursor-pointer" data-testid="link-footer-cookies">
                    {t.cookies}
                  </span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center">
                <span className="font-bold text-primary-foreground text-[10px]">IV</span>
              </div>
              <span className="font-semibold text-sm">INFERA VisionFeasibility</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {currentYear} INFERA VisionFeasibility™. {t.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
