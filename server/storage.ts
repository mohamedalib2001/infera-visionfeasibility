import { db } from "./db";
import { 
  subscribers, users, projects, feasibilityReports, financialModels, 
  marketEstimates, riskItems, subscriptions, payments, auditLogs,
  projectKpis, projectCompetitors, investorPitches, documentIssuances, organizations,
  type InsertSubscriber, type InsertUser, type InsertProject,
  type User, type Project, type FeasibilityReport, type FinancialModel,
  type MarketEstimate, type RiskItem, type Subscription, type Organization,
  type ProjectKpi, type InsertProjectKpi, type ProjectCompetitor, type InsertProjectCompetitor,
  type InvestorPitch, type InsertInvestorPitch, type DocumentIssuance, type InsertDocumentIssuance
} from "@shared/schema";
import { eq, desc, and, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  checkDatabaseHealth(): Promise<boolean>;
  
  createSubscriber(subscriber: InsertSubscriber): Promise<void>;
  
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  permanentlyDeleteUser(id: number): Promise<void>;
  softDeleteUser(id: number): Promise<void>;
  restoreUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  getAdminStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalReports: number;
    activeSubscriptions: number;
    revenueThisMonth: number;
  }>;
  
  getAllProjects(): Promise<Project[]>;
  getAllSubscriptions(): Promise<Subscription[]>;
  
  createProject(project: InsertProject): Promise<Project>;
  getProjectById(id: number): Promise<Project | undefined>;
  getProjectsByUserId(userId: number): Promise<Project[]>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<void>;
  restoreProject(id: number): Promise<void>;
  permanentlyDeleteProject(id: number): Promise<void>;
  
  createReport(projectId: number): Promise<FeasibilityReport>;
  getReportById(id: number): Promise<FeasibilityReport | undefined>;
  getReportsByProjectId(projectId: number): Promise<FeasibilityReport[]>;
  updateReport(id: number, data: Partial<FeasibilityReport>): Promise<FeasibilityReport | undefined>;
  deleteReport(id: number): Promise<void>;
  restoreReport(id: number): Promise<void>;
  
  createFinancialModel(reportId: number, data: Partial<FinancialModel>): Promise<FinancialModel>;
  getFinancialModelByReportId(reportId: number): Promise<FinancialModel | undefined>;
  updateFinancialModel(id: number, data: Partial<FinancialModel>): Promise<FinancialModel | undefined>;
  
  createMarketEstimate(reportId: number, data: Partial<MarketEstimate>): Promise<MarketEstimate>;
  getMarketEstimateByReportId(reportId: number): Promise<MarketEstimate | undefined>;
  
  createRiskItem(reportId: number, data: Partial<RiskItem>): Promise<RiskItem>;
  getRiskItemsByReportId(reportId: number): Promise<RiskItem[]>;
  
  getSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  createSubscription(userId: number, plan: string): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
  
  createAuditLog(userId: number | null, action: string, entityType: string, entityId?: number, metadata?: any): Promise<void>;
  
  // Smart Tools - KPIs
  createProjectKpi(data: InsertProjectKpi): Promise<ProjectKpi>;
  getProjectKpis(projectId: number): Promise<ProjectKpi[]>;
  
  // Smart Tools - Competitors
  createProjectCompetitor(data: InsertProjectCompetitor): Promise<ProjectCompetitor>;
  getProjectCompetitors(projectId: number): Promise<ProjectCompetitor[]>;
  
  // Smart Tools - Investor Pitches
  createInvestorPitch(data: InsertInvestorPitch): Promise<InvestorPitch>;
  getInvestorPitchesByUser(userId: number): Promise<InvestorPitch[]>;
  updateInvestorPitch(id: number, data: Partial<InvestorPitch>): Promise<InvestorPitch | undefined>;
  
  // Document Issuance
  createDocumentIssuance(data: InsertDocumentIssuance): Promise<DocumentIssuance>;
  getDocumentIssuanceByReport(reportId: number): Promise<DocumentIssuance | undefined>;
  
  // Organizations
  getOrganizationById(id: number): Promise<Organization | undefined>;
}

export class DatabaseStorage implements IStorage {
  async checkDatabaseHealth(): Promise<boolean> {
    try {
      await db.execute(sql`SELECT 1`);
      return true;
    } catch {
      return false;
    }
  }

  async createSubscriber(subscriber: InsertSubscriber): Promise<void> {
    await db.insert(subscribers).values(subscriber);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const [user] = await db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.update(users).set({ 
      isActive: false, 
      updatedAt: new Date() 
    }).where(eq(users.id, id));
    
    await this.createAuditLog(null, 'soft_delete', 'user', id, { reason: 'user_action' });
  }

  async permanentlyDeleteUser(id: number): Promise<void> {
    const userProjects = await db.select().from(projects).where(eq(projects.userId, id));
    
    for (const project of userProjects) {
      const projectReports = await db.select().from(feasibilityReports).where(eq(feasibilityReports.projectId, project.id));
      
      for (const report of projectReports) {
        await db.delete(financialModels).where(eq(financialModels.reportId, report.id));
        await db.delete(marketEstimates).where(eq(marketEstimates.reportId, report.id));
        await db.delete(riskItems).where(eq(riskItems.reportId, report.id));
      }
      
      await db.delete(feasibilityReports).where(eq(feasibilityReports.projectId, project.id));
    }
    
    await db.delete(projects).where(eq(projects.userId, id));
    await db.delete(auditLogs).where(eq(auditLogs.userId, id));
    await db.delete(subscriptions).where(eq(subscriptions.userId, id));
    await db.delete(users).where(eq(users.id, id));
    
    await this.createAuditLog(null, 'permanent_delete', 'user', id, { reason: 'admin_action' });
  }

  async softDeleteUser(id: number): Promise<void> {
    await db.update(users).set({ 
      isActive: false, 
      updatedAt: new Date() 
    }).where(eq(users.id, id));
    
    await this.createAuditLog(null, 'soft_delete', 'user', id, { reason: 'admin_action' });
  }

  async restoreUser(id: number): Promise<void> {
    await db.update(users).set({ 
      isActive: true, 
      updatedAt: new Date() 
    }).where(eq(users.id, id));
    
    await this.createAuditLog(null, 'restore', 'user', id, { reason: 'admin_action' });
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(users.createdAt);
    
    // Sort admins first, then by creation date (oldest first)
    return allUsers.sort((a, b) => {
      if (a.role === 'admin' && b.role !== 'admin') return -1;
      if (a.role !== 'admin' && b.role === 'admin') return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalProjects: number;
    totalReports: number;
    activeSubscriptions: number;
    revenueThisMonth: number;
  }> {
    const [usersCount] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [projectsCount] = await db.select({ count: count() }).from(projects).where(eq(projects.isDeleted, false));
    const [reportsCount] = await db.select({ count: count() }).from(feasibilityReports).where(eq(feasibilityReports.isDeleted, false));
    const [activeSubsCount] = await db.select({ count: count() }).from(subscriptions).where(eq(subscriptions.status, 'active'));
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const [paymentsSum] = await db.select({ 
      total: sql<number>`COALESCE(SUM(amount), 0)` 
    }).from(payments).where(sql`created_at >= ${startOfMonth}`);
    
    return {
      totalUsers: usersCount?.count || 0,
      totalProjects: projectsCount?.count || 0,
      totalReports: reportsCount?.count || 0,
      activeSubscriptions: activeSubsCount?.count || 0,
      revenueThisMonth: (paymentsSum?.total || 0) / 100,
    };
  }

  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async getProjectById(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, id), eq(projects.isDeleted, false)));
    return project;
  }

  async getProjectsByUserId(userId: number): Promise<Project[]> {
    return await db.select().from(projects)
      .where(and(eq(projects.userId, userId), eq(projects.isDeleted, false)))
      .orderBy(desc(projects.createdAt));
  }

  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, id)).returning();
    return project;
  }

  async deleteProject(id: number): Promise<void> {
    await db.update(projects).set({ 
      isDeleted: true, 
      deletedAt: new Date(),
      updatedAt: new Date() 
    }).where(eq(projects.id, id));
    
    await this.createAuditLog(null, 'soft_delete', 'project', id, { reason: 'user_action' });
  }

  async restoreProject(id: number): Promise<void> {
    await db.update(projects).set({ 
      isDeleted: false, 
      deletedAt: null,
      updatedAt: new Date() 
    }).where(eq(projects.id, id));
    
    await this.createAuditLog(null, 'restore', 'project', id, { reason: 'admin_action' });
  }

  async permanentlyDeleteProject(id: number): Promise<void> {
    const projectReports = await db.select().from(feasibilityReports).where(eq(feasibilityReports.projectId, id));
    
    for (const report of projectReports) {
      await db.delete(financialModels).where(eq(financialModels.reportId, report.id));
      await db.delete(marketEstimates).where(eq(marketEstimates.reportId, report.id));
      await db.delete(riskItems).where(eq(riskItems.reportId, report.id));
    }
    
    await db.delete(feasibilityReports).where(eq(feasibilityReports.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
    
    await this.createAuditLog(null, 'permanent_delete', 'project', id, { reason: 'admin_action' });
  }

  async createReport(projectId: number): Promise<FeasibilityReport> {
    const existingReports = await this.getReportsByProjectId(projectId);
    const version = existingReports.length + 1;
    
    const [report] = await db.insert(feasibilityReports).values({
      projectId,
      version,
    }).returning();
    return report;
  }

  async getReportById(id: number): Promise<FeasibilityReport | undefined> {
    const [report] = await db.select().from(feasibilityReports)
      .where(and(eq(feasibilityReports.id, id), eq(feasibilityReports.isDeleted, false)));
    return report;
  }

  async getReportsByProjectId(projectId: number): Promise<FeasibilityReport[]> {
    return await db.select().from(feasibilityReports)
      .where(and(eq(feasibilityReports.projectId, projectId), eq(feasibilityReports.isDeleted, false)))
      .orderBy(desc(feasibilityReports.version));
  }

  async updateReport(id: number, data: Partial<FeasibilityReport>): Promise<FeasibilityReport | undefined> {
    const [report] = await db.update(feasibilityReports).set(data).where(eq(feasibilityReports.id, id)).returning();
    return report;
  }

  async deleteReport(id: number): Promise<void> {
    const now = new Date();
    
    await db.update(feasibilityReports).set({ 
      isDeleted: true, 
      deletedAt: now 
    }).where(eq(feasibilityReports.id, id));
    
    await db.update(financialModels).set({ 
      isDeleted: true, 
      deletedAt: now 
    }).where(eq(financialModels.reportId, id));
    
    await db.update(marketEstimates).set({ 
      isDeleted: true, 
      deletedAt: now 
    }).where(eq(marketEstimates.reportId, id));
    
    await db.update(riskItems).set({ 
      isDeleted: true, 
      deletedAt: now 
    }).where(eq(riskItems.reportId, id));
    
    await this.createAuditLog(null, 'soft_delete', 'report', id, { reason: 'user_action', cascade: true });
  }

  async restoreReport(id: number): Promise<void> {
    await db.update(feasibilityReports).set({ 
      isDeleted: false, 
      deletedAt: null 
    }).where(eq(feasibilityReports.id, id));
    
    await db.update(financialModels).set({ 
      isDeleted: false, 
      deletedAt: null 
    }).where(eq(financialModels.reportId, id));
    
    await db.update(marketEstimates).set({ 
      isDeleted: false, 
      deletedAt: null 
    }).where(eq(marketEstimates.reportId, id));
    
    await db.update(riskItems).set({ 
      isDeleted: false, 
      deletedAt: null 
    }).where(eq(riskItems.reportId, id));
    
    await this.createAuditLog(null, 'restore', 'report', id, { reason: 'admin_action', cascade: true });
  }

  async createFinancialModel(reportId: number, data: Partial<FinancialModel>): Promise<FinancialModel> {
    const [model] = await db.insert(financialModels).values({
      reportId,
      ...data,
    }).returning();
    return model;
  }

  async getFinancialModelByReportId(reportId: number): Promise<FinancialModel | undefined> {
    const [model] = await db.select().from(financialModels)
      .where(and(eq(financialModels.reportId, reportId), eq(financialModels.isDeleted, false)));
    return model;
  }

  async updateFinancialModel(id: number, data: Partial<FinancialModel>): Promise<FinancialModel | undefined> {
    const [model] = await db.update(financialModels).set(data).where(eq(financialModels.id, id)).returning();
    return model;
  }

  async createMarketEstimate(reportId: number, data: Partial<MarketEstimate>): Promise<MarketEstimate> {
    const [estimate] = await db.insert(marketEstimates).values({
      reportId,
      ...data,
    }).returning();
    return estimate;
  }

  async getMarketEstimateByReportId(reportId: number): Promise<MarketEstimate | undefined> {
    const [estimate] = await db.select().from(marketEstimates)
      .where(and(eq(marketEstimates.reportId, reportId), eq(marketEstimates.isDeleted, false)));
    return estimate;
  }

  async createRiskItem(reportId: number, data: Partial<RiskItem>): Promise<RiskItem> {
    const [risk] = await db.insert(riskItems).values({
      reportId,
      category: data.category || 'general',
      titleEn: data.titleEn || '',
      ...data,
    }).returning();
    return risk;
  }

  async getRiskItemsByReportId(reportId: number): Promise<RiskItem[]> {
    return await db.select().from(riskItems)
      .where(and(eq(riskItems.reportId, reportId), eq(riskItems.isDeleted, false)));
  }

  async getSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription;
  }

  async createSubscription(userId: number, plan: string = 'free'): Promise<Subscription> {
    const limits: Record<string, number> = {
      free: 3,
      basic: 10,
      pro: 50,
      enterprise: 999,
    };
    
    const [subscription] = await db.insert(subscriptions).values({
      userId,
      plan: plan as any,
      reportsLimit: limits[plan] || 3,
    }).returning();
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db.update(subscriptions).set({ ...data, updatedAt: new Date() }).where(eq(subscriptions.id, id)).returning();
    return subscription;
  }

  async createAuditLog(userId: number | null, action: string, entityType: string, entityId?: number, metadata?: any): Promise<void> {
    await db.insert(auditLogs).values({
      userId,
      action,
      entityType,
      entityId,
      metadata,
    });
  }

  // Smart Tools - KPIs
  async createProjectKpi(data: InsertProjectKpi): Promise<ProjectKpi> {
    const [kpi] = await db.insert(projectKpis).values(data).returning();
    return kpi;
  }

  async getProjectKpis(projectId: number): Promise<ProjectKpi[]> {
    return await db.select().from(projectKpis).where(eq(projectKpis.projectId, projectId)).orderBy(desc(projectKpis.createdAt));
  }

  // Smart Tools - Competitors
  async createProjectCompetitor(data: InsertProjectCompetitor): Promise<ProjectCompetitor> {
    const [competitor] = await db.insert(projectCompetitors).values(data).returning();
    return competitor;
  }

  async getProjectCompetitors(projectId: number): Promise<ProjectCompetitor[]> {
    return await db.select().from(projectCompetitors).where(eq(projectCompetitors.projectId, projectId)).orderBy(desc(projectCompetitors.createdAt));
  }

  // Smart Tools - Investor Pitches
  async createInvestorPitch(data: InsertInvestorPitch): Promise<InvestorPitch> {
    const [pitch] = await db.insert(investorPitches).values(data).returning();
    return pitch;
  }

  async getInvestorPitchesByUser(userId: number): Promise<InvestorPitch[]> {
    return await db.select().from(investorPitches).where(eq(investorPitches.userId, userId)).orderBy(desc(investorPitches.createdAt));
  }

  async updateInvestorPitch(id: number, data: Partial<InvestorPitch>): Promise<InvestorPitch | undefined> {
    const [pitch] = await db.update(investorPitches).set({ ...data, updatedAt: new Date() }).where(eq(investorPitches.id, id)).returning();
    return pitch;
  }

  // Document Issuance
  async createDocumentIssuance(data: InsertDocumentIssuance): Promise<DocumentIssuance> {
    const [issuance] = await db.insert(documentIssuances).values(data).returning();
    return issuance;
  }

  async getDocumentIssuanceByReport(reportId: number): Promise<DocumentIssuance | undefined> {
    const [issuance] = await db.select().from(documentIssuances).where(eq(documentIssuances.reportId, reportId));
    return issuance;
  }

  // Organizations
  async getOrganizationById(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org;
  }
}

export const storage = new DatabaseStorage();
