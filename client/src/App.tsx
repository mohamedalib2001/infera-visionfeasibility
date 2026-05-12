import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import NewProject from "@/pages/NewProject";
import ProjectDetail from "@/pages/ProjectDetail";
import ReportView from "@/pages/ReportView";
import Pricing from "@/pages/Pricing";
import AdminDashboard from "@/pages/AdminDashboard";
import Analytics from "@/pages/Analytics";
import Reports from "@/pages/Reports";
import HelpCenter from "@/pages/HelpCenter";
import Contact from "@/pages/Contact";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Cookies from "@/pages/Cookies";
import About from "@/pages/About";
import Careers from "@/pages/Careers";
import Security from "@/pages/Security";
import ProjectComparison from "@/pages/ProjectComparison";
import MonteCarloSimulation from "@/pages/MonteCarloSimulation";
import KPITracker from "@/pages/KPITracker";
import CompetitorAnalysis from "@/pages/CompetitorAnalysis";
import MarketData from "@/pages/MarketData";
import InvestorNetwork from "@/pages/InvestorNetwork";
import ContractTemplates from "@/pages/ContractTemplates";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const lang = (user?.language || localStorage.getItem("lang") || "en") as "en" | "ar";
  const isRtl = lang === "ar";

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? "rtl" : "ltr"}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/projects/new">
        <ProtectedRoute component={NewProject} />
      </Route>
      <Route path="/projects/:id">
        <ProtectedRoute component={ProjectDetail} />
      </Route>
      <Route path="/reports/:id">
        <ProtectedRoute component={ReportView} />
      </Route>
      <Route path="/pricing" component={Pricing} />
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} />
      </Route>
      <Route path="/analytics">
        <ProtectedRoute component={Analytics} />
      </Route>
      <Route path="/reports">
        <ProtectedRoute component={Reports} />
      </Route>
      <Route path="/help">
        <ProtectedRoute component={HelpCenter} />
      </Route>
      <Route path="/contact" component={Contact} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/cookies" component={Cookies} />
      <Route path="/about" component={About} />
      <Route path="/careers" component={Careers} />
      <Route path="/security" component={Security} />
      <Route path="/tools/compare">
        <ProtectedRoute component={ProjectComparison} />
      </Route>
      <Route path="/tools/monte-carlo">
        <ProtectedRoute component={MonteCarloSimulation} />
      </Route>
      <Route path="/tools/kpi-tracker">
        <ProtectedRoute component={KPITracker} />
      </Route>
      <Route path="/tools/competitors">
        <ProtectedRoute component={CompetitorAnalysis} />
      </Route>
      <Route path="/tools/market-data">
        <ProtectedRoute component={MarketData} />
      </Route>
      <Route path="/tools/investors">
        <ProtectedRoute component={InvestorNetwork} />
      </Route>
      <Route path="/tools/contracts">
        <ProtectedRoute component={ContractTemplates} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
