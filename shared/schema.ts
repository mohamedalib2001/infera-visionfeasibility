import { pgTable, text, serial, timestamp, integer, boolean, jsonb, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

export const userRoleEnum = pgEnum('user_role', ['admin', 'analyst', 'investor', 'client']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'basic', 'pro', 'enterprise']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'cancelled', 'past_due', 'trialing']);
export const projectStatusEnum = pgEnum('project_status', ['draft', 'generating', 'completed', 'archived']);
export const reportSectionTypeEnum = pgEnum('report_section_type', [
  'executive_summary',
  'project_description',
  'market_analysis',
  'location_analysis',
  'operational_model',
  'capex_analysis',
  'opex_analysis',
  'revenue_projections',
  'financial_analysis',
  'risk_analysis',
  'recommendations',
  'conclusion'
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").default('analyst').notNull(),
  organizationId: integer("organization_id"),
  avatarUrl: text("avatar_url"),
  language: text("language").default('en').notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  industry: text("industry"),
  country: text("country"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: subscriptionPlanEnum("plan").default('free').notNull(),
  status: subscriptionStatusEnum("status").default('active').notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  reportsLimit: integer("reports_limit").default(3).notNull(),
  reportsUsed: integer("reports_used").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry").notNull(),
  country: text("country").notNull(),
  currency: text("currency").default('USD').notNull(),
  status: projectStatusEnum("status").default('draft').notNull(),
  
  initialInvestment: decimal("initial_investment", { precision: 15, scale: 2 }),
  projectDuration: integer("project_duration"),
  
  inputs: jsonb("inputs").$type<ProjectInputs>(),
  
  // Client/Recipient Information (who the study is issued TO)
  clientName: text("client_name"),
  clientCompany: text("client_company"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  clientAddress: text("client_address"),
  clientType: text("client_type"), // individual, company, organization, government
  
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const feasibilityReports = pgTable("feasibility_reports", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  version: integer("version").default(1).notNull(),
  
  executiveSummaryEn: text("executive_summary_en"),
  executiveSummaryAr: text("executive_summary_ar"),
  
  projectDescriptionEn: text("project_description_en"),
  projectDescriptionAr: text("project_description_ar"),
  
  marketAnalysisEn: text("market_analysis_en"),
  marketAnalysisAr: text("market_analysis_ar"),
  
  locationAnalysisEn: text("location_analysis_en"),
  locationAnalysisAr: text("location_analysis_ar"),
  
  operationalModelEn: text("operational_model_en"),
  operationalModelAr: text("operational_model_ar"),
  
  capexAnalysisEn: text("capex_analysis_en"),
  capexAnalysisAr: text("capex_analysis_ar"),
  
  opexAnalysisEn: text("opex_analysis_en"),
  opexAnalysisAr: text("opex_analysis_ar"),
  
  revenueProjectionsEn: text("revenue_projections_en"),
  revenueProjectionsAr: text("revenue_projections_ar"),
  
  financialAnalysisEn: text("financial_analysis_en"),
  financialAnalysisAr: text("financial_analysis_ar"),
  
  riskAnalysisEn: text("risk_analysis_en"),
  riskAnalysisAr: text("risk_analysis_ar"),
  
  recommendationsEn: text("recommendations_en"),
  recommendationsAr: text("recommendations_ar"),
  
  conclusionEn: text("conclusion_en"),
  conclusionAr: text("conclusion_ar"),
  
  aiMetadata: jsonb("ai_metadata").$type<AIMetadata>(),
  
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financialModels = pgTable("financial_models", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => feasibilityReports.id),
  
  capex: decimal("capex", { precision: 15, scale: 2 }),
  opex: decimal("opex", { precision: 15, scale: 2 }),
  
  revenueProjections: jsonb("revenue_projections").$type<number[]>(),
  expenseProjections: jsonb("expense_projections").$type<number[]>(),
  cashFlows: jsonb("cash_flows").$type<number[]>(),
  
  npv: decimal("npv", { precision: 15, scale: 2 }),
  irr: decimal("irr", { precision: 8, scale: 4 }),
  roi: decimal("roi", { precision: 8, scale: 4 }),
  paybackPeriod: decimal("payback_period", { precision: 5, scale: 2 }),
  profitabilityIndex: decimal("profitability_index", { precision: 8, scale: 4 }),
  
  breakEvenPoint: decimal("break_even_point", { precision: 15, scale: 2 }),
  breakEvenUnits: integer("break_even_units"),
  
  discountRate: decimal("discount_rate", { precision: 5, scale: 4 }).default("0.10"),
  
  sensitivityAnalysis: jsonb("sensitivity_analysis").$type<SensitivityAnalysis>(),
  
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marketEstimates = pgTable("market_estimates", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => feasibilityReports.id),
  
  tam: decimal("tam", { precision: 15, scale: 2 }),
  sam: decimal("sam", { precision: 15, scale: 2 }),
  som: decimal("som", { precision: 15, scale: 2 }),
  
  marketGrowthRate: decimal("market_growth_rate", { precision: 5, scale: 4 }),
  targetMarketShare: decimal("target_market_share", { precision: 5, scale: 4 }),
  
  competitors: jsonb("competitors").$type<Competitor[]>(),
  
  assumptions: text("assumptions"),
  sources: text("sources"),
  
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const riskItems = pgTable("risk_items", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => feasibilityReports.id),
  
  category: text("category").notNull(),
  titleEn: text("title_en").notNull(),
  titleAr: text("title_ar"),
  descriptionEn: text("description_en"),
  descriptionAr: text("description_ar"),
  
  likelihood: integer("likelihood"),
  impact: integer("impact"),
  riskScore: integer("risk_score"),
  
  mitigationEn: text("mitigation_en"),
  mitigationAr: text("mitigation_ar"),
  
  isDeleted: boolean("is_deleted").default(false).notNull(),
  deletedAt: timestamp("deleted_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default('USD').notNull(),
  status: text("status").notNull(),
  
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Smart Tools Tables - Persistent Storage

export const kpiStatusEnum = pgEnum('kpi_status', ['on_track', 'warning', 'critical']);

export const projectKpis = pgTable("project_kpis", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  userId: integer("user_id").notNull().references(() => users.id),
  
  kpiName: text("kpi_name").notNull(),
  plannedValue: decimal("planned_value", { precision: 15, scale: 2 }).notNull(),
  actualValue: decimal("actual_value", { precision: 15, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  period: text("period").notNull(),
  variance: decimal("variance", { precision: 10, scale: 2 }).notNull(),
  status: kpiStatusEnum("status").default('on_track').notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectCompetitors = pgTable("project_competitors", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  
  name: text("name").notNull(),
  strengths: jsonb("strengths").$type<string[]>(),
  weaknesses: jsonb("weaknesses").$type<string[]>(),
  opportunities: jsonb("opportunities").$type<string[]>(),
  threats: jsonb("threats").$type<string[]>(),
  marketShare: decimal("market_share", { precision: 5, scale: 2 }),
  pricePosition: text("price_position"), // budget, mid, premium
  scores: jsonb("scores").$type<{ product: number; price: number; marketing: number; distribution: number; service: number }>(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const investorPitchStatusEnum = pgEnum('investor_pitch_status', ['pending', 'viewed', 'interested', 'declined']);

export const investorPitches = pgTable("investor_pitches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  projectId: integer("project_id").notNull().references(() => projects.id),
  investorId: text("investor_id").notNull(),
  
  status: investorPitchStatusEnum("status").default('pending').notNull(),
  message: text("message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document Issuance - Immutable record of who issued and received each report
export const documentIssuances = pgTable("document_issuances", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => feasibilityReports.id),
  
  // Issuer information (snapshot at time of issuance)
  issuedByUserId: integer("issued_by_user_id").notNull().references(() => users.id),
  issuedByName: text("issued_by_name").notNull(),
  issuedByEmail: text("issued_by_email").notNull(),
  issuedByOrganization: text("issued_by_organization"),
  
  // Recipient information (snapshot at time of issuance)
  issuedToName: text("issued_to_name"),
  issuedToCompany: text("issued_to_company"),
  issuedToEmail: text("issued_to_email"),
  issuedToPhone: text("issued_to_phone"),
  issuedToAddress: text("issued_to_address"),
  issuedToType: text("issued_to_type"), // individual, company, organization, government
  
  // Document metadata
  documentSerial: text("document_serial").notNull().unique(),
  version: integer("version").default(1).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
  
  // Optional hash for verification
  documentHash: text("document_hash"),
});

export const platformConfig = pgTable("platform_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").default('general').notNull(),
  isEditable: boolean("is_editable").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type PlatformConfig = typeof platformConfig.$inferSelect;
export type InsertPlatformConfig = typeof platformConfig.$inferInsert;

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  reports: many(feasibilityReports),
}));

export const reportsRelations = relations(feasibilityReports, ({ one, many }) => ({
  project: one(projects, {
    fields: [feasibilityReports.projectId],
    references: [projects.id],
  }),
  financialModel: one(financialModels, {
    fields: [feasibilityReports.id],
    references: [financialModels.reportId],
  }),
  marketEstimate: one(marketEstimates, {
    fields: [feasibilityReports.id],
    references: [marketEstimates.reportId],
  }),
  risks: many(riskItems),
}));

export interface ProjectInputs {
  productDescription?: string;
  targetCustomers?: string;
  competitiveAdvantage?: string;
  revenueStreams?: string[];
  keyResources?: string[];
  initialTeamSize?: number;
  fundingRequired?: number;
  monthlyOperatingCosts?: number;
  expectedMonthlyRevenue?: number;
  marketSize?: number;
  growthStrategy?: string;
}

export interface AIMetadata {
  model?: string;
  tokensUsed?: number;
  generatedAt?: string;
  promptVersion?: string;
}

export interface SensitivityAnalysis {
  bestCase?: {
    npv: number;
    irr: number;
    assumptions: string;
  };
  worstCase?: {
    npv: number;
    irr: number;
    assumptions: string;
  };
  baseCase?: {
    npv: number;
    irr: number;
  };
}

export interface Competitor {
  name: string;
  marketShare?: number;
  strengths?: string[];
  weaknesses?: string[];
}

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriberSchema = createInsertSchema(subscribers).pick({
  email: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

export const projectInputSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  industry: z.string().min(2),
  country: z.string().min(2),
  currency: z.string().default('USD'),
  initialInvestment: z.number().positive().optional(),
  projectDuration: z.number().int().positive().optional(),
  inputs: z.object({
    productDescription: z.string().optional(),
    targetCustomers: z.string().optional(),
    competitiveAdvantage: z.string().optional(),
    revenueStreams: z.array(z.string()).optional(),
    keyResources: z.array(z.string()).optional(),
    initialTeamSize: z.number().int().positive().optional(),
    fundingRequired: z.number().positive().optional(),
    monthlyOperatingCosts: z.number().positive().optional(),
    expectedMonthlyRevenue: z.number().positive().optional(),
    marketSize: z.number().positive().optional(),
    growthStrategy: z.string().optional(),
  }).optional(),
  // Client/Recipient Information
  clientName: z.string().optional(),
  clientCompany: z.string().optional(),
  clientEmail: z.string().email().optional().or(z.literal('')),
  clientPhone: z.string().optional(),
  clientAddress: z.string().optional(),
  clientType: z.enum(['individual', 'company', 'organization', 'government']).optional(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type FeasibilityReport = typeof feasibilityReports.$inferSelect;
export type FinancialModel = typeof financialModels.$inferSelect;
export type MarketEstimate = typeof marketEstimates.$inferSelect;
export type RiskItem = typeof riskItems.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Organization = typeof organizations.$inferSelect;

// Smart Tools Types
export type ProjectKpi = typeof projectKpis.$inferSelect;
export type InsertProjectKpi = typeof projectKpis.$inferInsert;
export type ProjectCompetitor = typeof projectCompetitors.$inferSelect;
export type InsertProjectCompetitor = typeof projectCompetitors.$inferInsert;
export type InvestorPitch = typeof investorPitches.$inferSelect;
export type InsertInvestorPitch = typeof investorPitches.$inferInsert;
export type DocumentIssuance = typeof documentIssuances.$inferSelect;
export type InsertDocumentIssuance = typeof documentIssuances.$inferInsert;
