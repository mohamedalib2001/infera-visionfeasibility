import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  HelpCircle, 
  FileText, 
  CreditCard, 
  BarChart3,
  MessageCircle,
  BookOpen
} from "lucide-react";

export default function HelpCenter() {
  const { user } = useAuth();
  const lang = (user?.language || "en") as "en" | "ar";

  const texts = {
    en: {
      title: "Help Center",
      subtitle: "Find answers to common questions",
      gettingStarted: "Getting Started",
      gettingStartedDesc: "Learn how to create your first feasibility study",
      reports: "Understanding Reports",
      reportsDesc: "Learn how to read and interpret your feasibility reports",
      billing: "Billing & Subscriptions",
      billingDesc: "Manage your subscription and payment methods",
      analytics: "Analytics Guide",
      analyticsDesc: "Understand your project analytics and metrics",
      faq: "FAQ",
      faqDesc: "Frequently asked questions and answers",
      contact: "Contact Support",
      contactDesc: "Get help from our support team",
    },
    ar: {
      title: "مركز المساعدة",
      subtitle: "ابحث عن إجابات للأسئلة الشائعة",
      gettingStarted: "البدء",
      gettingStartedDesc: "تعلم كيفية إنشاء أول دراسة جدوى لك",
      reports: "فهم التقارير",
      reportsDesc: "تعلم كيفية قراءة وتفسير تقارير الجدوى الخاصة بك",
      billing: "الفوترة والاشتراكات",
      billingDesc: "إدارة اشتراكك وطرق الدفع",
      analytics: "دليل التحليلات",
      analyticsDesc: "فهم تحليلات ومقاييس مشروعك",
      faq: "الأسئلة الشائعة",
      faqDesc: "الأسئلة المتكررة وإجاباتها",
      contact: "تواصل مع الدعم",
      contactDesc: "احصل على مساعدة من فريق الدعم لدينا",
    },
  };

  const t = texts[lang];

  const helpTopics = [
    { title: t.gettingStarted, description: t.gettingStartedDesc, icon: BookOpen },
    { title: t.reports, description: t.reportsDesc, icon: FileText },
    { title: t.billing, description: t.billingDesc, icon: CreditCard },
    { title: t.analytics, description: t.analyticsDesc, icon: BarChart3 },
    { title: t.faq, description: t.faqDesc, icon: HelpCircle },
    { title: t.contact, description: t.contactDesc, icon: MessageCircle },
  ];

  return (
    <DashboardLayout title={t.title}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-2">{t.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {helpTopics.map((topic, index) => (
            <Card key={index} className="hover-elevate cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <topic.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{topic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
