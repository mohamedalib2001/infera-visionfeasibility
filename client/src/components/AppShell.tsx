import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_COLLAPSED = "3rem";

interface MainContentProps {
  children: React.ReactNode;
  title?: string;
  isRtl: boolean;
}

function MainContent({ children, title, isRtl }: MainContentProps) {
  const { state, isMobile } = useSidebar();
  const isCollapsed = state === "collapsed";

  const currentSidebarWidth = isMobile ? "0" : (isCollapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH);

  const mainContentStyle: React.CSSProperties = {
    [isRtl ? 'marginRight' : 'marginLeft']: currentSidebarWidth,
    transition: 'margin 0.2s ease-in-out',
    minHeight: '100vh',
  };

  return (
    <div 
      className="flex flex-col bg-background"
      style={mainContentStyle}
    >
      <header 
        className="flex h-14 shrink-0 items-center gap-2 border-b px-4 sticky top-0 bg-background z-10"
        dir={isRtl ? "rtl" : "ltr"}
      >
        <SidebarTrigger 
          className={isRtl ? "-mr-1" : "-ml-1"} 
          data-testid="button-sidebar-toggle" 
        />
        <Separator 
          orientation="vertical" 
          className={`h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} 
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{title || (isRtl ? "لوحة التحكم" : "Dashboard")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main 
        className={`flex-1 overflow-auto ${isRtl ? 'text-right' : 'text-left'}`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {children}
      </main>
    </div>
  );
}

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  showSidebar?: boolean;
}

export function AppShell({ children, title, showSidebar = true }: AppShellProps) {
  const { user, setLanguage } = useAuth();
  const [isDark, setIsDark] = useState(() => 
    typeof document !== 'undefined' ? document.documentElement.classList.contains("dark") : false
  );
  
  const lang = useMemo(() => {
    const userLang = user?.language as "en" | "ar" | undefined;
    const storedLang = typeof localStorage !== 'undefined' ? localStorage.getItem("lang") as "en" | "ar" | null : null;
    return userLang || storedLang || "en";
  }, [user?.language]);

  const isRtl = lang === "ar";

  useEffect(() => {
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [isRtl, lang]);

  const toggleTheme = useCallback(() => {
    document.documentElement.classList.toggle("dark");
    setIsDark(prev => !prev);
  }, []);

  const toggleLanguage = useCallback(() => {
    const newLang = lang === "en" ? "ar" : "en";
    localStorage.setItem("lang", newLang);
    setLanguage(newLang);
  }, [lang, setLanguage]);

  const sidebarStyle = useMemo(() => ({
    "--sidebar-width": SIDEBAR_WIDTH,
    "--sidebar-width-icon": SIDEBAR_WIDTH_COLLAPSED,
  }), []);

  if (!showSidebar) {
    return (
      <div 
        className={`min-h-screen w-full bg-background ${isRtl ? 'text-right' : 'text-left'}`}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="relative min-h-screen w-full bg-background" dir={isRtl ? "rtl" : "ltr"}>
        <AppSidebar
          lang={lang}
          onLanguageChange={toggleLanguage}
          onThemeChange={toggleTheme}
          isDark={isDark}
          side={isRtl ? "right" : "left"}
        />
        <MainContent title={title} isRtl={isRtl}>
          {children}
        </MainContent>
      </div>
    </SidebarProvider>
  );
}

interface DashboardContentProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardContent({ children, title }: DashboardContentProps) {
  return (
    <AppShell title={title} showSidebar={true}>
      {children}
    </AppShell>
  );
}
