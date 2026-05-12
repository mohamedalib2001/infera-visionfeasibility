import { AppShell } from "@/components/AppShell";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <AppShell title={title} showSidebar={true}>
      {children}
    </AppShell>
  );
}
