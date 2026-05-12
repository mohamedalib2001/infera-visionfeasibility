import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Redirect, Link } from "wouter";
import { 
  Users, FileText, CreditCard, TrendingUp, 
  Trash2, Edit2, Shield, Eye, EyeOff, ArrowLeft, ArrowRight
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalReports: number;
  activeSubscriptions: number;
  revenueThisMonth: number;
}

interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  language: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: string;
    reportsUsed: number;
    reportsLimit: number;
  } | null;
}

const texts = {
  en: {
    title: "Admin Dashboard",
    stats: "Statistics",
    users: "Users",
    projects: "Projects",
    subscriptions: "Subscriptions",
    totalUsers: "Total Users",
    totalProjects: "Total Projects",
    totalReports: "Total Reports",
    activeSubscriptions: "Active Subscriptions",
    revenue: "Revenue This Month",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    plan: "Plan",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    editUser: "Edit User",
    deleteConfirm: "Are you sure you want to delete this user?",
    admin: "Admin",
    analyst: "Analyst",
    investor: "Investor",
    client: "Client",
    noUsers: "No users found",
    noProjects: "No projects found",
    loading: "Loading...",
    accessDenied: "Access Denied",
    accessDeniedDesc: "You don't have permission to access this page.",
    back: "Back",
  },
  ar: {
    title: "لوحة تحكم المدير",
    stats: "الإحصائيات",
    users: "المستخدمين",
    projects: "المشاريع",
    subscriptions: "الاشتراكات",
    totalUsers: "إجمالي المستخدمين",
    totalProjects: "إجمالي المشاريع",
    totalReports: "إجمالي التقارير",
    activeSubscriptions: "الاشتراكات النشطة",
    revenue: "إيرادات هذا الشهر",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الصلاحية",
    status: "الحالة",
    plan: "الخطة",
    actions: "الإجراءات",
    active: "نشط",
    inactive: "غير نشط",
    edit: "تعديل",
    delete: "حذف",
    save: "حفظ",
    cancel: "إلغاء",
    editUser: "تعديل المستخدم",
    deleteConfirm: "هل أنت متأكد من حذف هذا المستخدم؟",
    admin: "مدير",
    analyst: "محلل",
    investor: "مستثمر",
    client: "عميل",
    noUsers: "لا يوجد مستخدمين",
    noProjects: "لا يوجد مشاريع",
    loading: "جاري التحميل...",
    accessDenied: "الوصول مرفوض",
    accessDeniedDesc: "ليس لديك صلاحية للوصول إلى هذه الصفحة.",
    back: "العودة",
  },
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = (user?.language as "en" | "ar") || "en";
  const t = texts[lang];
  const isRtl = lang === "ar";

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const isAdmin = user?.role === "admin";

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; role: string; isActive: boolean; name: string }) => {
      return apiRequest("PUT", `/api/admin/users/${data.id}`, {
        role: data.role,
        isActive: data.isActive,
        name: data.name,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setEditingUser(null);
      toast({ title: lang === "ar" ? "تم التحديث بنجاح" : "Updated successfully" });
    },
    onError: () => {
      toast({ title: lang === "ar" ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      setDeleteUserId(null);
      toast({ title: lang === "ar" ? "تم الحذف بنجاح" : "Deleted successfully" });
    },
    onError: () => {
      toast({ title: lang === "ar" ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    },
  });

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">{t.accessDenied}</h2>
            <p className="text-muted-foreground">{t.accessDeniedDesc}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    analyst: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    investor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    client: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  const planColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    basic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    pro: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  return (
    <div className={`min-h-screen bg-background ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" data-testid="button-back">
              {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{t.title}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card data-testid="stat-total-users">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalUsers}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-projects">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalProjects}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalProjects || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-reports">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalReports}</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.totalReports || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-subs">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{t.activeSubscriptions}</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? "..." : stats?.activeSubscriptions || 0}
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-revenue">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{t.revenue}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${statsLoading ? "..." : (stats?.revenueThisMonth || 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">{t.users}</TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">{t.subscriptions}</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.users}</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">{t.loading}</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">{t.noUsers}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-start p-2">{t.name}</th>
                          <th className="text-start p-2">{t.email}</th>
                          <th className="text-start p-2">{t.role}</th>
                          <th className="text-start p-2">{t.plan}</th>
                          <th className="text-start p-2">{t.status}</th>
                          <th className="text-start p-2">{t.actions}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b" data-testid={`user-row-${u.id}`}>
                            <td className="p-2">{u.name}</td>
                            <td className="p-2">{u.email}</td>
                            <td className="p-2">
                              <Badge className={roleColors[u.role] || ""}>
                                {t[u.role as keyof typeof t] || u.role}
                              </Badge>
                            </td>
                            <td className="p-2">
                              {u.subscription && (
                                <Badge className={planColors[u.subscription.plan] || ""}>
                                  {u.subscription.plan}
                                </Badge>
                              )}
                            </td>
                            <td className="p-2">
                              {u.isActive ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <Eye className="w-3 h-3 me-1" />
                                  {t.active}
                                </Badge>
                              ) : (
                                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                  <EyeOff className="w-3 h-3 me-1" />
                                  {t.inactive}
                                </Badge>
                              )}
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setEditingUser(u)}
                                  data-testid={`button-edit-user-${u.id}`}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                {u.id !== user.id && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setDeleteUserId(u.id)}
                                    data-testid={`button-delete-user-${u.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.subscriptions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-start p-2">{t.name}</th>
                        <th className="text-start p-2">{t.email}</th>
                        <th className="text-start p-2">{t.plan}</th>
                        <th className="text-start p-2">{t.status}</th>
                        <th className="text-start p-2">{lang === "ar" ? "التقارير" : "Reports"}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.filter(u => u.subscription).map((u) => (
                        <tr key={u.id} className="border-b" data-testid={`sub-row-${u.id}`}>
                          <td className="p-2">{u.name}</td>
                          <td className="p-2">{u.email}</td>
                          <td className="p-2">
                            <Badge className={planColors[u.subscription!.plan] || ""}>
                              {u.subscription!.plan}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant={u.subscription!.status === "active" ? "default" : "secondary"}>
                              {u.subscription!.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {u.subscription!.reportsUsed} / {u.subscription!.reportsLimit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.editUser}</DialogTitle>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t.name}</label>
                  <Input
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    data-testid="input-edit-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t.role}</label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger data-testid="select-edit-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t.admin}</SelectItem>
                      <SelectItem value="analyst">{t.analyst}</SelectItem>
                      <SelectItem value="investor">{t.investor}</SelectItem>
                      <SelectItem value="client">{t.client}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t.status}</label>
                  <Select
                    value={editingUser.isActive ? "active" : "inactive"}
                    onValueChange={(value) => setEditingUser({ ...editingUser, isActive: value === "active" })}
                  >
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t.active}</SelectItem>
                      <SelectItem value="inactive">{t.inactive}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)} data-testid="button-cancel-edit">
                {t.cancel}
              </Button>
              <Button
                onClick={() => {
                  if (editingUser) {
                    updateUserMutation.mutate({
                      id: editingUser.id,
                      role: editingUser.role,
                      isActive: editingUser.isActive,
                      name: editingUser.name,
                    });
                  }
                }}
                disabled={updateUserMutation.isPending}
                data-testid="button-save-edit"
              >
                {t.save}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t.delete}</DialogTitle>
            </DialogHeader>
            <p>{t.deleteConfirm}</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteUserId(null)} data-testid="button-cancel-delete">
                {t.cancel}
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteUserId && deleteUserMutation.mutate(deleteUserId)}
                disabled={deleteUserMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {t.delete}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
