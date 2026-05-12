import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderPlus,
  FileText,
  CreditCard,
  Settings,
  Shield,
  LogOut,
  Moon,
  Sun,
  Globe,
  TrendingUp,
  BarChart3,
  HelpCircle,
  Mail,
  GitCompare,
  Dice5,
  Target,
  Users,
  Globe2,
  Handshake,
  ScrollText,
} from "lucide-react";
import { useState } from "react";

interface AppSidebarProps {
  lang: "en" | "ar";
  onLanguageChange: () => void;
  onThemeChange: () => void;
  isDark: boolean;
  side?: "left" | "right";
}

export function AppSidebar({ lang, onLanguageChange, onThemeChange, isDark, side = "left" }: AppSidebarProps) {
  const { user, subscription, logout } = useAuth();
  const [location] = useLocation();

  const texts = {
    en: {
      dashboard: "Dashboard",
      newProject: "New Project",
      myProjects: "My Projects",
      reports: "Reports",
      subscription: "Subscription",
      settings: "Settings",
      admin: "Admin Panel",
      logout: "Logout",
      navigation: "Navigation",
      account: "Account",
      tools: "Tools",
      smartTools: "Smart Tools",
      support: "Support",
      help: "Help Center",
      contact: "Contact Us",
      analytics: "Analytics",
      free: "Free",
      plan: "Plan",
      compare: "Compare Projects",
      monteCarlo: "Monte Carlo",
      kpiTracker: "KPI Tracker",
      competitors: "Competitors",
      marketData: "Market Data",
      investors: "Investors",
      contracts: "Contracts",
    },
    ar: {
      dashboard: "لوحة التحكم",
      newProject: "مشروع جديد",
      myProjects: "مشاريعي",
      reports: "التقارير",
      subscription: "الاشتراك",
      settings: "الإعدادات",
      admin: "لوحة المدير",
      logout: "تسجيل الخروج",
      navigation: "التنقل",
      account: "الحساب",
      tools: "الأدوات",
      smartTools: "أدوات ذكية",
      support: "الدعم",
      help: "مركز المساعدة",
      contact: "اتصل بنا",
      analytics: "التحليلات",
      free: "مجاني",
      plan: "الخطة",
      compare: "مقارنة المشاريع",
      monteCarlo: "مونت كارلو",
      kpiTracker: "متتبع KPI",
      competitors: "المنافسين",
      marketData: "بيانات السوق",
      investors: "المستثمرين",
      contracts: "العقود",
    },
  };

  const t = texts[lang];

  const mainNavItems = [
    {
      title: t.dashboard,
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: t.newProject,
      url: "/projects/new",
      icon: FolderPlus,
    },
  ];

  const toolsItems = [
    {
      title: t.analytics,
      url: "/analytics",
      icon: BarChart3,
    },
    {
      title: t.reports,
      url: "/reports",
      icon: FileText,
    },
  ];

  const smartToolsItems = [
    {
      title: t.compare,
      url: "/tools/compare",
      icon: GitCompare,
    },
    {
      title: t.monteCarlo,
      url: "/tools/monte-carlo",
      icon: Dice5,
    },
    {
      title: t.kpiTracker,
      url: "/tools/kpi-tracker",
      icon: Target,
    },
    {
      title: t.competitors,
      url: "/tools/competitors",
      icon: Users,
    },
    {
      title: t.marketData,
      url: "/tools/market-data",
      icon: Globe2,
    },
    {
      title: t.investors,
      url: "/tools/investors",
      icon: Handshake,
    },
    {
      title: t.contracts,
      url: "/tools/contracts",
      icon: ScrollText,
    },
  ];

  const accountItems = [
    {
      title: t.subscription,
      url: "/pricing",
      icon: CreditCard,
    },
  ];

  const supportItems = [
    {
      title: t.help,
      url: "/help",
      icon: HelpCircle,
    },
    {
      title: t.contact,
      url: "/contact",
      icon: Mail,
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar side={side}>
      <SidebarHeader className="p-4">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              INFERA Vision
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.navigation}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.tools}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.smartTools}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {smartToolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.account}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                      {item.url === "/pricing" && (
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {subscription?.plan || t.free}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/admin"}>
                    <Link href="/admin">
                      <Shield className="w-4 h-4" />
                      <span>{t.admin}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.support}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {supportItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onLanguageChange}
            className="flex-shrink-0"
            data-testid="sidebar-button-language"
          >
            <Globe className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeChange}
            className="flex-shrink-0"
            data-testid="sidebar-button-theme"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="flex-shrink-0"
            data-testid="sidebar-button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>

        <SidebarSeparator />

        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9">
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
