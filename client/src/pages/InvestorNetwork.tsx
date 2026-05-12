import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Handshake,
  Search,
  Send,
  Building2,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Filter,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";

interface Project {
  id: number;
  name: string;
  industry: string;
  status: string;
}

interface Investor {
  id: number;
  name: string;
  type: "vc" | "angel" | "pe" | "family_office" | "corporate";
  industries: string[];
  investmentRange: { min: number; max: number };
  location: string;
  website?: string;
  email?: string;
  description: string;
  recentDeals: number;
  portfolioSize: number;
}

interface InvestorInterest {
  investorId: number;
  projectId: number;
  status: "pending" | "viewed" | "interested" | "meeting_scheduled" | "passed";
  sentAt: string;
  viewedAt?: string;
}

export default function InvestorNetwork() {
  const { user } = useAuth();
  const { toast } = useToast();
  const lang = (user?.language || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
  const [pitchMessage, setPitchMessage] = useState("");

  const texts = {
    en: {
      title: "Investor Network",
      subtitle: "Connect with investors matching your project",
      selectProject: "Select Project",
      search: "Search investors...",
      filterIndustry: "Filter by Industry",
      filterType: "Filter by Type",
      all: "All",
      vc: "Venture Capital",
      angel: "Angel Investor",
      pe: "Private Equity",
      familyOffice: "Family Office",
      corporate: "Corporate VC",
      sendPitch: "Send Pitch",
      pitchSent: "Pitch Sent",
      investmentRange: "Investment Range",
      recentDeals: "Recent Deals",
      portfolioSize: "Portfolio Size",
      viewProfile: "View Profile",
      writeMessage: "Write your pitch message",
      send: "Send",
      cancel: "Cancel",
      noProject: "Select a project to find matching investors",
      noInvestors: "No investors found matching your criteria",
      pending: "Pending",
      viewed: "Viewed",
      interested: "Interested",
      meetingScheduled: "Meeting Scheduled",
      passed: "Passed",
      sentSuccessfully: "Pitch sent successfully",
      yourPitches: "Your Pitches",
    },
    ar: {
      title: "شبكة المستثمرين",
      subtitle: "تواصل مع مستثمرين مناسبين لمشروعك",
      selectProject: "اختر المشروع",
      search: "ابحث عن مستثمرين...",
      filterIndustry: "تصفية حسب القطاع",
      filterType: "تصفية حسب النوع",
      all: "الكل",
      vc: "رأس المال الجريء",
      angel: "مستثمر ملائكي",
      pe: "الملكية الخاصة",
      familyOffice: "مكتب عائلي",
      corporate: "شركات استثمارية",
      sendPitch: "إرسال عرض",
      pitchSent: "تم الإرسال",
      investmentRange: "نطاق الاستثمار",
      recentDeals: "صفقات حديثة",
      portfolioSize: "حجم المحفظة",
      viewProfile: "عرض الملف",
      writeMessage: "اكتب رسالة العرض",
      send: "إرسال",
      cancel: "إلغاء",
      noProject: "اختر مشروعاً للبحث عن مستثمرين مناسبين",
      noInvestors: "لم يتم العثور على مستثمرين مطابقين",
      pending: "قيد الانتظار",
      viewed: "تم المشاهدة",
      interested: "مهتم",
      meetingScheduled: "تم جدولة اجتماع",
      passed: "رفض",
      sentSuccessfully: "تم إرسال العرض بنجاح",
      yourPitches: "عروضك المرسلة",
    },
  };

  const t = texts[lang];

  const INDUSTRIES = [
    "Technology",
    "Healthcare",
    "FinTech",
    "E-commerce",
    "Real Estate",
    "Food & Beverage",
    "Manufacturing",
    "Energy",
    "Education",
    "Transportation",
  ];

  const INVESTOR_TYPES = [
    { value: "vc", label: t.vc },
    { value: "angel", label: t.angel },
    { value: "pe", label: t.pe },
    { value: "family_office", label: t.familyOffice },
    { value: "corporate", label: t.corporate },
  ];

  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const completedProjects = projects?.filter((p) => p.status === "completed") || [];

  const { data: investors } = useQuery<Investor[]>({
    queryKey: ["/api/investors", selectedIndustry, selectedType, searchQuery],
    enabled: !!selectedProject,
  });

  const { data: interests } = useQuery<InvestorInterest[]>({
    queryKey: ["/api/projects", selectedProject, "investor-interests"],
    enabled: !!selectedProject,
  });

  const sendPitchMutation = useMutation({
    mutationFn: async ({ investorId, message }: { investorId: number; message: string }) => {
      const res = await apiRequest("POST", `/api/projects/${selectedProject}/send-pitch`, {
        investorId,
        message,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/projects", selectedProject, "investor-interests"],
      });
      setSelectedInvestor(null);
      setPitchMessage("");
      toast({ title: t.sentSuccessfully });
    },
  });

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(0)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />{t.pending}</Badge>;
      case "viewed":
        return <Badge className="bg-blue-500/10 text-blue-600"><Eye className="w-3 h-3 mr-1" />{t.viewed}</Badge>;
      case "interested":
        return <Badge className="bg-green-500/10 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />{t.interested}</Badge>;
      case "meeting_scheduled":
        return <Badge className="bg-purple-500/10 text-purple-600">{t.meetingScheduled}</Badge>;
      case "passed":
        return <Badge variant="destructive">{t.passed}</Badge>;
      default:
        return null;
    }
  };

  const getInvestorInterest = (investorId: number) => {
    return interests?.find((i) => i.investorId === investorId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredInvestors = investors?.filter((investor) => {
    if (selectedIndustry !== "all" && !investor.industries.includes(selectedIndustry)) {
      return false;
    }
    if (selectedType !== "all" && investor.type !== selectedType) {
      return false;
    }
    if (searchQuery && !investor.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <DashboardLayout title={t.title}>
      <div className={`p-6 space-y-6 ${isRtl ? "text-right" : "text-left"}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t.title}</h1>
            <p className="text-muted-foreground mt-1">{t.subtitle}</p>
          </div>
          <Handshake className="w-8 h-8 text-primary" />
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger data-testid="select-project">
                  <SelectValue placeholder={t.selectProject} />
                </SelectTrigger>
                <SelectContent>
                  {completedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.search}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>

              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder={t.filterIndustry} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {INDUSTRIES.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder={t.filterType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {INVESTOR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Handshake className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noProject}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvestors && filteredInvestors.length > 0 ? (
              filteredInvestors.map((investor) => {
                const interest = getInvestorInterest(investor.id);
                return (
                  <Card key={investor.id} className="flex flex-col">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(investor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{investor.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3" />
                            {investor.location}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex flex-wrap gap-1 mb-3">
                        {investor.industries.slice(0, 3).map((ind) => (
                          <Badge key={ind} variant="outline" className="text-xs">
                            {ind}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {investor.description}
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t.investmentRange}</p>
                          <p className="font-medium">
                            {formatCurrency(investor.investmentRange.min)} -{" "}
                            {formatCurrency(investor.investmentRange.max)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t.recentDeals}</p>
                          <p className="font-medium">{investor.recentDeals}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      {interest ? (
                        <div className="w-full flex items-center justify-between">
                          {getStatusBadge(interest.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(interest.sentAt).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              className="w-full"
                              onClick={() => setSelectedInvestor(investor)}
                              data-testid={`button-pitch-${investor.id}`}
                            >
                              <Send className="w-4 h-4 mr-2" />
                              {t.sendPitch}
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{t.sendPitch}</DialogTitle>
                              <DialogDescription>
                                {investor.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <Textarea
                                placeholder={t.writeMessage}
                                value={pitchMessage}
                                onChange={(e) => setPitchMessage(e.target.value)}
                                rows={6}
                                data-testid="textarea-pitch"
                              />
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setSelectedInvestor(null)}>
                                  {t.cancel}
                                </Button>
                                <Button
                                  onClick={() =>
                                    sendPitchMutation.mutate({
                                      investorId: investor.id,
                                      message: pitchMessage,
                                    })
                                  }
                                  disabled={!pitchMessage || sendPitchMutation.isPending}
                                  data-testid="button-send-pitch"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  {t.send}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Handshake className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t.noInvestors}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
