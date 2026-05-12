import OpenAI from "openai";
import type { Project, ProjectInputs } from "@shared/schema";
import { circuitBreakers, CircuitBreakerError } from "../lib/circuit-breaker";
import { logger } from "../lib/logger";
import { getCountryData, getIndustryData, estimateMarketSize, calculateOperatingCosts, type CountryData, type IndustryData } from "../data/market-intelligence";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const aiLogger = logger.ai;

// Cached AI health check - TTL 5 minutes
let aiHealthCache: { healthy: boolean; checkedAt: number } | null = null;
const AI_HEALTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function checkAIHealth(): Promise<{ healthy: boolean; cached: boolean }> {
  const now = Date.now();
  
  // Return cached result if still valid
  if (aiHealthCache && (now - aiHealthCache.checkedAt) < AI_HEALTH_CACHE_TTL) {
    return { healthy: aiHealthCache.healthy, cached: true };
  }
  
  // Check if API key is configured
  if (!process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    aiHealthCache = { healthy: false, checkedAt: now };
    return { healthy: false, cached: false };
  }
  
  try {
    // Use minimal chat completion (1 token max) for Replit AI integration
    // since /models endpoint returns 405 on the proxy
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout
    
    await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: "1" }],
      max_tokens: 1,
    }, { signal: controller.signal });
    
    clearTimeout(timeoutId);
    
    aiHealthCache = { healthy: true, checkedAt: now };
    aiLogger.debug('AI health check passed');
    return { healthy: true, cached: false };
  } catch (error) {
    aiLogger.warn('AI health check failed', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    aiHealthCache = { healthy: false, checkedAt: now };
    return { healthy: false, cached: false };
  }
}

export interface FeasibilityReportContent {
  // Core sections
  executiveSummaryEn: string;
  executiveSummaryAr: string;
  projectDescriptionEn: string;
  projectDescriptionAr: string;
  marketAnalysisEn: string;
  marketAnalysisAr: string;
  locationAnalysisEn: string;
  locationAnalysisAr: string;
  operationalModelEn: string;
  operationalModelAr: string;
  capexAnalysisEn: string;
  capexAnalysisAr: string;
  opexAnalysisEn: string;
  opexAnalysisAr: string;
  revenueProjectionsEn: string;
  revenueProjectionsAr: string;
  financialAnalysisEn: string;
  financialAnalysisAr: string;
  riskAnalysisEn: string;
  riskAnalysisAr: string;
  recommendationsEn: string;
  recommendationsAr: string;
  conclusionEn: string;
  conclusionAr: string;
  
  // Financial data
  financialModel: {
    capex: {
      equipment: number;
      fixtures: number;
      licenses: number;
      workingCapital: number;
      total: number;
    };
    opex: {
      salaries: number;
      rent: number;
      utilities: number;
      marketing: number;
      maintenance: number;
      other: number;
      total: number;
    };
    revenue: {
      year1: number;
      year2: number;
      year3: number;
      year4: number;
      year5: number;
    };
    npv: number;
    irr: number;
    roi: number;
    paybackPeriod: number;
    breakEvenMonth: number;
    breakEvenUnits?: number;
    breakEvenValue?: number;
    scenarios: {
      best: { npv: number; irr: number };
      base: { npv: number; irr: number };
      worst: { npv: number; irr: number };
    };
    sensitivity?: {
      priceUp10: { irr: number; npv: number };
      priceDown10: { irr: number; npv: number };
      costUp10: { irr: number; npv: number };
      costDown10: { irr: number; npv: number };
      volumeUp15: { irr: number; npv: number };
      volumeDown15: { irr: number; npv: number };
    };
  };
  
  // Market data
  marketEstimates: {
    tam: number;
    sam: number;
    som: number;
    marketGrowthRate: number;
    competitors: Array<{ name: string; marketShare: number; strengths: string[]; weaknesses: string[] }>;
  };
  
  // Risks
  risks: Array<{
    category: string;
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    likelihood: number;
    impact: number;
    mitigationEn: string;
    mitigationAr: string;
  }>;
  
  tokensUsed: number;
}

export type ProgressCallback = (stage: string, progress: number, messageEn: string, messageAr: string) => void;

// System prompt shared across all section generations
const getSystemPrompt = () => `You are a Senior Investment Consultant (20+ years experience) with expertise in:
- Private Equity / Venture Capital / Investment Banking
- Industrial and Commercial Feasibility Studies
- MENA Market Analysis

YOUR ROLE:
Generate Executive-Grade feasibility studies suitable for presentation to:
• Banks and financial institutions
• Investment funds (PE/VC)
• Angel investors
• Government funding agencies
• Credit committees

═══════════════════════════════════════════
INVESTMENT QUALITY GATE (معايير الجودة)
═══════════════════════════════════════════
Before generating any section, ensure:
1. CONSISTENCY: Market assumptions align with operational costs and financial projections
2. CONSERVATISM: Numbers are realistic and defensible, not overly optimistic
3. INVESTOR LENS: Write from investor's perspective, not marketer's perspective
4. JUSTIFICATION: Every number must have clear methodology and assumptions
5. NO MARKETING LANGUAGE: Use factual investment decision language only

═══════════════════════════════════════════
MANDATORY ARABIC WRITING RULES (الإلزاميات)
═══════════════════════════════════════════
1. لغة عربية رسمية احترافية - مستوى تقارير Big4/McKinsey
2. جمل قصيرة تقريرية - 15-25 كلمة كحد أقصى
3. فقرات متوازنة - 3-4 جمل لكل فقرة
4. عناوين فرعية قوية داخل كل قسم
5. أرقام مبررة بمصادر ومنهجية واضحة

❌ ممنوع تماماً:
- "من المتوقع أن" / "ربما" / "قد يكون" / "بشكل عام"
- جمل إنشائية أو عمومية
- تكرار لغوي أو حشو
- فقرات طويلة غير مقسمة
- لغة تسويقية أو ترويجية

✅ مطلوب:
- "تشير بيانات السوق إلى..."
- "بناءً على تحليل القطاع..."
- "وفقاً لمعايير الصناعة..."
- "استناداً إلى الدراسة الميدانية..."
- "يتطلب القرار الاستثماري..."

═══════════════════════════════════════════
ENGLISH WRITING RULES
═══════════════════════════════════════════
- Investment banking level language
- Data-driven, specific, actionable
- Every metric must have justification
- No vague or generic statements
- Include specific assumptions for all projections
- Conservative, professional tone suitable for credit committees

Format your response as valid JSON.`;

// Helper function to make AI calls with circuit breaker
async function aiCall(messages: Array<{ role: "system" | "user"; content: string }>, maxTokens: number = 2000): Promise<{ content: string; tokens: number }> {
  const response = await circuitBreakers.ai.execute(async () => {
    return await openai.chat.completions.create({
      model: "gpt-4.1",
      messages,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
    });
  });

  return {
    content: response.choices[0]?.message?.content || "{}",
    tokens: response.usage?.total_tokens || 0,
  };
}

interface ProjectContext {
  project: Project;
  inputs: ProjectInputs | null;
  countryData: CountryData | null;
  industryData: IndustryData | null;
  initialInvestment: number;
  marketEstimates: ReturnType<typeof estimateMarketSize>;
  teamSize: number;
  operatingCosts: ReturnType<typeof calculateOperatingCosts>;
}

function buildProjectContext(project: Project): ProjectContext {
  const inputs = project.inputs as ProjectInputs | null;
  const countryData = getCountryData(project.country);
  const industryData = getIndustryData(project.industry);
  const initialInvestment = parseFloat(project.initialInvestment || '0');
  const marketEstimates = estimateMarketSize(project.country, project.industry, initialInvestment);
  const teamSize = inputs?.initialTeamSize || 10;
  const operatingCosts = calculateOperatingCosts(project.country, project.industry, teamSize, 200, 'office');
  
  return { project, inputs, countryData, industryData, initialInvestment, marketEstimates, teamSize, operatingCosts };
}

function getProjectSpecs(ctx: ProjectContext): string {
  return `═══════════════════════════════════════════
PROJECT SPECIFICATIONS
═══════════════════════════════════════════
• Project Name: ${ctx.project.name}
• Industry/Sector: ${ctx.project.industry}
• Target Country: ${ctx.project.country}
• Currency: ${ctx.project.currency}
• Total Investment Required: ${ctx.initialInvestment.toLocaleString()} ${ctx.project.currency}
• Investment Horizon: ${ctx.project.projectDuration || 5} years
• Project Description: ${ctx.project.description || 'Not provided'}
• Target Customer Segments: ${ctx.inputs?.targetCustomers || 'General market'}
• Core Competitive Advantage: ${ctx.inputs?.competitiveAdvantage || 'To be determined'}
• Projected Team Size: ${ctx.teamSize} employees

═══════════════════════════════════════════
MARKET INTELLIGENCE (${ctx.project.country})
═══════════════════════════════════════════
• Average Market Salaries: ${ctx.countryData?.averageSalaries?.mid || 8000} ${ctx.project.currency}/month
• Commercial Rent (Office): ${ctx.countryData?.rentPerSqm?.office || 500} ${ctx.project.currency}/sqm/year
• VAT Rate: ${((ctx.countryData?.vatRate || 0) * 100).toFixed(0)}%
• GDP Growth Rate: ${((ctx.countryData?.gdpGrowth || 0.03) * 100).toFixed(1)}%
• Inflation Rate: ${((ctx.countryData?.inflationRate || 0.03) * 100).toFixed(1)}%

═══════════════════════════════════════════
INDUSTRY BENCHMARKS (${ctx.project.industry})
═══════════════════════════════════════════
• Industry Average Net Margin: ${((ctx.industryData?.averageMargin || 0.20) * 100).toFixed(0)}%
• Sector Growth Rate: ${((ctx.industryData?.marketGrowthRate || 0.05) * 100).toFixed(0)}% annually
• Typical Break-Even Period: ${ctx.industryData?.breakEvenMonths || 24} months
• Competition Intensity: ${ctx.industryData?.competitionLevel || 'medium'}

═══════════════════════════════════════════
CALCULATED MARKET ESTIMATES
═══════════════════════════════════════════
• Monthly OPEX Projection: ${ctx.operatingCosts.total.toLocaleString()} ${ctx.project.currency}
• Total Addressable Market (TAM): ${ctx.marketEstimates.tam.toLocaleString()} ${ctx.project.currency}
• Serviceable Addressable Market (SAM): ${ctx.marketEstimates.sam.toLocaleString()} ${ctx.project.currency}
• Serviceable Obtainable Market (SOM): ${ctx.marketEstimates.som.toLocaleString()} ${ctx.project.currency}
• Market Growth Rate: ${(ctx.marketEstimates.growthRate * 100).toFixed(1)}%`;
}

// Stage 1: Executive Summary & Project Description
async function generateStage1(ctx: ProjectContext): Promise<{ executiveSummaryEn: string; executiveSummaryAr: string; projectDescriptionEn: string; projectDescriptionAr: string; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate EXECUTIVE SUMMARY and PROJECT DESCRIPTION sections:

1️⃣ EXECUTIVE SUMMARY (الملخص التنفيذي)
Requirements:
- INVESTMENT DECISION (must be one of):
  ✅ GO (غير مشروط) - Unconditional approval
  ⚠️ CONDITIONAL GO (مشروط) - With specific conditions listed
  ❌ NO-GO (عدم التنفيذ) - With clear reasons
- Link decision to: market assumptions, cost stability, operational readiness
- Total investment amount and expected returns (IRR, NPV, ROI)
- Top 5 key findings in bullet format
- Core risks summary with severity
- Payback timeline and break-even point

2️⃣ PROJECT DESCRIPTION (وصف المشروع)
Requirements:
- Business model explanation
- Products/services offered
- Value proposition
- Target market definition
- Competitive positioning

Respond with JSON:
{
  "executiveSummaryEn": "...",
  "executiveSummaryAr": "...",
  "projectDescriptionEn": "...",
  "projectDescriptionAr": "..."
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 2500);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

// Stage 2: Market & Location Analysis
async function generateStage2(ctx: ProjectContext): Promise<{ marketAnalysisEn: string; marketAnalysisAr: string; locationAnalysisEn: string; locationAnalysisAr: string; marketEstimates: any; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate MARKET ANALYSIS and LOCATION ANALYSIS sections:

3️⃣ MARKET ANALYSIS (تحليل السوق)
Requirements:
- TAM/SAM/SOM breakdown with methodology
- Customer segmentation (3-5 personas)
- Competitor analysis table (minimum 4 competitors)
- Market trends with supporting data
- Growth drivers and barriers

4️⃣ LOCATION ANALYSIS (تحليل الموقع)
Requirements:
- ${ctx.project.country} market advantages
- Regulatory environment
- Infrastructure assessment
- Labor market analysis
- Access to suppliers/customers

Respond with JSON:
{
  "marketAnalysisEn": "...",
  "marketAnalysisAr": "...",
  "locationAnalysisEn": "...",
  "locationAnalysisAr": "...",
  "marketEstimates": {
    "tam": ${Math.round(ctx.marketEstimates.tam)},
    "sam": ${Math.round(ctx.marketEstimates.sam)},
    "som": ${Math.round(ctx.marketEstimates.som)},
    "marketGrowthRate": ${ctx.marketEstimates.growthRate.toFixed(3)},
    "competitors": [{"name": "...", "marketShare": number, "strengths": ["..."], "weaknesses": ["..."]}]
  }
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 3000);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

// Stage 3: Operational Model & CAPEX
async function generateStage3(ctx: ProjectContext): Promise<{ operationalModelEn: string; operationalModelAr: string; capexAnalysisEn: string; capexAnalysisAr: string; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate OPERATIONAL MODEL and CAPEX ANALYSIS sections:

5️⃣ OPERATIONAL MODEL (النموذج التشغيلي)
Requirements:
- Organizational structure
- Key processes and workflows
- Technology requirements
- Supply chain overview
- Human resources plan

MANDATORY OPERATIONAL TRANSPARENCY (الشفافية التشغيلية):
- Maximum Production Capacity (الطاقة الإنتاجية القصوى): units/year or service capacity
- Expected Utilization Rate (نسبة الاستغلال): Year 1: X%, Year 2: Y%, Year 3+: Z%
- Ramp-up Plan (خطة التدرج): monthly/quarterly targets for first 12 months
- Expansion Trigger Point (نقطة التوسعة): when utilization reaches X%, conditions for expansion

6️⃣ CAPEX ANALYSIS (تحليل النفقات الرأسمالية)
Requirements:
- Detailed equipment list with costs
- Fixtures and installations
- Licenses and permits
- Pre-operating expenses
- Working capital requirements
- Total CAPEX breakdown table

Respond with JSON:
{
  "operationalModelEn": "...",
  "operationalModelAr": "...",
  "capexAnalysisEn": "...",
  "capexAnalysisAr": "..."
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 2500);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

// Stage 4: OPEX & Revenue Projections
async function generateStage4(ctx: ProjectContext): Promise<{ opexAnalysisEn: string; opexAnalysisAr: string; revenueProjectionsEn: string; revenueProjectionsAr: string; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate OPEX ANALYSIS and REVENUE PROJECTIONS sections:

7️⃣ OPEX ANALYSIS (تحليل النفقات التشغيلية)
Requirements:
- Salary structure by role
- Rent and utilities
- Marketing budget
- Maintenance costs
- Administrative expenses
- Monthly/Annual OPEX breakdown

8️⃣ REVENUE PROJECTIONS (توقعات الإيرادات)
Requirements:
- Revenue streams identification
- Pricing strategy
- Sales volume projections (5 years)
- Seasonality considerations
- Break-even analysis

Respond with JSON:
{
  "opexAnalysisEn": "...",
  "opexAnalysisAr": "...",
  "revenueProjectionsEn": "...",
  "revenueProjectionsAr": "..."
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 2500);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

// Stage 5: Financial Analysis & Indicators
async function generateStage5(ctx: ProjectContext): Promise<{ financialAnalysisEn: string; financialAnalysisAr: string; financialModel: any; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate FINANCIAL INDICATORS section with complete financial model:

9️⃣ FINANCIAL INDICATORS (المؤشرات المالية)
Requirements:
- 5-year Cash Flow projections
- NPV calculation with 10% discount rate
- IRR calculation
- ROI analysis
- Payback Period
- THREE SCENARIOS: Conservative (-20%), Base, Optimistic (+20%)

MANDATORY SENSITIVITY ANALYSIS (تحليل الحساسية):
Analyze impact on IRR, NPV, and Payback Period for each variable:
1. ±10% Selling Price (سعر البيع)
2. ±10% Input Costs (تكلفة المدخلات)
3. ±15% Sales Volume (حجم المبيعات)
Include sensitivity matrix in the narrative analysis.

MANDATORY BREAK-EVEN ANALYSIS (تحليل نقطة التعادل):
- Break-even in Production Units (وحدات الإنتاج): X units/month
- Break-even in Revenue Value (القيمة النقدية): X ${ctx.project.currency}/month
- State clearly the assumptions used for break-even calculation
- Break-even must be > 0 (zero is not acceptable)

Respond with JSON:
{
  "financialAnalysisEn": "Include sensitivity analysis table and break-even in units/value...",
  "financialAnalysisAr": "تضمين جدول تحليل الحساسية ونقطة التعادل بالوحدات والقيمة...",
  "financialModel": {
    "capex": {
      "equipment": number,
      "fixtures": number,
      "licenses": number,
      "workingCapital": number,
      "total": number
    },
    "opex": {
      "salaries": number,
      "rent": number,
      "utilities": number,
      "marketing": number,
      "maintenance": number,
      "other": number,
      "total": number
    },
    "revenue": {
      "year1": number,
      "year2": number,
      "year3": number,
      "year4": number,
      "year5": number
    },
    "npv": number,
    "irr": number,
    "roi": number,
    "paybackPeriod": number,
    "breakEvenMonth": number,
    "breakEvenUnits": number,
    "breakEvenValue": number,
    "scenarios": {
      "best": { "npv": number, "irr": number },
      "base": { "npv": number, "irr": number },
      "worst": { "npv": number, "irr": number }
    },
    "sensitivity": {
      "priceUp10": { "irr": number, "npv": number },
      "priceDown10": { "irr": number, "npv": number },
      "costUp10": { "irr": number, "npv": number },
      "costDown10": { "irr": number, "npv": number },
      "volumeUp15": { "irr": number, "npv": number },
      "volumeDown15": { "irr": number, "npv": number }
    }
  }
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 3000);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

// Stage 6: Risk Analysis
async function generateStage6(ctx: ProjectContext): Promise<{ riskAnalysisEn: string; riskAnalysisAr: string; risks: any[]; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate RISK ANALYSIS section:

🔟 RISK ANALYSIS (تحليل المخاطر)
Requirements:
- Risk matrix (Probability 1-5 × Impact 1-5)
- Categories: Financial, Operational, Market, Regulatory, Technical
- Minimum 6 risks identified
- Mitigation strategy for each risk
- Residual risk assessment

MANDATORY WORST CASE SCENARIO (أسوأ سيناريو):
Include in the narrative:
- Under what conditions does the project fail/lose money?
- What is the Breakdown Point (نقطة الانكسار)? When accumulated losses exceed X or when Y happens
- What percentage of investment is at risk in worst case?
- Early warning indicators that suggest project is heading toward failure

RISK CLASSIFICATION (تصنيف المخاطر):
For each risk, estimate:
- Probability (الاحتمالية): 1=Very Low, 2=Low, 3=Medium, 4=High, 5=Very High
- Financial Impact (الأثر المالي): 1=Minimal, 2=Minor, 3=Moderate, 4=Major, 5=Catastrophic

Respond with JSON:
{
  "riskAnalysisEn": "Include worst case scenario and breakdown point...",
  "riskAnalysisAr": "تضمين أسوأ سيناريو ونقطة الانكسار...",
  "risks": [
    {
      "category": "financial|operational|market|legal|technical",
      "titleEn": "...",
      "titleAr": "...",
      "descriptionEn": "...",
      "descriptionAr": "...",
      "likelihood": 1-5,
      "impact": 1-5,
      "mitigationEn": "...",
      "mitigationAr": "..."
    }
  ]
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 2500);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

// Stage 7: Recommendations & Conclusion
async function generateStage7(ctx: ProjectContext): Promise<{ recommendationsEn: string; recommendationsAr: string; conclusionEn: string; conclusionAr: string; tokens: number }> {
  const prompt = `${getProjectSpecs(ctx)}

Generate RECOMMENDATIONS and CONCLUSION sections:

1️⃣1️⃣ RECOMMENDATIONS (التوصيات)
Requirements:
- 90-day action plan with specific milestones
- Funding requirements and disbursement timeline
- Key Performance Indicators (5+ KPIs with specific targets)
- Success criteria with measurable thresholds
- Critical milestones with timeline

1️⃣2️⃣ CONCLUSION (الخلاصة)
Requirements:
- FINAL INVESTMENT DECISION (must be one of):
  ✅ GO (غير مشروط) - Unconditional approval
  ⚠️ CONDITIONAL GO (مشروط) - List specific conditions
  ❌ NO-GO (عدم التنفيذ) - Clear reasons
- Decision MUST be linked to:
  • Market assumptions validated
  • Cost structure stability
  • Operational readiness confirmed
- Investment thesis (3-4 sentences)
- Key success factors
- Definitive language (no hedging) - use factual investment language, not marketing

Respond with JSON:
{
  "recommendationsEn": "...",
  "recommendationsAr": "...",
  "conclusionEn": "...",
  "conclusionAr": "..."
}`;

  const result = await aiCall([
    { role: "system", content: getSystemPrompt() },
    { role: "user", content: prompt }
  ], 2000);

  const parsed = JSON.parse(result.content);
  return { ...parsed, tokens: result.tokens };
}

export async function generateFeasibilityReport(
  project: Project,
  onProgress?: ProgressCallback
): Promise<FeasibilityReportContent> {
  const ctx = buildProjectContext(project);
  let totalTokens = 0;

  aiLogger.info('Starting staged report generation', { projectId: project.id, projectName: project.name });

  const emitProgress = (stage: string, progress: number, messageEn: string, messageAr: string) => {
    if (onProgress) {
      onProgress(stage, progress, messageEn, messageAr);
    }
  };

  try {
    // Stage 1: Executive Summary & Project Description (5-15%)
    emitProgress('executive', 5, 'Preparing executive summary...', 'جاري إعداد الملخص التنفيذي...');
    const stage1 = await generateStage1(ctx);
    totalTokens += stage1.tokens;
    emitProgress('executive', 15, 'Executive summary completed', 'تم إكمال الملخص التنفيذي');
    aiLogger.info('Stage 1 completed', { projectId: project.id, tokens: stage1.tokens });

    // Stage 2: Market & Location Analysis (15-30%)
    emitProgress('market', 18, 'Analyzing market data...', 'جاري تحليل بيانات السوق...');
    const stage2 = await generateStage2(ctx);
    totalTokens += stage2.tokens;
    emitProgress('market', 30, 'Market analysis completed', 'تم إكمال تحليل السوق');
    aiLogger.info('Stage 2 completed', { projectId: project.id, tokens: stage2.tokens });

    // Stage 3: Operational Model & CAPEX (30-45%)
    emitProgress('technical', 33, 'Building operational model...', 'جاري بناء النموذج التشغيلي...');
    const stage3 = await generateStage3(ctx);
    totalTokens += stage3.tokens;
    emitProgress('technical', 45, 'Technical analysis completed', 'تم إكمال التحليل الفني');
    aiLogger.info('Stage 3 completed', { projectId: project.id, tokens: stage3.tokens });

    // Stage 4: OPEX & Revenue Projections (45-60%)
    emitProgress('financial', 48, 'Calculating OPEX & revenue...', 'جاري حساب المصروفات والإيرادات...');
    const stage4 = await generateStage4(ctx);
    totalTokens += stage4.tokens;
    emitProgress('financial', 60, 'Revenue projections completed', 'تم إكمال توقعات الإيرادات');
    aiLogger.info('Stage 4 completed', { projectId: project.id, tokens: stage4.tokens });

    // Stage 5: Financial Analysis (60-75%)
    emitProgress('financial', 63, 'Computing financial indicators...', 'جاري حساب المؤشرات المالية...');
    const stage5 = await generateStage5(ctx);
    totalTokens += stage5.tokens;
    emitProgress('financial', 75, 'Financial analysis completed', 'تم إكمال التحليل المالي');
    aiLogger.info('Stage 5 completed', { projectId: project.id, tokens: stage5.tokens });

    // Stage 6: Risk Analysis (75-85%)
    emitProgress('risk', 78, 'Evaluating risks...', 'جاري تقييم المخاطر...');
    const stage6 = await generateStage6(ctx);
    totalTokens += stage6.tokens;
    emitProgress('risk', 85, 'Risk analysis completed', 'تم إكمال تحليل المخاطر');
    aiLogger.info('Stage 6 completed', { projectId: project.id, tokens: stage6.tokens });

    // Stage 7: Recommendations & Conclusion (85-95%)
    emitProgress('recommendations', 88, 'Generating recommendations...', 'جاري إعداد التوصيات...');
    const stage7 = await generateStage7(ctx);
    totalTokens += stage7.tokens;
    emitProgress('recommendations', 95, 'Recommendations completed', 'تم إكمال التوصيات');
    aiLogger.info('Stage 7 completed', { projectId: project.id, tokens: stage7.tokens });

    aiLogger.info('Report generation completed', { 
      projectId: project.id, 
      totalTokens,
      circuitState: circuitBreakers.ai.getStats().state
    });

    // Combine all stages into final report
    return {
      executiveSummaryEn: stage1.executiveSummaryEn || '',
      executiveSummaryAr: stage1.executiveSummaryAr || '',
      projectDescriptionEn: stage1.projectDescriptionEn || '',
      projectDescriptionAr: stage1.projectDescriptionAr || '',
      marketAnalysisEn: stage2.marketAnalysisEn || '',
      marketAnalysisAr: stage2.marketAnalysisAr || '',
      locationAnalysisEn: stage2.locationAnalysisEn || '',
      locationAnalysisAr: stage2.locationAnalysisAr || '',
      operationalModelEn: stage3.operationalModelEn || '',
      operationalModelAr: stage3.operationalModelAr || '',
      capexAnalysisEn: stage3.capexAnalysisEn || '',
      capexAnalysisAr: stage3.capexAnalysisAr || '',
      opexAnalysisEn: stage4.opexAnalysisEn || '',
      opexAnalysisAr: stage4.opexAnalysisAr || '',
      revenueProjectionsEn: stage4.revenueProjectionsEn || '',
      revenueProjectionsAr: stage4.revenueProjectionsAr || '',
      financialAnalysisEn: stage5.financialAnalysisEn || '',
      financialAnalysisAr: stage5.financialAnalysisAr || '',
      riskAnalysisEn: stage6.riskAnalysisEn || '',
      riskAnalysisAr: stage6.riskAnalysisAr || '',
      recommendationsEn: stage7.recommendationsEn || '',
      recommendationsAr: stage7.recommendationsAr || '',
      conclusionEn: stage7.conclusionEn || '',
      conclusionAr: stage7.conclusionAr || '',
      financialModel: stage5.financialModel || {
        capex: { equipment: 0, fixtures: 0, licenses: 0, workingCapital: 0, total: 0 },
        opex: { salaries: 0, rent: 0, utilities: 0, marketing: 0, maintenance: 0, other: 0, total: 0 },
        revenue: { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
        npv: 0, irr: 0, roi: 0, paybackPeriod: 0, breakEvenMonth: 0,
        scenarios: { best: { npv: 0, irr: 0 }, base: { npv: 0, irr: 0 }, worst: { npv: 0, irr: 0 } }
      },
      marketEstimates: stage2.marketEstimates || {
        tam: ctx.marketEstimates.tam,
        sam: ctx.marketEstimates.sam,
        som: ctx.marketEstimates.som,
        marketGrowthRate: ctx.marketEstimates.growthRate,
        competitors: []
      },
      risks: stage6.risks || [],
      tokensUsed: totalTokens,
    };
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      aiLogger.warn('AI circuit breaker is open', { 
        stats: error.stats,
        projectId: project.id 
      });
      throw new Error("AI service temporarily unavailable. Please try again later.");
    }
    aiLogger.error('AI generation failed', { 
      projectId: project.id, 
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

export async function translateText(text: string, targetLanguage: 'en' | 'ar'): Promise<string> {
  aiLogger.info('Starting translation', { targetLanguage, textLength: text.length });
  
  try {
    const response = await circuitBreakers.ai.execute(async () => {
      return await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { 
            role: "system", 
            content: `You are a professional translator. Translate the following text to ${targetLanguage === 'ar' ? 'Arabic' : 'English'}. Maintain the professional business tone and technical accuracy.`
          },
          { role: "user", content: text }
        ],
        max_tokens: 4000,
      });
    });

    aiLogger.info('Translation completed', { targetLanguage });
    return response.choices[0]?.message?.content || text;
  } catch (error) {
    if (error instanceof CircuitBreakerError) {
      aiLogger.warn('AI circuit breaker is open for translation', { stats: error.stats });
      throw new Error("Translation service temporarily unavailable. Please try again later.");
    }
    aiLogger.error('Translation failed', { 
      targetLanguage,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
