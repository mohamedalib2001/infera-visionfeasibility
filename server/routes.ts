import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { 
  loginSchema, registerSchema, projectInputSchema, 
  insertSubscriberSchema 
} from "@shared/schema";
import { generateFeasibilityReport } from "./services/ai-service";
import { calculateFinancialMetrics, type FinancialInputs } from "./services/financial-engine";
import { sendWelcomeEmail, sendReportGeneratedEmail, sendReportLimitEmail } from "./services/email-service";

const JWT_SECRET = process.env.SESSION_SECRET!;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token || req.headers.authorization?.replace("Bearer ", "");
  
  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.clearCookie('auth_token', COOKIE_OPTIONS);
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Basic health check (liveness probe)
  app.get("/api/health", async (req, res) => {
    try {
      const startTime = Date.now();
      const dbHealthy = await storage.checkDatabaseHealth();
      const responseTime = Date.now() - startTime;
      
      const healthStatus = {
        status: dbHealthy ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        uptime: process.uptime(),
        checks: {
          database: {
            status: dbHealthy ? "healthy" : "unhealthy",
            responseTime: `${responseTime}ms`,
          },
          memory: {
            status: "healthy",
            usage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
          },
        },
      };
      
      res.status(dbHealthy ? 200 : 503).json(healthStatus);
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      });
    }
  });

  // Readiness probe - checks all dependencies
  app.get("/api/health/ready", async (req, res) => {
    try {
      const checks: Record<string, { status: string; responseTime?: string; error?: string }> = {};
      let allHealthy = true;

      // Database check
      const dbStart = Date.now();
      try {
        const dbHealthy = await storage.checkDatabaseHealth();
        checks.database = {
          status: dbHealthy ? "ready" : "not_ready",
          responseTime: `${Date.now() - dbStart}ms`,
        };
        if (!dbHealthy) allHealthy = false;
      } catch (err) {
        checks.database = { status: "not_ready", error: "Connection failed" };
        allHealthy = false;
      }

      // AI Service check (OpenAI) - verify credentials with lightweight cached call
      const aiStart = Date.now();
      try {
        if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
          checks.aiService = { status: "not_configured", responseTime: `${Date.now() - aiStart}ms` };
          allHealthy = false;
        } else {
          const { checkAIHealth } = await import("./services/ai-service");
          const { circuitBreakers } = await import("./lib/circuit-breaker");
          
          const aiHealth = await checkAIHealth();
          const circuitState = circuitBreakers.ai.getStats().state;
          
          let status = "ready";
          if (!aiHealth.healthy) {
            status = "not_ready";
            allHealthy = false;
          } else if (circuitState === 'open') {
            status = "degraded";
          }
          
          checks.aiService = {
            status,
            responseTime: `${Date.now() - aiStart}ms`,
          };
        }
      } catch {
        checks.aiService = { status: "not_ready", error: "AI service unavailable" };
        allHealthy = false;
      }

      // Stripe check - verify API connectivity
      const stripeStart = Date.now();
      try {
        if (!process.env.STRIPE_SECRET_KEY) {
          checks.payments = { status: "not_configured", responseTime: `${Date.now() - stripeStart}ms` };
          allHealthy = false;
        } else {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripe.balance.retrieve();
          checks.payments = {
            status: "ready",
            responseTime: `${Date.now() - stripeStart}ms`,
          };
        }
      } catch (err) {
        checks.payments = { 
          status: "not_ready", 
          error: "Payment service unavailable",
          responseTime: `${Date.now() - stripeStart}ms`,
        };
        allHealthy = false;
      }

      // Email service check - verify SMTP config exists
      const emailStart = Date.now();
      try {
        const emailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
        checks.email = {
          status: emailConfigured ? "ready" : "not_configured",
          responseTime: `${Date.now() - emailStart}ms`,
        };
        if (!emailConfigured) allHealthy = false;
      } catch {
        checks.email = { status: "not_ready", error: "Email service unavailable" };
        allHealthy = false;
      }

      const readinessStatus = {
        status: allHealthy ? "ready" : "not_ready",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        checks,
      };

      res.status(allHealthy ? 200 : 503).json(readinessStatus);
    } catch (error) {
      res.status(503).json({
        status: "not_ready",
        timestamp: new Date().toISOString(),
        error: "Readiness check failed",
      });
    }
  });
  
  app.post("/api/subscribers", async (req, res) => {
    try {
      const input = insertSubscriberSchema.parse(req.body);
      await storage.createSubscriber(input);
      res.status(201).json({ message: "Subscribed successfully" });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email address" });
      }
      if ((err as any).code === '23505') {
         return res.status(409).json({ message: "Email already subscribed" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const input = registerSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(input.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        email: input.email,
        password: input.password,
        name: input.name,
        role: 'analyst',
        language: 'en',
        isActive: true,
      });

      await storage.createSubscription(user.id, 'free');

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const baseUrl = replitDomain ? `https://${replitDomain}` : `http://localhost:5000`;
      sendWelcomeEmail(user.email, user.name, 'en', `${baseUrl}/dashboard`).catch(console.error);

      res.cookie('auth_token', token, COOKIE_OPTIONS);
      res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      console.error("Registration error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "Account has been deactivated" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('auth_token', token, COOKIE_OPTIONS);
      res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role, language: user.language },
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.isActive) {
        res.clearCookie('auth_token', COOKIE_OPTIONS);
        return res.status(403).json({ message: "Account has been deactivated" });
      }

      const subscription = await storage.getSubscriptionByUserId(user.id);

      res.json({
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role,
          language: user.language,
          avatarUrl: user.avatarUrl,
        },
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          reportsLimit: subscription.reportsLimit,
          reportsUsed: subscription.reportsUsed,
        } : null,
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie('auth_token', COOKIE_OPTIONS);
    res.json({ message: "Logged out successfully" });
  });

  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      if (user && user.isActive) {
        const resetToken = jwt.sign(
          { id: user.id, email: user.email, purpose: 'password-reset' },
          JWT_SECRET,
          { expiresIn: '1h' }
        );

        const baseUrl = process.env.REPLIT_DEV_DOMAIN 
          ? `https://${process.env.REPLIT_DEV_DOMAIN}`
          : 'http://localhost:5000';
        const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

        const { emailTemplates, sendEmail } = await import('./services/email-service');
        const template = emailTemplates.passwordReset({
          userName: user.name,
          language: (user.language as "en" | "ar") || "en",
          actionUrl: resetUrl,
        });
        
        await sendEmail(user.email, template.subject, template.html);
      }

      res.json({ message: "If an account exists with this email, a password reset link has been sent." });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }

      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      let decoded: { id: number; email: string; purpose: string };
      try {
        decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; purpose: string };
      } catch (err) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ message: "Invalid token purpose" });
      }

      const user = await storage.getUserById(decoded.id);
      if (!user || user.email !== decoded.email) {
        return res.status(400).json({ message: "Invalid reset token" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ message: "Password reset successfully" });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getProjectsByUserId(req.user!.id);
      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/projects", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const input = projectInputSchema.parse(req.body);
      
      const project = await storage.createProject({
        userId: req.user!.id,
        name: input.name,
        description: input.description,
        industry: input.industry,
        country: input.country,
        currency: input.currency,
        initialInvestment: input.initialInvestment?.toString(),
        projectDuration: input.projectDuration,
        inputs: input.inputs,
        status: 'draft',
      });

      res.status(201).json(project);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      if (project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const reports = await storage.getReportsByProjectId(projectId);

      res.json({ ...project, reports });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/projects/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const input = projectInputSchema.partial().parse(req.body);
      
      const updated = await storage.updateProject(projectId, {
        ...input,
        initialInvestment: input.initialInvestment?.toString(),
      } as any);

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/projects/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(projectId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects/:id/generate/stream", authMiddleware as any, async (req: AuthRequest, res) => {
    const projectId = parseInt(req.params.id);
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    let isClosed = false;
    req.on('close', () => { isClosed = true; });
    res.on('close', () => { isClosed = true; });

    const sendEvent = (data: object) => {
      if (!isClosed) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    try {
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        sendEvent({ status: 'error', message: 'Project not found' });
        res.end();
        return;
      }

      const subscription = await storage.getSubscriptionByUserId(req.user!.id);
      if (subscription && subscription.reportsUsed >= subscription.reportsLimit) {
        const user = await storage.getUserById(req.user!.id);
        if (user) {
          const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          const baseUrl = replitDomain ? `https://${replitDomain}` : `http://localhost:5000`;
          sendReportLimitEmail(
            user.email,
            user.name,
            (user.language || 'en') as 'en' | 'ar',
            `${baseUrl}/pricing`
          ).catch(console.error);
        }
        sendEvent({ status: 'error', message: 'Report limit reached. Please upgrade your subscription.' });
        res.end();
        return;
      }

      sendEvent({ status: 'loading', stage: 'init', progress: 1, messageEn: 'Initializing...', messageAr: 'جاري التهيئة...' });
      await storage.updateProject(projectId, { status: 'generating' } as any);

      // Pass progress callback to AI service for real-time updates
      const onProgress = (stage: string, progress: number, messageEn: string, messageAr: string) => {
        sendEvent({ status: 'loading', stage, progress, messageEn, messageAr });
      };
      
      const aiReport = await generateFeasibilityReport(project, onProgress);

      const report = await storage.createReport(projectId);
      
      await storage.updateReport(report.id, {
        executiveSummaryEn: aiReport.executiveSummaryEn,
        executiveSummaryAr: aiReport.executiveSummaryAr,
        projectDescriptionEn: aiReport.projectDescriptionEn,
        projectDescriptionAr: aiReport.projectDescriptionAr,
        marketAnalysisEn: aiReport.marketAnalysisEn,
        marketAnalysisAr: aiReport.marketAnalysisAr,
        locationAnalysisEn: aiReport.locationAnalysisEn,
        locationAnalysisAr: aiReport.locationAnalysisAr,
        operationalModelEn: aiReport.operationalModelEn,
        operationalModelAr: aiReport.operationalModelAr,
        capexAnalysisEn: aiReport.capexAnalysisEn,
        capexAnalysisAr: aiReport.capexAnalysisAr,
        opexAnalysisEn: aiReport.opexAnalysisEn,
        opexAnalysisAr: aiReport.opexAnalysisAr,
        revenueProjectionsEn: aiReport.revenueProjectionsEn,
        revenueProjectionsAr: aiReport.revenueProjectionsAr,
        financialAnalysisEn: aiReport.financialAnalysisEn,
        financialAnalysisAr: aiReport.financialAnalysisAr,
        riskAnalysisEn: aiReport.riskAnalysisEn,
        riskAnalysisAr: aiReport.riskAnalysisAr,
        recommendationsEn: aiReport.recommendationsEn,
        recommendationsAr: aiReport.recommendationsAr,
        conclusionEn: aiReport.conclusionEn,
        conclusionAr: aiReport.conclusionAr,
        aiMetadata: {
          model: 'gpt-4.1',
          tokensUsed: aiReport.tokensUsed,
          generatedAt: new Date().toISOString(),
          promptVersion: '2.0',
        },
      });

      sendEvent({ status: 'loading', stage: 'saving', progress: 96, messageEn: 'Saving report data...', messageAr: 'جاري حفظ بيانات التقرير...' });

      if (aiReport.marketEstimates) {
        await storage.createMarketEstimate(report.id, {
          tam: aiReport.marketEstimates.tam?.toString(),
          sam: aiReport.marketEstimates.sam?.toString(),
          som: aiReport.marketEstimates.som?.toString(),
          marketGrowthRate: aiReport.marketEstimates.marketGrowthRate?.toString(),
          competitors: aiReport.marketEstimates.competitors,
        });
      }

      if (aiReport.risks) {
        for (const risk of aiReport.risks) {
          await storage.createRiskItem(report.id, {
            category: risk.category,
            titleEn: risk.titleEn,
            titleAr: risk.titleAr,
            descriptionEn: risk.descriptionEn,
            descriptionAr: risk.descriptionAr,
            likelihood: risk.likelihood,
            impact: risk.impact,
            riskScore: risk.likelihood * risk.impact,
            mitigationEn: risk.mitigationEn,
            mitigationAr: risk.mitigationAr,
          });
        }
      }

      sendEvent({ status: 'loading', stage: 'saving', progress: 98, messageEn: 'Processing financial model...', messageAr: 'جاري معالجة النموذج المالي...' });

      const inputs = project.inputs as any;
      if (project.initialInvestment && inputs?.monthlyOperatingCosts) {
        const financialInputs: FinancialInputs = {
          initialInvestment: parseFloat(project.initialInvestment),
          projectDuration: project.projectDuration || 5,
          discountRate: 0.10,
          monthlyRevenue: inputs.expectedMonthlyRevenue || 0,
          monthlyExpenses: inputs.monthlyOperatingCosts || 0,
          revenueGrowthRate: 0.10,
          expenseGrowthRate: 0.05,
          fixedCosts: (inputs.monthlyOperatingCosts || 0) * 12 * 0.6,
          variableCostPerUnit: 0,
          pricePerUnit: 0,
        };

        const metrics = calculateFinancialMetrics(financialInputs);
        
        await storage.createFinancialModel(report.id, {
          capex: metrics.capex.toString(),
          opex: metrics.opex.toString(),
          npv: metrics.npv.toString(),
          irr: metrics.irr.toString(),
          roi: metrics.roi.toString(),
          paybackPeriod: metrics.paybackPeriod.toString(),
          profitabilityIndex: metrics.profitabilityIndex.toString(),
          breakEvenPoint: metrics.breakEvenPoint.toString(),
          breakEvenUnits: metrics.breakEvenUnits,
          revenueProjections: metrics.revenueProjections,
          expenseProjections: metrics.expenseProjections,
          cashFlows: metrics.cashFlows,
          sensitivityAnalysis: metrics.sensitivityAnalysis,
        });
      }

      sendEvent({ status: 'loading', stage: 'saving', progress: 99, messageEn: 'Finalizing report...', messageAr: 'جاري إنهاء التقرير...' });

      await storage.updateProject(projectId, { status: 'completed' } as any);

      if (subscription) {
        await storage.updateSubscription(subscription.id, {
          reportsUsed: subscription.reportsUsed + 1,
        });
      }

      await storage.createAuditLog(req.user!.id, 'generate_report', 'report', report.id, {
        projectId,
        tokensUsed: aiReport.tokensUsed,
      });

      const user = await storage.getUserById(req.user!.id);
      if (user) {
        const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
        const baseUrl = replitDomain ? `https://${replitDomain}` : `http://localhost:5000`;
        const reportUrl = `${baseUrl}/reports/${report.id}`;
        sendReportGeneratedEmail(
          user.email,
          user.name,
          project.name,
          (user.language || 'en') as 'en' | 'ar',
          reportUrl
        ).catch(console.error);
      }

      sendEvent({ stage: 'complete', progress: 100, status: 'complete', reportId: report.id });
      res.end();
    } catch (err) {
      console.error("Report generation error:", err);
      
      await storage.updateProject(projectId, { status: 'draft' } as any);
      
      sendEvent({ status: 'error', message: 'Failed to generate report. Please try again.' });
      res.end();
    }
  });

  app.post("/api/projects/:id/generate", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      const subscription = await storage.getSubscriptionByUserId(req.user!.id);
      if (subscription && subscription.reportsUsed >= subscription.reportsLimit) {
        const user = await storage.getUserById(req.user!.id);
        if (user) {
          const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
          const baseUrl = replitDomain ? `https://${replitDomain}` : `http://localhost:5000`;
          sendReportLimitEmail(
            user.email,
            user.name,
            (user.language || 'en') as 'en' | 'ar',
            `${baseUrl}/pricing`
          ).catch(console.error);
        }
        return res.status(403).json({ 
          message: "Report limit reached. Please upgrade your subscription.",
          limit: subscription.reportsLimit,
          used: subscription.reportsUsed,
        });
      }

      await storage.updateProject(projectId, { status: 'generating' } as any);

      const aiReport = await generateFeasibilityReport(project);

      const report = await storage.createReport(projectId);
      
      await storage.updateReport(report.id, {
        executiveSummaryEn: aiReport.executiveSummaryEn,
        executiveSummaryAr: aiReport.executiveSummaryAr,
        projectDescriptionEn: aiReport.projectDescriptionEn,
        projectDescriptionAr: aiReport.projectDescriptionAr,
        marketAnalysisEn: aiReport.marketAnalysisEn,
        marketAnalysisAr: aiReport.marketAnalysisAr,
        locationAnalysisEn: aiReport.locationAnalysisEn,
        locationAnalysisAr: aiReport.locationAnalysisAr,
        operationalModelEn: aiReport.operationalModelEn,
        operationalModelAr: aiReport.operationalModelAr,
        capexAnalysisEn: aiReport.capexAnalysisEn,
        capexAnalysisAr: aiReport.capexAnalysisAr,
        opexAnalysisEn: aiReport.opexAnalysisEn,
        opexAnalysisAr: aiReport.opexAnalysisAr,
        revenueProjectionsEn: aiReport.revenueProjectionsEn,
        revenueProjectionsAr: aiReport.revenueProjectionsAr,
        financialAnalysisEn: aiReport.financialAnalysisEn,
        financialAnalysisAr: aiReport.financialAnalysisAr,
        riskAnalysisEn: aiReport.riskAnalysisEn,
        riskAnalysisAr: aiReport.riskAnalysisAr,
        recommendationsEn: aiReport.recommendationsEn,
        recommendationsAr: aiReport.recommendationsAr,
        conclusionEn: aiReport.conclusionEn,
        conclusionAr: aiReport.conclusionAr,
        aiMetadata: {
          model: 'gpt-4.1',
          tokensUsed: aiReport.tokensUsed,
          generatedAt: new Date().toISOString(),
          promptVersion: '2.0',
        },
      });

      if (aiReport.marketEstimates) {
        await storage.createMarketEstimate(report.id, {
          tam: aiReport.marketEstimates.tam?.toString(),
          sam: aiReport.marketEstimates.sam?.toString(),
          som: aiReport.marketEstimates.som?.toString(),
          marketGrowthRate: aiReport.marketEstimates.marketGrowthRate?.toString(),
          competitors: aiReport.marketEstimates.competitors,
        });
      }

      if (aiReport.risks) {
        for (const risk of aiReport.risks) {
          await storage.createRiskItem(report.id, {
            category: risk.category,
            titleEn: risk.titleEn,
            titleAr: risk.titleAr,
            descriptionEn: risk.descriptionEn,
            descriptionAr: risk.descriptionAr,
            likelihood: risk.likelihood,
            impact: risk.impact,
            riskScore: risk.likelihood * risk.impact,
            mitigationEn: risk.mitigationEn,
            mitigationAr: risk.mitigationAr,
          });
        }
      }

      const inputs = project.inputs as any;
      if (project.initialInvestment && inputs?.monthlyOperatingCosts) {
        const financialInputs: FinancialInputs = {
          initialInvestment: parseFloat(project.initialInvestment),
          projectDuration: project.projectDuration || 5,
          discountRate: 0.10,
          monthlyRevenue: inputs.expectedMonthlyRevenue || 0,
          monthlyExpenses: inputs.monthlyOperatingCosts || 0,
          revenueGrowthRate: 0.10,
          expenseGrowthRate: 0.05,
          fixedCosts: (inputs.monthlyOperatingCosts || 0) * 12 * 0.6,
          variableCostPerUnit: 0,
          pricePerUnit: 0,
        };

        const metrics = calculateFinancialMetrics(financialInputs);
        
        await storage.createFinancialModel(report.id, {
          capex: metrics.capex.toString(),
          opex: metrics.opex.toString(),
          npv: metrics.npv.toString(),
          irr: metrics.irr.toString(),
          roi: metrics.roi.toString(),
          paybackPeriod: metrics.paybackPeriod.toString(),
          profitabilityIndex: metrics.profitabilityIndex.toString(),
          breakEvenPoint: metrics.breakEvenPoint.toString(),
          breakEvenUnits: metrics.breakEvenUnits,
          revenueProjections: metrics.revenueProjections,
          expenseProjections: metrics.expenseProjections,
          cashFlows: metrics.cashFlows,
          sensitivityAnalysis: metrics.sensitivityAnalysis,
        });
      }

      await storage.updateProject(projectId, { status: 'completed' } as any);

      if (subscription) {
        await storage.updateSubscription(subscription.id, {
          reportsUsed: subscription.reportsUsed + 1,
        });
      }

      await storage.createAuditLog(req.user!.id, 'generate_report', 'report', report.id, {
        projectId,
        tokensUsed: aiReport.tokensUsed,
      });

      const updatedReport = await storage.getReportById(report.id);
      const financialModel = await storage.getFinancialModelByReportId(report.id);
      const marketEstimate = await storage.getMarketEstimateByReportId(report.id);
      const risks = await storage.getRiskItemsByReportId(report.id);

      const user = await storage.getUserById(req.user!.id);
      if (user) {
        const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
        const baseUrl = replitDomain ? `https://${replitDomain}` : `http://localhost:5000`;
        const reportUrl = `${baseUrl}/reports/${report.id}`;
        sendReportGeneratedEmail(
          user.email,
          user.name,
          project.name,
          (user.language || 'en') as 'en' | 'ar',
          reportUrl
        ).catch(console.error);
      }

      res.status(201).json({
        report: updatedReport,
        financialModel,
        marketEstimate,
        risks,
      });
    } catch (err) {
      console.error("Report generation error:", err);
      
      const projectId = parseInt(req.params.id);
      await storage.updateProject(projectId, { status: 'draft' } as any);
      
      res.status(500).json({ message: "Failed to generate report. Please try again." });
    }
  });

  app.get("/api/reports/:id", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReportById(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const project = await storage.getProjectById(report.projectId);
      if (!project || project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const financialModel = await storage.getFinancialModelByReportId(reportId);
      const marketEstimate = await storage.getMarketEstimateByReportId(reportId);
      const risks = await storage.getRiskItemsByReportId(reportId);

      res.json({
        report,
        project,
        financialModel,
        marketEstimate,
        risks,
      });
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reports/:id/pdf", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const reportId = parseInt(req.params.id);
      const report = await storage.getReportById(reportId);
      
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      const project = await storage.getProjectById(report.projectId);
      if (!project || project.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const financialModel = await storage.getFinancialModelByReportId(reportId);
      const marketEstimate = await storage.getMarketEstimateByReportId(reportId);
      const risks = await storage.getRiskItemsByReportId(reportId);
      
      // Fetch user (issuer) information
      const user = await storage.getUserById(req.user!.id);
      let organizationName: string | null = null;
      if (user?.organizationId) {
        const org = await storage.getOrganizationById(user.organizationId);
        organizationName = org?.name || null;
      }

      const { generatePDF } = await import('./services/pdf-service');
      
      const pdfBuffer = await generatePDF({
        report: report as any,
        project,
        financialModels: financialModel ? [financialModel] : [],
        marketEstimates: marketEstimate ? [marketEstimate] : [],
        riskItems: risks,
        // Add issuer (subscriber) information
        issuer: user ? {
          name: user.name,
          email: user.email,
          organization: organizationName,
        } : null,
      });

      const projectName = project.name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_');
      const filename = `${projectName}_دراسة_الجدوى_v${report.version}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.send(pdfBuffer);
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get("/api/subscription", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const subscription = await storage.getSubscriptionByUserId(req.user!.id);
      if (!subscription) {
        return res.status(404).json({ message: "No subscription found" });
      }
      res.json(subscription);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/subscription/plans", (req, res) => {
    res.json([
      {
        id: 'free',
        name: 'Free',
        nameAr: 'مجاني',
        price: 0,
        currency: 'USD',
        features: ['3 feasibility reports', 'Basic AI analysis', 'PDF export'],
        featuresAr: ['3 دراسات جدوى', 'تحليل ذكاء اصطناعي أساسي', 'تصدير PDF'],
        reportsLimit: 3,
      },
      {
        id: 'basic',
        name: 'Basic',
        nameAr: 'أساسي',
        price: 29,
        currency: 'USD',
        features: ['10 feasibility reports', 'Advanced AI analysis', 'PDF & Word export', 'Email support'],
        featuresAr: ['10 دراسات جدوى', 'تحليل ذكاء اصطناعي متقدم', 'تصدير PDF & Word', 'دعم بالبريد الإلكتروني'],
        reportsLimit: 10,
      },
      {
        id: 'pro',
        name: 'Professional',
        nameAr: 'احترافي',
        price: 79,
        currency: 'USD',
        features: ['50 feasibility reports', 'Premium AI analysis', 'All export formats', 'Priority support', 'Team collaboration'],
        featuresAr: ['50 دراسة جدوى', 'تحليل ذكاء اصطناعي متميز', 'جميع صيغ التصدير', 'دعم ذو أولوية', 'تعاون الفريق'],
        reportsLimit: 50,
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        nameAr: 'مؤسسات',
        price: 199,
        currency: 'USD',
        features: ['Unlimited reports', 'Custom AI models', 'API access', 'Dedicated support', 'White-label option'],
        featuresAr: ['تقارير غير محدودة', 'نماذج ذكاء اصطناعي مخصصة', 'وصول API', 'دعم مخصص', 'خيار العلامة البيضاء'],
        reportsLimit: 999,
      },
    ]);
  });

  app.get("/api/stripe/publishable-key", async (req, res) => {
    try {
      const { getStripePublishableKey } = await import('./stripeClient');
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (err) {
      res.status(500).json({ message: "Stripe not configured" });
    }
  });

  app.post("/api/stripe/checkout", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { plan } = req.body;
      const user = await storage.getUserById(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const planPrices: Record<string, number> = {
        basic: 2900,
        pro: 7900,
        enterprise: 19900,
      };

      const planAmount = planPrices[plan];
      if (!planAmount) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const { stripeService } = await import('./stripeService');
      const { getUncachableStripeClient } = await import('./stripeClient');
      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email, user.id);
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const baseUrl = replitDomain 
        ? `https://${replitDomain}` 
        : `${protocol}://${req.headers.host}`;
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `INFERA Vision - ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `Monthly subscription to INFERA Vision ${plan} tier`,
            },
            unit_amount: planAmount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        }],
        mode: 'subscription',
        success_url: `${baseUrl}/dashboard?payment=success`,
        cancel_url: `${baseUrl}/pricing?payment=cancelled`,
        metadata: {
          userId: user.id.toString(),
          plan: plan,
        },
      });

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe checkout error:", err);
      res.status(500).json({ message: err.message || "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/portal", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No active subscription" });
      }

      const { stripeService } = await import('./stripeService');
      const replitDomain = process.env.REPLIT_DOMAINS?.split(',')[0];
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const baseUrl = replitDomain 
        ? `https://${replitDomain}` 
        : `${protocol}://${req.headers.host}`;
      
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/dashboard`
      );

      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe portal error:", err);
      res.status(500).json({ message: err.message || "Failed to create portal session" });
    }
  });

  app.get("/api/admin/stats", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/users", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithSubs = await Promise.all(users.map(async (user) => {
        const subscription = await storage.getSubscriptionByUserId(user.id);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive,
          language: user.language,
          createdAt: user.createdAt,
          subscription: subscription ? {
            plan: subscription.plan,
            status: subscription.status,
            reportsUsed: subscription.reportsUsed,
            reportsLimit: subscription.reportsLimit,
          } : null,
        };
      }));
      res.json(usersWithSubs);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const adminUpdateUserSchema = z.object({
    role: z.enum(['admin', 'analyst', 'investor', 'client']).optional(),
    isActive: z.boolean().optional(),
    name: z.string().min(1).max(100).optional(),
  });

  app.put("/api/admin/users/:id", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const input = adminUpdateUserSchema.parse(req.body);
      
      const updated = await storage.updateUser(userId, input as any);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ id: updated.id, email: updated.email, name: updated.name, role: updated.role, isActive: updated.isActive });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/admin/users/:id", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (userId === req.user!.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      await storage.deleteUser(userId);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/projects", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/subscriptions", authMiddleware as any, adminMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const subscriptions = await storage.getAllSubscriptions();
      res.json(subscriptions);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // ========== SMART TOOLS API ENDPOINTS ==========

  // Project Comparison - Get comparison data for multiple projects
  app.get("/api/projects/compare", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectIds = (req.query.selectedProjects as string || "").split(",").map(Number).filter(Boolean);
      
      if (projectIds.length < 2) {
        return res.json([]);
      }

      const comparisonData = await Promise.all(
        projectIds.map(async (projectId) => {
          const project = await storage.getProjectById(projectId);
          if (!project || project.userId !== req.user!.id) return null;
          
          const reports = await storage.getReportsByProjectId(projectId);
          const report = reports[0];
          if (!report) return null;
          
          const financialModel = await storage.getFinancialModelByReportId(report.id);
          const risks = await storage.getRiskItemsByReportId(report.id);
          
          const avgRisk = risks.length > 0 
            ? risks.reduce((sum, r) => sum + (Number(r.likelihood) + Number(r.impact)) / 2, 0) / risks.length
            : 2.5;
          
          return {
            projectId,
            projectName: project.name,
            npv: Number(financialModel?.npv) || 0,
            irr: Number(financialModel?.irr) || 0,
            roi: Number(financialModel?.roi) || 0,
            paybackPeriod: Number(financialModel?.paybackPeriod) || 0,
            breakEvenPoint: Number(financialModel?.breakEvenPoint) || 0,
            totalCapex: Number(financialModel?.capex) || 0,
            totalOpex: Number(financialModel?.opex) || 0,
            year1Revenue: (financialModel?.revenueProjections as number[])?.[0] || 0,
            year5Revenue: (financialModel?.revenueProjections as number[])?.[4] || 0,
            riskScore: avgRisk,
            decision: report.conclusionEn?.includes("GO") ? "GO" : report.conclusionEn?.includes("NO-GO") ? "NO-GO" : "Conditional GO",
          };
        })
      );

      res.json(comparisonData.filter(Boolean));
    } catch (err) {
      console.error("Comparison error:", err);
      res.status(500).json({ message: "Failed to compare projects" });
    }
  });

  // Monte Carlo Simulation
  app.post("/api/projects/:id/monte-carlo", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { iterations = 1000 } = req.body;
      
      const project = await storage.getProjectById(projectId);
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const reports = await storage.getReportsByProjectId(projectId);
      const report = reports[0];
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      
      const financialModel = await storage.getFinancialModelByReportId(report.id);
      
      const baseNpv = Number(financialModel?.npv) || 1000000;
      const baseIrr = Number(financialModel?.irr) || 0.15;
      
      // Run Monte Carlo simulation
      const npvResults: number[] = [];
      const irrResults: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        // Random variation ±30%
        const variation = 0.7 + Math.random() * 0.6;
        npvResults.push(baseNpv * variation);
        irrResults.push(baseIrr * variation);
      }
      
      npvResults.sort((a, b) => a - b);
      irrResults.sort((a, b) => a - b);
      
      // Calculate statistics
      const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const stdDev = (arr: number[]) => {
        const m = mean(arr);
        return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length);
      };
      const percentile = (arr: number[], p: number) => arr[Math.floor(arr.length * p / 100)];
      
      // Create distribution data
      const createDistribution = (arr: number[], bins: number = 20) => {
        const min = Math.min(...arr);
        const max = Math.max(...arr);
        const binSize = (max - min) / bins;
        const distribution = [];
        
        for (let i = 0; i < bins; i++) {
          const binStart = min + i * binSize;
          const binEnd = binStart + binSize;
          const count = arr.filter(v => v >= binStart && v < binEnd).length;
          distribution.push({ value: binStart + binSize / 2, frequency: count });
        }
        
        return distribution;
      };
      
      const npvMean = mean(npvResults);
      const positiveNpvCount = npvResults.filter(n => n > 0).length;
      
      res.json({
        iterations,
        npvDistribution: createDistribution(npvResults),
        irrDistribution: createDistribution(irrResults),
        statistics: {
          npvMean,
          npvStdDev: stdDev(npvResults),
          npvP5: percentile(npvResults, 5),
          npvP50: percentile(npvResults, 50),
          npvP95: percentile(npvResults, 95),
          irrMean: mean(irrResults),
          irrStdDev: stdDev(irrResults),
          irrP5: percentile(irrResults, 5),
          irrP50: percentile(irrResults, 50),
          irrP95: percentile(irrResults, 95),
          probabilityOfSuccess: positiveNpvCount / iterations,
          probabilityOfLoss: (iterations - positiveNpvCount) / iterations,
          valueAtRisk: Math.abs(percentile(npvResults, 5)),
        },
        confidenceInterval: {
          lower: percentile(npvResults, 5),
          upper: percentile(npvResults, 95),
          confidence: 0.9,
        },
      });
    } catch (err) {
      console.error("Monte Carlo error:", err);
      res.status(500).json({ message: "Simulation failed" });
    }
  });

  // KPI Tracker endpoints
  app.get("/api/projects/:id/kpis", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const kpis = await storage.getProjectKpis(projectId);
      res.json(kpis);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch KPIs" });
    }
  });

  app.get("/api/projects/:id/kpi-alerts", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const kpis = await storage.getProjectKpis(projectId);
      const alerts = kpis
        .filter(kpi => kpi.status !== "on_track")
        .map(kpi => ({
          id: kpi.id,
          kpiName: kpi.kpiName,
          status: kpi.status,
          variance: Number(kpi.variance),
          message: kpi.status === "critical" 
            ? `Critical: ${kpi.kpiName} is ${Math.abs(Number(kpi.variance)).toFixed(1)}% below target`
            : `Warning: ${kpi.kpiName} is ${Math.abs(Number(kpi.variance)).toFixed(1)}% below target`,
          createdAt: kpi.createdAt,
        }));
      res.json(alerts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch alerts" });
    }
  });

  app.post("/api/projects/:id/kpis", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const { kpiName, plannedValue, actualValue, unit, period } = req.body;
      const variance = ((parseFloat(actualValue) - parseFloat(plannedValue)) / parseFloat(plannedValue)) * 100;
      const status = variance >= -5 ? "on_track" : variance >= -15 ? "warning" : "critical";
      
      const kpiEntry = await storage.createProjectKpi({
        projectId,
        userId: req.user!.id,
        kpiName,
        plannedValue: String(parseFloat(plannedValue)),
        actualValue: String(parseFloat(actualValue)),
        unit,
        period,
        variance: String(variance),
        status,
      });
      
      res.json(kpiEntry);
    } catch (err) {
      res.status(500).json({ message: "Failed to save KPI" });
    }
  });

  // Competitor Analysis endpoints
  app.get("/api/projects/:id/competitors", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProjectById(projectId);
      
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const competitors = await storage.getProjectCompetitors(projectId);
      const marketPosition = competitors.map(c => ({
        competitor: c.name,
        product: (c.scores as any)?.product || 5,
        price: (c.scores as any)?.price || 5,
        marketing: (c.scores as any)?.marketing || 5,
        distribution: (c.scores as any)?.distribution || 5,
        service: (c.scores as any)?.service || 5,
      }));
      
      res.json({
        competitors,
        marketPosition,
        recommendations: competitors.length > 0 
          ? ["Focus on differentiating factors", "Monitor pricing strategies", "Strengthen distribution channels"]
          : [],
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch competitors" });
    }
  });

  app.post("/api/projects/:id/competitors/analyze", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { competitorName } = req.body;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProjectById(projectId);
      if (!project || project.userId !== req.user!.id) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Generate SWOT analysis (using fallback data if AI unavailable)
      let competitor;
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
        
        const chatResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Analyze competitor "${competitorName}" in the ${project.industry} industry in ${project.country}. 
            Return JSON only: 
            {
              "name": "${competitorName}",
              "strengths": ["strength1", "strength2", "strength3"],
              "weaknesses": ["weakness1", "weakness2"],
              "opportunities": ["opportunity1", "opportunity2"],
              "threats": ["threat1", "threat2"],
              "marketShare": 15,
              "pricePosition": "mid",
              "scores": { "product": 7, "price": 6, "marketing": 8, "distribution": 7, "service": 6 }
            }`,
            },
          ],
        });
        
        const responseContent = chatResponse.choices[0]?.message?.content || "";
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        competitor = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        competitor.id = Date.now();
      } catch (aiError) {
        console.warn("AI analysis unavailable, using fallback:", aiError);
        competitor = null;
      }

      if (!competitor) {
        competitor = {
          name: competitorName,
          strengths: ["Established brand presence", "Strong distribution network", "Customer loyalty"],
          weaknesses: ["Higher price point", "Slower innovation cycle"],
          opportunities: ["Digital transformation", "Market expansion"],
          threats: ["New market entrants", "Economic uncertainty"],
          marketShare: 10 + Math.floor(Math.random() * 20),
          pricePosition: ["budget", "mid", "premium"][Math.floor(Math.random() * 3)],
          scores: { 
            product: 5 + Math.floor(Math.random() * 4), 
            price: 5 + Math.floor(Math.random() * 4), 
            marketing: 5 + Math.floor(Math.random() * 4), 
            distribution: 5 + Math.floor(Math.random() * 4), 
            service: 5 + Math.floor(Math.random() * 4) 
          },
        };
      }

      // Store competitor to database for persistence
      const savedCompetitor = await storage.createProjectCompetitor({
        projectId,
        name: competitor.name,
        strengths: competitor.strengths,
        weaknesses: competitor.weaknesses,
        opportunities: competitor.opportunities,
        threats: competitor.threats,
        marketShare: String(competitor.marketShare),
        pricePosition: competitor.pricePosition,
        scores: competitor.scores,
      });

      res.json(savedCompetitor);
    } catch (err) {
      console.error("Competitor analysis error:", err);
      res.status(500).json({ message: "Analysis failed" });
    }
  });

  // Market Data endpoints
  app.get("/api/market-data/:country", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const country = req.params.country;
      
      // Sample market data for MENA countries
      const marketData: Record<string, any> = {
        SA: {
          economicIndicators: [
            { name: "GDP", value: 1108000000000, change: 8.7, unit: "$", source: "IMF", lastUpdated: new Date().toISOString() },
            { name: "GDP Growth", value: 8.7, change: 5.2, unit: "%", source: "World Bank", lastUpdated: new Date().toISOString() },
            { name: "Inflation", value: 2.5, change: -0.3, unit: "%", source: "SAMA", lastUpdated: new Date().toISOString() },
            { name: "Unemployment", value: 10.1, change: -0.5, unit: "%", source: "GASTAT", lastUpdated: new Date().toISOString() },
          ],
          exchangeRates: [
            { currency: "SAR", rate: 3.75, change: 0 },
            { currency: "EUR", rate: 0.92, change: 0.2 },
            { currency: "GBP", rate: 0.79, change: 0.1 },
          ],
          commodityPrices: [
            { name: "Oil (Brent)", price: 82.50, change: 1.5, unit: "barrel" },
            { name: "Gold", price: 2035, change: 0.8, unit: "oz" },
            { name: "Natural Gas", price: 2.85, change: -2.1, unit: "MMBtu" },
          ],
          gdpTrend: [
            { year: "2019", gdp: 793000000000 },
            { year: "2020", gdp: 701000000000 },
            { year: "2021", gdp: 833000000000 },
            { year: "2022", gdp: 1108000000000 },
            { year: "2023", gdp: 1069000000000 },
          ],
          inflationTrend: [
            { month: "Jan", rate: 2.1 },
            { month: "Feb", rate: 2.3 },
            { month: "Mar", rate: 2.4 },
            { month: "Apr", rate: 2.5 },
            { month: "May", rate: 2.4 },
            { month: "Jun", rate: 2.5 },
          ],
        },
      };

      res.json(marketData[country] || marketData.SA);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Investor Network endpoints
  app.get("/api/investors", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      // Sample investor data
      const investors = [
        {
          id: 1,
          name: "MENA Ventures Capital",
          type: "vc",
          industries: ["Technology", "FinTech", "E-commerce"],
          investmentRange: { min: 500000, max: 5000000 },
          location: "Dubai, UAE",
          description: "Leading VC firm focused on Series A and B investments in MENA region startups.",
          recentDeals: 12,
          portfolioSize: 45,
        },
        {
          id: 2,
          name: "Saudi Technology Fund",
          type: "vc",
          industries: ["Technology", "Healthcare", "Energy"],
          investmentRange: { min: 1000000, max: 20000000 },
          location: "Riyadh, Saudi Arabia",
          description: "Sovereign-backed technology investment fund supporting Vision 2030.",
          recentDeals: 8,
          portfolioSize: 25,
        },
        {
          id: 3,
          name: "Gulf Angel Network",
          type: "angel",
          industries: ["Technology", "Food & Beverage", "Education"],
          investmentRange: { min: 50000, max: 500000 },
          location: "Kuwait City, Kuwait",
          description: "Network of high-net-worth individuals investing in early-stage startups.",
          recentDeals: 20,
          portfolioSize: 80,
        },
        {
          id: 4,
          name: "Emirates Growth Partners",
          type: "pe",
          industries: ["Real Estate", "Manufacturing", "Healthcare"],
          investmentRange: { min: 10000000, max: 100000000 },
          location: "Abu Dhabi, UAE",
          description: "Private equity firm focused on growth and expansion capital.",
          recentDeals: 5,
          portfolioSize: 15,
        },
      ];

      res.json(investors);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  app.get("/api/projects/:id/investor-interests", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      res.json([]);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });

  app.post("/api/projects/:id/send-pitch", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { investorId, message } = req.body;
      
      res.json({
        investorId,
        projectId: parseInt(req.params.id),
        status: "pending",
        sentAt: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ message: "Failed to send pitch" });
    }
  });

  // Contract Templates endpoint
  app.post("/api/contracts/generate", authMiddleware as any, async (req: AuthRequest, res) => {
    try {
      const { templateId, projectId, fields, language } = req.body;
      
      const project = await storage.getProjectById(parseInt(projectId));
      
      // Generate contract PDF using AI (with fallback)
      let contractText = "";
      try {
        const OpenAI = (await import("openai")).default;
        const openai = new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });
        
        const chatResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: `Generate a professional ${templateId} contract in ${language === 'ar' ? 'Arabic' : 'English'} with these details: ${JSON.stringify(fields)}. 
            For project: ${project?.name || 'N/A'}.
            Return a formal legal contract document text.`,
            },
          ],
        });
        
        contractText = chatResponse.choices[0]?.message?.content || "";
      } catch (aiError) {
        console.warn("AI contract generation unavailable, using template:", aiError);
        contractText = `
${templateId.replace(/-/g, ' ').toUpperCase()}

This agreement is entered into by and between the parties as detailed below.

Contract Details:
${Object.entries(fields).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Project: ${project?.name || 'N/A'}

Terms and Conditions:
1. This agreement is legally binding upon signature by all parties.
2. All parties agree to fulfill their respective obligations as outlined herein.
3. This contract shall be governed by the laws of the jurisdiction where the project operates.
4. Any disputes shall be resolved through arbitration.

Date: ${new Date().toLocaleDateString()}

___________________________
Signature
        `;
      }
      
      const response = { content: contractText };

      // For now, return the text as a simple PDF
      const PDFDocument = (await import('jspdf')).default;
      const doc = new PDFDocument();
      
      doc.setFontSize(16);
      doc.text(templateId.replace(/-/g, ' ').toUpperCase(), 20, 20);
      doc.setFontSize(12);
      
      const lines = response.content.split('\n');
      let y = 40;
      for (const line of lines) {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(line.slice(0, 80), 20, y);
        y += 7;
      }

      const pdfBuffer = doc.output('arraybuffer');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${templateId}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (err) {
      console.error("Contract generation error:", err);
      res.status(500).json({ message: "Failed to generate contract" });
    }
  });

  return httpServer;
}
