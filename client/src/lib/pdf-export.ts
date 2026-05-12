import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { FeasibilityReport, FinancialModel, MarketEstimate, RiskItem, Project } from "@shared/schema";
import coverImage from "@assets/stock_images/professional_busines_f2c439b9.jpg";
import financialImage from "@assets/stock_images/financial_analysis_b_fc35dc71.jpg";
import riskImage from "@assets/stock_images/risk_management_busi_205507b0.jpg";

async function loadImageAsBase64(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = imageSrc;
  });
}

const imageCache: { [key: string]: string } = {};

async function getImageBase64(imageSrc: string): Promise<string> {
  if (imageCache[imageSrc]) {
    return imageCache[imageSrc];
  }
  try {
    const base64 = await loadImageAsBase64(imageSrc);
    imageCache[imageSrc] = base64;
    return base64;
  } catch (error) {
    console.warn("Failed to load image:", error);
    return "";
  }
}

interface ReportData {
  report: FeasibilityReport;
  project: Project;
  financialModel: FinancialModel | null;
  marketEstimate: MarketEstimate | null;
  risks: RiskItem[];
}

const sanitizeFilename = (name: string): string => {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || 'Report';
};

const escapeHtml = (text: string | undefined | null): string => {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

interface PrintableReportData {
  project: {
    name: string;
    industry: string;
    country: string;
    city?: string | null;
    currency: string;
    initialInvestment?: string | null;
    projectDuration: number | null;
    // Client/Recipient fields
    clientName?: string | null;
    clientCompany?: string | null;
    clientEmail?: string | null;
    clientPhone?: string | null;
    clientAddress?: string | null;
    clientType?: string | null;
  };
  // Issuer (subscriber) information
  issuer?: {
    name?: string | null;
    email?: string | null;
    organization?: string | null;
  } | null;
  report: {
    version: number;
    executiveSummaryAr?: string | null;
    projectDescriptionAr?: string | null;
    marketAnalysisAr?: string | null;
    locationAnalysisAr?: string | null;
    operationalModelAr?: string | null;
    capexAnalysisAr?: string | null;
    opexAnalysisAr?: string | null;
    revenueProjectionsAr?: string | null;
    financialAnalysisAr?: string | null;
    riskAnalysisAr?: string | null;
    recommendationsAr?: string | null;
    conclusionAr?: string | null;
  };
  financialModel?: {
    npv?: string | null;
    irr?: string | null;
    roi?: string | null;
    paybackPeriod?: string | null;
    breakEvenPoint?: string | null;
    cashFlows?: number[] | null;
    capex?: string | null;
    opex?: string | null;
    sensitivityAnalysis?: {
      bestCase?: { npv: number; irr: number } | null;
      worstCase?: { npv: number; irr: number } | null;
    } | null;
  } | null;
  marketEstimate?: {
    tam?: string | null;
    sam?: string | null;
    som?: string | null;
    marketGrowthRate?: string | null;
  } | null;
  risks?: Array<{
    titleAr?: string | null;
    descriptionAr?: string | null;
    mitigationAr?: string | null;
    likelihood?: number | null;
    impact?: number | null;
    riskScore?: number | null;
    category?: string | null;
  }>;
}

const SECTION_CONFIG = [
  { id: 'cover', title: 'صفحة الغلاف' },
  { id: 'toc', title: 'فهرس المحتويات' },
  { id: 'executiveSummary', title: 'الملخص التنفيذي', sectionNum: 1 },
  { id: 'marketAnalysis', title: 'تحليل السوق', sectionNum: 2 },
  { id: 'technicalAnalysis', title: 'التحليل الفني والتشغيلي', sectionNum: 3 },
  { id: 'financialAnalysis', title: 'التحليل المالي', sectionNum: 4 },
  { id: 'riskAnalysis', title: 'تحليل المخاطر', sectionNum: 5 },
  { id: 'recommendations', title: 'التوصيات النهائية', sectionNum: 6 },
  { id: 'conclusion', title: 'الخلاصة', sectionNum: 7 },
];

const PAGE_CONFIG = {
  width: 794,
  height: 1123,
  padding: 60,
  headerHeight: 50,
  footerHeight: 50,
  get contentHeight() {
    return this.height - this.padding * 2 - this.headerHeight - this.footerHeight;
  }
};

interface SectionPageInfo {
  sectionId: string;
  title: string;
  startPage: number;
  pageCount: number;
}

function splitOversizedBlock(block: string, maxHeight: number, measureContainer: HTMLDivElement): string[] {
  measureContainer.innerHTML = block;
  if (measureContainer.scrollHeight <= maxHeight) {
    return [block];
  }
  
  if (block.includes('<table')) {
    const tableMatch = block.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (tableMatch) {
      const headerMatch = block.match(/<thead>([\s\S]*?)<\/thead>/i);
      const rowMatches = block.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
      const bodyRows = rowMatches.filter(r => !r.includes('<th'));
      
      if (bodyRows.length > 4) {
        const splitTables: string[] = [];
        const tableStyle = block.match(/<table[^>]*style="([^"]*)"[^>]*>/i)?.[1] || STYLES.table;
        const header = headerMatch?.[0] || '';
        
        for (let i = 0; i < bodyRows.length; i += 6) {
          const chunk = bodyRows.slice(i, i + 6);
          splitTables.push(`<table style="${tableStyle}">${header}<tbody>${chunk.join('')}</tbody></table>`);
        }
        return splitTables;
      }
    }
  }
  
  if (block.includes('display: grid') || block.includes('display:grid')) {
    const childMatches = block.match(/<div style="[^"]*">[^<]*<\/div>/gi) || [];
    if (childMatches.length > 4) {
      const splitGrids: string[] = [];
      for (let i = 0; i < childMatches.length; i += 4) {
        const chunk = childMatches.slice(i, i + 4);
        splitGrids.push(`<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">${chunk.join('')}</div>`);
      }
      return splitGrids;
    }
  }
  
  return [block];
}

function paginateHtmlBlocks(blocks: string[], maxContentHeight: number): string[][] {
  const chunks: string[][] = [];
  let currentChunk: string[] = [];
  
  const measureContainer = document.createElement('div');
  measureContainer.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: ${PAGE_CONFIG.width - PAGE_CONFIG.padding * 2}px;
    font-family: 'Cairo', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', 'Arial', 'Tahoma', sans-serif;
    direction: rtl;
    text-align: right;
    line-height: 1.9;
    visibility: hidden;
  `;
  document.body.appendChild(measureContainer);
  
  const processedBlocks: string[] = [];
  for (const block of blocks) {
    const splitBlocks = splitOversizedBlock(block, maxContentHeight, measureContainer);
    processedBlocks.push(...splitBlocks);
  }
  
  for (const block of processedBlocks) {
    measureContainer.innerHTML = block;
    const blockHeight = measureContainer.scrollHeight;
    
    if (blockHeight > maxContentHeight) {
      if (currentChunk.length > 0) {
        chunks.push([...currentChunk]);
        currentChunk = [];
      }
      chunks.push([block]);
      continue;
    }
    
    measureContainer.innerHTML = currentChunk.join('') + block;
    const currentHeight = measureContainer.scrollHeight;
    
    if (currentHeight > maxContentHeight && currentChunk.length > 0) {
      chunks.push([...currentChunk]);
      currentChunk = [block];
    } else {
      currentChunk.push(block);
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  document.body.removeChild(measureContainer);
  return chunks.length > 0 ? chunks : [[]];
}

function splitLongTextByTokens(text: string, maxChars: number = 500): string[] {
  if (text.length <= maxChars) return [text];
  
  const sentences = text.split(/(?<=[.؟!。।])\s+/);
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

function textToHtmlBlocks(text: string): string[] {
  if (!text) return [];
  const lines = text.split('\n').filter(line => line.trim());
  const blocks: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^[-•*]\s*/, '');
      blocks.push(`<div style="${STYLES.bulletPoint}"><div style="${STYLES.bullet}"></div><div style="flex: 1;">${escapeHtml(content)}</div></div>`);
    } else {
      const chunks = splitLongTextByTokens(trimmed, 600);
      for (const chunk of chunks) {
        blocks.push(`<p style="${STYLES.paragraph}">${escapeHtml(chunk)}</p>`);
      }
    }
  }
  
  return blocks;
}

function createPaginatedSection(
  data: PrintableReportData,
  sectionNum: number,
  sectionTitle: string,
  contentHtml: string,
  startPageNum: number,
  totalPages: number
): HTMLDivElement[] {
  const headerHtml = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">${sectionNum}</span>${sectionTitle}</h2>`;
  const headerBlock = [headerHtml];
  
  const contentBlocks = contentHtml.split(/<\/(?:p|div)>/i)
    .filter(b => b.trim())
    .map(b => b + (b.includes('<p') ? '</p>' : b.includes('<div') ? '</div>' : ''));
  
  const allBlocks = [...headerBlock, ...contentBlocks];
  const maxHeight = PAGE_CONFIG.contentHeight;
  const chunks = paginateHtmlBlocks(allBlocks, maxHeight);
  
  const pages: HTMLDivElement[] = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, data.project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          ${sectionTitle} (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

const STYLES = {
  container: `
    width: 794px;
    height: 1123px;
    max-height: 1123px;
    padding: 60px;
    background: white;
    color: #1a1a1a;
    font-family: 'Cairo', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', 'Arial', 'Tahoma', sans-serif;
    direction: rtl;
    text-align: right;
    line-height: 1.9;
    box-sizing: border-box;
    overflow: hidden;
    unicode-bidi: bidi-override;
  `,
  pageHeader: `
    position: absolute;
    top: 20px;
    right: 60px;
    left: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
    font-size: 10px;
    color: #666;
  `,
  pageFooter: `
    position: absolute;
    bottom: 25px;
    right: 60px;
    left: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 10px;
    border-top: 1px solid #e0e0e0;
    font-size: 9px;
    color: #888;
  `,
  sectionTitle: `
    color: #1a365d;
    border-bottom: 3px solid #2c5282;
    padding-bottom: 15px;
    margin-bottom: 25px;
    font-size: 22px;
    font-weight: bold;
    display: flex;
    align-items: center;
    gap: 12px;
  `,
  paragraph: `
    line-height: 2;
    text-align: justify;
    margin-bottom: 12px;
    font-size: 12px;
    color: #2d3748;
    white-space: pre-wrap;
    word-wrap: break-word;
  `,
  card: `
    padding: 20px;
    background: #f8fafc;
    border-radius: 10px;
    border-right: 5px solid #2c5282;
    margin-bottom: 20px;
  `,
  table: `
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 12px;
  `,
  tableHeader: `
    background: #1a365d;
    color: white;
    padding: 14px;
    text-align: right;
    font-weight: bold;
  `,
  tableCell: `
    padding: 12px 14px;
    border-bottom: 1px solid #e2e8f0;
    text-align: right;
  `,
  metricBox: `
    background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    border: 1px solid #9ae6b4;
  `,
  riskCard: `
    margin-bottom: 20px;
    padding: 20px;
    background: #fffbeb;
    border-radius: 10px;
    border-right: 5px solid #d69e2e;
  `,
  bulletPoint: `
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 12px;
    padding-right: 10px;
  `,
  bullet: `
    width: 8px;
    height: 8px;
    background: #2c5282;
    border-radius: 50%;
    margin-top: 8px;
    flex-shrink: 0;
  `,
};

function formatCurrency(value: number | string, currency: string = "SAR"): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatCompactNumber(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  } else if (absValue >= 1000) {
    return (value / 1000).toFixed(0) + 'K';
  }
  return value.toFixed(0);
}

function createCashFlowChartSvg(cashFlows: number[], width: number = 600, height: number = 180): string {
  if (!cashFlows || cashFlows.length === 0) return '';
  
  const padding = { top: 20, right: 30, bottom: 40, left: 70 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxVal = Math.max(...cashFlows.map(v => Math.abs(v)));
  const minVal = Math.min(0, Math.min(...cashFlows));
  const range = Math.max(maxVal, Math.abs(minVal)) * 1.1;
  
  const barWidth = Math.min(40, (chartWidth / cashFlows.length) * 0.7);
  const barGap = (chartWidth - barWidth * cashFlows.length) / (cashFlows.length + 1);
  
  const zeroY = padding.top + chartHeight / 2;
  
  let bars = '';
  let labels = '';
  
  cashFlows.forEach((cf, i) => {
    const x = padding.left + barGap + i * (barWidth + barGap);
    const barHeight = (Math.abs(cf) / range) * (chartHeight / 2);
    const y = cf >= 0 ? zeroY - barHeight : zeroY;
    const color = cf >= 0 ? '#38a169' : '#c53030';
    
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="3"/>`;
    
    const labelY = cf >= 0 ? y - 8 : y + barHeight + 14;
    labels += `<text x="${x + barWidth/2}" y="${labelY}" text-anchor="middle" font-size="9" fill="#4a5568" font-family="Cairo, sans-serif">${formatCompactNumber(cf)}</text>`;
    
    const yearLabel = i === 0 ? 'استثمار' : `سنة ${i}`;
    labels += `<text x="${x + barWidth/2}" y="${height - 8}" text-anchor="middle" font-size="9" fill="#718096" font-family="Cairo, sans-serif">${yearLabel}</text>`;
  });
  
  return `
    <div style="background: #f8fafc; border-radius: 10px; padding: 15px; margin: 15px 0;">
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; margin: 0 auto;">
        <line x1="${padding.left}" y1="${zeroY}" x2="${width - padding.right}" y2="${zeroY}" stroke="#cbd5e0" stroke-width="1"/>
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#e2e8f0" stroke-width="1"/>
        ${bars}
        ${labels}
        <text x="${padding.left - 10}" y="${zeroY + 4}" text-anchor="end" font-size="10" fill="#718096" font-family="Cairo, sans-serif">0</text>
      </svg>
    </div>
  `;
}

function createScenarioChartSvg(scenarios: {name: string; npv: number; irr: number}[], width: number = 550, height: number = 160): string {
  if (!scenarios || scenarios.length === 0) return '';
  
  const padding = { top: 30, right: 20, bottom: 45, left: 20 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxNpv = Math.max(...scenarios.map(s => Math.abs(s.npv)));
  const barWidth = Math.min(80, chartWidth / scenarios.length * 0.6);
  const barGap = (chartWidth - barWidth * scenarios.length) / (scenarios.length + 1);
  
  let bars = '';
  let labels = '';
  
  const colors = ['#38a169', '#3182ce', '#c53030'];
  
  scenarios.forEach((s, i) => {
    const x = padding.left + barGap + i * (barWidth + barGap);
    const barHeight = maxNpv > 0 ? (Math.abs(s.npv) / maxNpv) * chartHeight * 0.7 : 0;
    const y = padding.top + chartHeight - barHeight;
    
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${colors[i]}" rx="4"/>`;
    bars += `<text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" font-size="11" fill="${colors[i]}" font-weight="bold" font-family="Cairo, sans-serif">${formatCompactNumber(s.npv)}</text>`;
    
    labels += `<text x="${x + barWidth/2}" y="${height - 25}" text-anchor="middle" font-size="11" fill="#2d3748" font-weight="bold" font-family="Cairo, sans-serif">${s.name}</text>`;
    labels += `<text x="${x + barWidth/2}" y="${height - 10}" text-anchor="middle" font-size="10" fill="#718096" font-family="Cairo, sans-serif">IRR: ${s.irr.toFixed(1)}%</text>`;
  });
  
  return `
    <div style="background: #f8fafc; border-radius: 10px; padding: 15px; margin: 15px 0;">
      <p style="text-align: center; font-size: 12px; color: #2d3748; margin: 0 0 10px; font-weight: bold;">مقارنة السيناريوهات - صافي القيمة الحالية (NPV)</p>
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="display: block; margin: 0 auto;">
        <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="#e2e8f0" stroke-width="1"/>
        ${bars}
        ${labels}
      </svg>
    </div>
  `;
}

function formatParagraphWithBullets(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n').filter(line => line.trim());
  let html = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
      const content = trimmed.replace(/^[-•*]\s*/, '');
      html += `
        <div style="${STYLES.bulletPoint}">
          <div style="${STYLES.bullet}"></div>
          <div style="flex: 1;">${escapeHtml(content)}</div>
        </div>
      `;
    } else if (trimmed) {
      html += `<p style="${STYLES.paragraph}">${escapeHtml(trimmed)}</p>`;
    }
  }
  
  return html;
}

function createPageContainer(pageNumber: number, totalPages: number, projectName: string, includeHeaderFooter: boolean = true): { container: HTMLDivElement; content: HTMLDivElement } {
  const container = document.createElement('div');
  container.style.cssText = STYLES.container;
  container.style.position = 'relative';
  
  if (includeHeaderFooter && pageNumber > 1) {
    const header = document.createElement('div');
    header.style.cssText = STYLES.pageHeader;
    header.innerHTML = `
      <span style="font-weight: bold; color: #1a365d;">INFERA Vision</span>
      <span>${escapeHtml(projectName)} - دراسة الجدوى الاقتصادية</span>
    `;
    container.appendChild(header);
  }
  
  const content = document.createElement('div');
  content.style.cssText = `
    margin-top: ${pageNumber > 1 ? '40px' : '0'};
    margin-bottom: 40px;
  `;
  container.appendChild(content);
  
  if (includeHeaderFooter) {
    const footer = document.createElement('div');
    footer.style.cssText = STYLES.pageFooter;
    footer.innerHTML = `
      <span>INFERA Vision - منصة دراسات الجدوى الذكية</span>
      <span>صفحة ${pageNumber} من ${totalPages}</span>
    `;
    container.appendChild(footer);
  }
  
  return { container, content };
}

async function createCoverPage(data: PrintableReportData): Promise<HTMLDivElement> {
  const { project, report } = data;
  const container = document.createElement('div');
  container.style.cssText = STYLES.container;
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  
  const currentDate = new Date().toLocaleDateString("ar-SA", { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const coverImageBase64 = await getImageBase64(coverImage);
  
  container.innerHTML = `
    <!-- Background image with overlay -->
    <div style="
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 320px;
      background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
      ${coverImageBase64 ? `background-image: url('${coverImageBase64}'); background-size: cover; background-position: center;` : ''}
      z-index: 0;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(180deg, rgba(26, 54, 93, 0.85) 0%, rgba(44, 82, 130, 0.9) 100%);
      "></div>
    </div>
    
    <!-- Content overlay -->
    <div style="
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
      padding: 50px 60px 40px;
      height: 100%;
    ">
      <!-- Logo and branding in hero section -->
      <div style="margin-bottom: 30px;">
        <div style="
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 15px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
        ">
          <span style="color: #1a365d; font-size: 28px; font-weight: bold;">IV</span>
        </div>
        <h1 style="
          font-size: 16px;
          color: white;
          letter-spacing: 6px;
          text-transform: uppercase;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">INFERA VISION</h1>
      </div>
      
      <!-- Project title card -->
      <div style="
        background: white;
        color: #1a365d;
        padding: 40px 50px;
        border-radius: 16px;
        width: 100%;
        max-width: 580px;
        box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
        margin-bottom: 30px;
        margin-top: 40px;
      ">
        <p style="
          font-size: 14px;
          color: #4299e1;
          margin: 0 0 10px 0;
          font-weight: 600;
          letter-spacing: 2px;
        ">دراسة الجدوى الاقتصادية</p>
        <h2 style="
          font-size: 28px;
          margin: 0 0 15px 0;
          font-weight: bold;
          line-height: 1.4;
          color: #1a365d;
        ">${escapeHtml(project.name)}</h2>
        <div style="
          width: 60px;
          height: 4px;
          background: linear-gradient(90deg, #4299e1, #3182ce);
          margin: 0 auto;
          border-radius: 2px;
        "></div>
      </div>
      
      <!-- Project details grid -->
      <div style="
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        width: 100%;
        max-width: 480px;
        margin-bottom: 25px;
      ">
        <div style="
          background: #f7fafc;
          padding: 18px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        ">
          <p style="color: #718096; font-size: 11px; margin: 0 0 4px 0;">القطاع</p>
          <p style="color: #1a365d; font-size: 14px; font-weight: bold; margin: 0;">${escapeHtml(project.industry)}</p>
        </div>
        <div style="
          background: #f7fafc;
          padding: 18px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        ">
          <p style="color: #718096; font-size: 11px; margin: 0 0 4px 0;">الموقع</p>
          <p style="color: #1a365d; font-size: 14px; font-weight: bold; margin: 0;">${escapeHtml(project.city || '')}${project.city ? '، ' : ''}${escapeHtml(project.country)}</p>
        </div>
        <div style="
          background: #f7fafc;
          padding: 18px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        ">
          <p style="color: #718096; font-size: 11px; margin: 0 0 4px 0;">مدة المشروع</p>
          <p style="color: #1a365d; font-size: 14px; font-weight: bold; margin: 0;">${project.projectDuration} سنوات</p>
        </div>
        <div style="
          background: #f7fafc;
          padding: 18px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        ">
          <p style="color: #718096; font-size: 11px; margin: 0 0 4px 0;">الإصدار</p>
          <p style="color: #1a365d; font-size: 14px; font-weight: bold; margin: 0;">v${report.version}.0</p>
        </div>
      </div>
    
    <div style="
      color: #718096;
      font-size: 14px;
    ">
      <p style="margin: 0 0 5px 0;">تاريخ الإصدار</p>
      <p style="margin: 0; font-weight: bold; color: #4a5568;">${currentDate}</p>
    </div>
    
    <!-- Issuer and Recipient Information -->
    ${(data.issuer?.name || data.issuer?.organization || project.clientName || project.clientCompany) ? `
    <div style="
      display: flex;
      justify-content: space-around;
      gap: 30px;
      width: 100%;
      max-width: 560px;
      margin-top: 20px;
      margin-bottom: 15px;
    ">
      ${data.issuer?.name || data.issuer?.organization ? `
      <div style="
        flex: 1;
        background: #f0f9ff;
        padding: 15px 20px;
        border-radius: 10px;
        border: 1px solid #bfdbfe;
        text-align: center;
      ">
        <p style="color: #3b82f6; font-size: 10px; margin: 0 0 6px 0; font-weight: 600; letter-spacing: 1px;">صادر من</p>
        <p style="color: #1e40af; font-size: 13px; font-weight: bold; margin: 0;">${escapeHtml(data.issuer?.name || '')}</p>
        ${data.issuer?.organization ? `<p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">${escapeHtml(data.issuer.organization)}</p>` : ''}
      </div>
      ` : ''}
      ${project.clientName || project.clientCompany ? `
      <div style="
        flex: 1;
        background: #f0fdf4;
        padding: 15px 20px;
        border-radius: 10px;
        border: 1px solid #bbf7d0;
        text-align: center;
      ">
        <p style="color: #22c55e; font-size: 10px; margin: 0 0 6px 0; font-weight: 600; letter-spacing: 1px;">مُقدم إلى</p>
        <p style="color: #15803d; font-size: 13px; font-weight: bold; margin: 0;">${escapeHtml(project.clientName || '')}</p>
        ${project.clientCompany ? `<p style="color: #64748b; font-size: 11px; margin: 4px 0 0 0;">${escapeHtml(project.clientCompany)}</p>` : ''}
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <div style="
      position: absolute;
      bottom: 40px;
      left: 60px;
      right: 60px;
      text-align: center;
      color: #a0aec0;
      font-size: 10px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    ">
      <p style="margin: 0;">هذا التقرير تم إعداده بواسطة منصة INFERA Vision للذكاء الاصطناعي</p>
      <p style="margin: 5px 0 0 0;">جميع الحقوق محفوظة © ${new Date().getFullYear()}</p>
    </div>
  `;
  
  return container;
}

function createTableOfContents(data: PrintableReportData, totalPages: number, sectionPages?: SectionPageInfo[]): HTMLDivElement {
  const container = document.createElement('div');
  container.style.cssText = STYLES.container;
  
  const defaultSections = [
    { num: '1', title: 'الملخص التنفيذي', page: 3 },
    { num: '2', title: 'تحليل السوق', page: 4 },
    { num: '3', title: 'التحليل الفني والتشغيلي', page: 5 },
    { num: '4', title: 'التحليل المالي', page: 6 },
    { num: '5', title: 'تحليل المخاطر', page: 7 },
    { num: '6', title: 'التوصيات النهائية', page: 8 },
    { num: '7', title: 'الخلاصة والتوصية الاستثمارية', page: 9 },
  ];
  
  const sections = sectionPages ? sectionPages
    .filter(s => s.sectionId !== 'cover' && s.sectionId !== 'toc')
    .map((s, i) => ({
      num: String(i + 1),
      title: s.title,
      page: s.startPage,
    })) : defaultSections;
  
  container.innerHTML = `
    <div style="margin-top: 60px;">
      <h1 style="
        font-size: 28px;
        color: #1a365d;
        text-align: center;
        margin-bottom: 50px;
        padding-bottom: 20px;
        border-bottom: 3px solid #2c5282;
      ">فهرس المحتويات</h1>
      
      <div style="max-width: 500px; margin: 0 auto;">
        ${sections.map(section => `
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 0;
            border-bottom: 1px dashed #cbd5e0;
          ">
            <div style="display: flex; align-items: center; gap: 15px;">
              <span style="
                width: 32px;
                height: 32px;
                background: #1a365d;
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 14px;
              ">${section.num}</span>
              <span style="font-size: 16px; color: #2d3748; font-weight: 500;">${section.title}</span>
            </div>
            <span style="
              font-size: 14px;
              color: #718096;
              font-weight: bold;
            ">${section.page}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div style="
      position: absolute;
      bottom: 60px;
      left: 60px;
      right: 60px;
      text-align: center;
    ">
      <div style="
        background: #f0fff4;
        border: 1px solid #9ae6b4;
        border-radius: 12px;
        padding: 20px;
      ">
        <p style="color: #276749; font-size: 14px; margin: 0;">
          إجمالي صفحات التقرير: <strong>${totalPages}</strong> صفحة
        </p>
      </div>
    </div>
    
    <div style="
      position: absolute;
      bottom: 25px;
      right: 60px;
      left: 60px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid #e0e0e0;
      font-size: 9px;
      color: #888;
    ">
      <span>INFERA Vision - منصة دراسات الجدوى الذكية</span>
      <span>صفحة 2 من ${totalPages}</span>
    </div>
  `;
  
  return container;
}

function createExecutiveSummaryPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const { project, report, financialModel } = data;
  const { container, content } = createPageContainer(pageNum, totalPages, project.name);
  
  const npv = parseFloat(financialModel?.npv || "0");
  const irr = parseFloat(financialModel?.irr || "0");
  const isPositive = npv > 0 && irr > 10;
  
  content.innerHTML = `
    <h2 style="${STYLES.sectionTitle}">
      <span style="font-size: 24px;">1</span>
      الملخص التنفيذي
    </h2>
    
    <div style="
      background: ${isPositive ? 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)' : 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)'};
      border: 2px solid ${isPositive ? '#38a169' : '#e53e3e'};
      border-radius: 15px;
      padding: 25px;
      margin-bottom: 30px;
      text-align: center;
    ">
      <p style="
        font-size: 18px;
        font-weight: bold;
        color: ${isPositive ? '#276749' : '#c53030'};
        margin: 0;
      ">
        القرار الاستثماري: ${isPositive ? '[موصى به] يُنصح بالاستثمار (GO)' : '[تحذير] يتطلب مراجعة إضافية'}
      </p>
    </div>
    
    ${report.executiveSummaryAr ? `
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.executiveSummaryAr)}
      </div>
    ` : ''}
    
    <h3 style="color: #2c5282; font-size: 18px; margin: 30px 0 20px;">أبرز المؤشرات المالية</h3>
    
    <div style="
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    ">
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 12px; margin: 0 0 8px 0;">صافي القيمة الحالية (NPV)</p>
        <p style="color: #276749; font-size: 24px; font-weight: bold; margin: 0;">
          ${formatCurrency(npv, project.currency)}
        </p>
      </div>
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 12px; margin: 0 0 8px 0;">معدل العائد الداخلي (IRR)</p>
        <p style="color: #276749; font-size: 24px; font-weight: bold; margin: 0;">
          ${irr.toFixed(1)}%
        </p>
      </div>
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 12px; margin: 0 0 8px 0;">العائد على الاستثمار (ROI)</p>
        <p style="color: #276749; font-size: 24px; font-weight: bold; margin: 0;">
          ${parseFloat(financialModel?.roi || "0").toFixed(1)}%
        </p>
      </div>
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 12px; margin: 0 0 8px 0;">فترة الاسترداد</p>
        <p style="color: #276749; font-size: 24px; font-weight: bold; margin: 0;">
          ${parseFloat(financialModel?.paybackPeriod || "0").toFixed(1)} سنوات
        </p>
      </div>
    </div>
  `;
  
  return container;
}

function createExecutiveSummaryPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report, financialModel } = data;
  const pages: HTMLDivElement[] = [];
  
  const npv = parseFloat(financialModel?.npv || "0");
  const irr = parseFloat(financialModel?.irr || "0");
  const isPositive = npv > 0 && irr > 10;
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">1</span>الملخص التنفيذي</h2>`;
  
  const decisionBox = `
    <div style="
      background: ${isPositive ? 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)' : 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)'};
      border: 2px solid ${isPositive ? '#38a169' : '#e53e3e'};
      border-radius: 15px;
      padding: 20px;
      margin-bottom: 25px;
      text-align: center;
    ">
      <p style="font-size: 16px; font-weight: bold; color: ${isPositive ? '#276749' : '#c53030'}; margin: 0;">
        القرار الاستثماري: ${isPositive ? '[موصى به] يُنصح بالاستثمار (GO)' : '[تحذير] يتطلب مراجعة إضافية'}
      </p>
    </div>
  `;
  
  const metricsGrid = `
    <h3 style="color: #2c5282; font-size: 16px; margin: 25px 0 15px;">أبرز المؤشرات المالية</h3>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 11px; margin: 0 0 6px 0;">صافي القيمة الحالية (NPV)</p>
        <p style="color: #276749; font-size: 20px; font-weight: bold; margin: 0;">${formatCurrency(npv, project.currency)}</p>
      </div>
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 11px; margin: 0 0 6px 0;">معدل العائد الداخلي (IRR)</p>
        <p style="color: #276749; font-size: 20px; font-weight: bold; margin: 0;">${irr.toFixed(1)}%</p>
      </div>
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 11px; margin: 0 0 6px 0;">العائد على الاستثمار (ROI)</p>
        <p style="color: #276749; font-size: 20px; font-weight: bold; margin: 0;">${parseFloat(financialModel?.roi || "0").toFixed(1)}%</p>
      </div>
      <div style="${STYLES.metricBox}">
        <p style="color: #718096; font-size: 11px; margin: 0 0 6px 0;">فترة الاسترداد</p>
        <p style="color: #276749; font-size: 20px; font-weight: bold; margin: 0;">${parseFloat(financialModel?.paybackPeriod || "0").toFixed(1)} سنوات</p>
      </div>
    </div>
  `;
  
  const summaryBlocks = textToHtmlBlocks(report.executiveSummaryAr || '');
  const allBlocks = [headerBlock, decisionBox, ...summaryBlocks, metricsGrid];
  
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          الملخص التنفيذي (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

function createMarketAnalysisPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const { project, report, marketEstimate } = data;
  const { container, content } = createPageContainer(pageNum, totalPages, project.name);
  
  content.innerHTML = `
    <h2 style="${STYLES.sectionTitle}">
      <span style="font-size: 24px;">2</span>
      تحليل السوق
    </h2>
    
    ${report.marketAnalysisAr ? `
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.marketAnalysisAr)}
      </div>
    ` : ''}
    
    ${marketEstimate ? `
      <h3 style="color: #2c5282; font-size: 18px; margin: 30px 0 20px;">تقديرات حجم السوق (TAM/SAM/SOM)</h3>
      
      <table style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.tableHeader}">المؤشر</th>
            <th style="${STYLES.tableHeader}">الوصف</th>
            <th style="${STYLES.tableHeader}; text-align: left;">القيمة</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="${STYLES.tableCell}; font-weight: bold; background: #ebf8ff;">TAM</td>
            <td style="${STYLES.tableCell}">السوق الكلي المتاح</td>
            <td style="${STYLES.tableCell}; text-align: left; color: #2c5282; font-weight: bold; font-size: 14px;">
              ${formatCurrency(marketEstimate.tam || "0", project.currency)}
            </td>
          </tr>
          <tr>
            <td style="${STYLES.tableCell}; font-weight: bold; background: #e6fffa;">SAM</td>
            <td style="${STYLES.tableCell}">السوق القابل للخدمة</td>
            <td style="${STYLES.tableCell}; text-align: left; color: #285e61; font-weight: bold; font-size: 14px;">
              ${formatCurrency(marketEstimate.sam || "0", project.currency)}
            </td>
          </tr>
          <tr>
            <td style="${STYLES.tableCell}; font-weight: bold; background: #f0fff4;">SOM</td>
            <td style="${STYLES.tableCell}">الحصة السوقية المستهدفة</td>
            <td style="${STYLES.tableCell}; text-align: left; color: #276749; font-weight: bold; font-size: 14px;">
              ${formatCurrency(marketEstimate.som || "0", project.currency)}
            </td>
          </tr>
          ${marketEstimate.marketGrowthRate ? `
          <tr>
            <td style="${STYLES.tableCell}; font-weight: bold; background: #faf5ff;">النمو</td>
            <td style="${STYLES.tableCell}">معدل نمو السوق السنوي</td>
            <td style="${STYLES.tableCell}; text-align: left; color: #553c9a; font-weight: bold; font-size: 14px;">
              ${(parseFloat(marketEstimate.marketGrowthRate) * 100).toFixed(1)}%
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>
    ` : ''}
  `;
  
  return container;
}

function createMarketAnalysisPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report, marketEstimate } = data;
  const pages: HTMLDivElement[] = [];
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">2</span>تحليل السوق</h2>`;
  const marketBlocks = report.marketAnalysisAr ? textToHtmlBlocks(report.marketAnalysisAr) : [];
  
  const marketTable = marketEstimate ? `
    <h3 style="color: #2c5282; font-size: 18px; margin: 30px 0 20px;">تقديرات حجم السوق (TAM/SAM/SOM)</h3>
    <table style="${STYLES.table}">
      <thead>
        <tr>
          <th style="${STYLES.tableHeader}">المؤشر</th>
          <th style="${STYLES.tableHeader}">الوصف</th>
          <th style="${STYLES.tableHeader}; text-align: left;">القيمة</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="${STYLES.tableCell}; font-weight: bold; background: #ebf8ff;">TAM</td>
          <td style="${STYLES.tableCell}">السوق الكلي المتاح</td>
          <td style="${STYLES.tableCell}; text-align: left; color: #2c5282; font-weight: bold; font-size: 14px;">
            ${formatCurrency(marketEstimate.tam || "0", project.currency)}
          </td>
        </tr>
        <tr>
          <td style="${STYLES.tableCell}; font-weight: bold; background: #e6fffa;">SAM</td>
          <td style="${STYLES.tableCell}">السوق القابل للخدمة</td>
          <td style="${STYLES.tableCell}; text-align: left; color: #285e61; font-weight: bold; font-size: 14px;">
            ${formatCurrency(marketEstimate.sam || "0", project.currency)}
          </td>
        </tr>
        <tr>
          <td style="${STYLES.tableCell}; font-weight: bold; background: #f0fff4;">SOM</td>
          <td style="${STYLES.tableCell}">الحصة السوقية المستهدفة</td>
          <td style="${STYLES.tableCell}; text-align: left; color: #276749; font-weight: bold; font-size: 14px;">
            ${formatCurrency(marketEstimate.som || "0", project.currency)}
          </td>
        </tr>
        ${marketEstimate.marketGrowthRate ? `
        <tr>
          <td style="${STYLES.tableCell}; font-weight: bold; background: #faf5ff;">النمو</td>
          <td style="${STYLES.tableCell}">معدل نمو السوق السنوي</td>
          <td style="${STYLES.tableCell}; text-align: left; color: #553c9a; font-weight: bold; font-size: 14px;">
            ${(parseFloat(marketEstimate.marketGrowthRate) * 100).toFixed(1)}%
          </td>
        </tr>
        ` : ''}
      </tbody>
    </table>
  ` : '';
  
  const allBlocks = [headerBlock, ...marketBlocks, marketTable].filter(Boolean);
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          تحليل السوق (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

function createTechnicalAnalysisPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const { project, report } = data;
  const { container, content } = createPageContainer(pageNum, totalPages, project.name);
  
  content.innerHTML = `
    <h2 style="${STYLES.sectionTitle}">
      <span style="font-size: 24px;">3</span>
      التحليل الفني والتشغيلي
    </h2>
    
    ${report.locationAnalysisAr ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.1 تحليل الموقع</h3>
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.locationAnalysisAr)}
      </div>
    ` : ''}
    
    ${report.operationalModelAr ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.2 النموذج التشغيلي</h3>
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.operationalModelAr)}
      </div>
    ` : ''}
    
    ${report.projectDescriptionAr ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.3 وصف المشروع</h3>
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.projectDescriptionAr)}
      </div>
    ` : ''}
  `;
  
  return container;
}

function createTechnicalAnalysisPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report } = data;
  const pages: HTMLDivElement[] = [];
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">3</span>التحليل الفني والتشغيلي</h2>`;
  
  const allBlocks: string[] = [headerBlock];
  
  if (report.locationAnalysisAr) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.1 تحليل الموقع</h3>`);
    allBlocks.push(...textToHtmlBlocks(report.locationAnalysisAr));
  }
  
  if (report.operationalModelAr) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.2 النموذج التشغيلي</h3>`);
    allBlocks.push(...textToHtmlBlocks(report.operationalModelAr));
  }
  
  if (report.projectDescriptionAr) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.3 وصف المشروع</h3>`);
    allBlocks.push(...textToHtmlBlocks(report.projectDescriptionAr));
  }
  
  if (report.revenueProjectionsAr) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">3.4 توقعات الإيرادات</h3>`);
    allBlocks.push(...textToHtmlBlocks(report.revenueProjectionsAr));
  }
  
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          التحليل الفني والتشغيلي (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

function createFinancialAnalysisPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const { project, report, financialModel } = data;
  const { container, content } = createPageContainer(pageNum, totalPages, project.name);
  
  content.innerHTML = `
    <h2 style="${STYLES.sectionTitle}">
      <span style="font-size: 24px;">4</span>
      التحليل المالي
    </h2>
    
    ${report.capexAnalysisAr ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.1 التكاليف الرأسمالية (CAPEX)</h3>
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.capexAnalysisAr)}
      </div>
    ` : ''}
    
    ${report.opexAnalysisAr ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.2 التكاليف التشغيلية (OPEX)</h3>
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.opexAnalysisAr)}
      </div>
    ` : ''}
    
    ${financialModel?.cashFlows && financialModel.cashFlows.length > 0 ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.3 التدفقات النقدية المتوقعة</h3>
      <table style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.tableHeader}">الفترة</th>
            <th style="${STYLES.tableHeader}; text-align: left;">التدفق النقدي</th>
          </tr>
        </thead>
        <tbody>
          ${financialModel.cashFlows.slice(0, 8).map((cf, i) => {
            const isNeg = cf < 0;
            return `
              <tr>
                <td style="${STYLES.tableCell}; font-weight: bold;">
                  ${i === 0 ? 'الاستثمار الأولي' : `السنة ${i}`}
                </td>
                <td style="${STYLES.tableCell}; text-align: left; color: ${isNeg ? '#c53030' : '#276749'}; font-weight: bold;">
                  ${formatCurrency(cf, project.currency)}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    ` : ''}
    
    ${financialModel?.sensitivityAnalysis ? `
      <h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.4 تحليل السيناريوهات</h3>
      <table style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.tableHeader}">السيناريو</th>
            <th style="${STYLES.tableHeader}; text-align: center;">NPV</th>
            <th style="${STYLES.tableHeader}; text-align: center;">IRR</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f0fff4;">
            <td style="${STYLES.tableCell}; font-weight: bold;">أفضل سيناريو</td>
            <td style="${STYLES.tableCell}; text-align: center; color: #276749; font-weight: bold;">
              ${formatCurrency(financialModel.sensitivityAnalysis.bestCase?.npv || 0, project.currency)}
            </td>
            <td style="${STYLES.tableCell}; text-align: center; color: #276749; font-weight: bold;">
              ${(financialModel.sensitivityAnalysis.bestCase?.irr || 0).toFixed(1)}%
            </td>
          </tr>
          <tr style="background: #f7fafc;">
            <td style="${STYLES.tableCell}; font-weight: bold;">السيناريو الأساسي</td>
            <td style="${STYLES.tableCell}; text-align: center; font-weight: bold;">
              ${formatCurrency(financialModel.npv || "0", project.currency)}
            </td>
            <td style="${STYLES.tableCell}; text-align: center; font-weight: bold;">
              ${parseFloat(financialModel.irr || "0").toFixed(1)}%
            </td>
          </tr>
          <tr style="background: #fff5f5;">
            <td style="${STYLES.tableCell}; font-weight: bold;">أسوأ سيناريو</td>
            <td style="${STYLES.tableCell}; text-align: center; color: #c53030; font-weight: bold;">
              ${formatCurrency(financialModel.sensitivityAnalysis.worstCase?.npv || 0, project.currency)}
            </td>
            <td style="${STYLES.tableCell}; text-align: center; color: #c53030; font-weight: bold;">
              ${(financialModel.sensitivityAnalysis.worstCase?.irr || 0).toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    ` : ''}
  `;
  
  return container;
}

function createFinancialAnalysisPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report, financialModel } = data;
  const pages: HTMLDivElement[] = [];
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">4</span>التحليل المالي</h2>`;
  const allBlocks: string[] = [headerBlock];
  
  if (report.capexAnalysisAr) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.1 التكاليف الرأسمالية (CAPEX)</h3>`);
    allBlocks.push(...textToHtmlBlocks(report.capexAnalysisAr));
  }
  
  if (report.opexAnalysisAr) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.2 التكاليف التشغيلية (OPEX)</h3>`);
    allBlocks.push(...textToHtmlBlocks(report.opexAnalysisAr));
  }
  
  if (financialModel?.cashFlows && financialModel.cashFlows.length > 0) {
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.3 التدفقات النقدية المتوقعة</h3>`);
    
    const chartHtml = createCashFlowChartSvg(financialModel.cashFlows, 580, 180);
    if (chartHtml) {
      allBlocks.push(chartHtml);
    }
    
    const rowsPerTable = 8;
    for (let chunkStart = 0; chunkStart < financialModel.cashFlows.length; chunkStart += rowsPerTable) {
      const chunkFlows = financialModel.cashFlows.slice(chunkStart, chunkStart + rowsPerTable);
      const tableBlock = `
        <table style="${STYLES.table}">
          <thead>
            <tr>
              <th style="${STYLES.tableHeader}">الفترة</th>
              <th style="${STYLES.tableHeader}; text-align: left;">التدفق النقدي</th>
            </tr>
          </thead>
          <tbody>
            ${chunkFlows.map((cf, i) => {
              const actualIndex = chunkStart + i;
              const isNeg = cf < 0;
              return `
                <tr>
                  <td style="${STYLES.tableCell}; font-weight: bold;">
                    ${actualIndex === 0 ? 'الاستثمار الأولي' : `السنة ${actualIndex}`}
                  </td>
                  <td style="${STYLES.tableCell}; text-align: left; color: ${isNeg ? '#c53030' : '#276749'}; font-weight: bold;">
                    ${formatCurrency(cf, project.currency)}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      `;
      allBlocks.push(tableBlock);
    }
  }
  
  if (financialModel?.sensitivityAnalysis) {
    const scenarios = [
      { name: 'أفضل سيناريو', npv: financialModel.sensitivityAnalysis.bestCase?.npv || 0, irr: financialModel.sensitivityAnalysis.bestCase?.irr || 0 },
      { name: 'السيناريو الأساسي', npv: parseFloat(financialModel.npv || "0"), irr: parseFloat(financialModel.irr || "0") },
      { name: 'أسوأ سيناريو', npv: financialModel.sensitivityAnalysis.worstCase?.npv || 0, irr: financialModel.sensitivityAnalysis.worstCase?.irr || 0 },
    ];
    
    allBlocks.push(`<h3 style="color: #2c5282; font-size: 16px; margin: 20px 0 15px;">4.4 تحليل السيناريوهات</h3>`);
    
    const scenarioChartHtml = createScenarioChartSvg(scenarios, 550, 160);
    if (scenarioChartHtml) {
      allBlocks.push(scenarioChartHtml);
    }
    
    allBlocks.push(`
      <table style="${STYLES.table}">
        <thead>
          <tr>
            <th style="${STYLES.tableHeader}">السيناريو</th>
            <th style="${STYLES.tableHeader}; text-align: center;">NPV</th>
            <th style="${STYLES.tableHeader}; text-align: center;">IRR</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #f0fff4;">
            <td style="${STYLES.tableCell}; font-weight: bold;">أفضل سيناريو</td>
            <td style="${STYLES.tableCell}; text-align: center; color: #276749; font-weight: bold;">
              ${formatCurrency(financialModel.sensitivityAnalysis.bestCase?.npv || 0, project.currency)}
            </td>
            <td style="${STYLES.tableCell}; text-align: center; color: #276749; font-weight: bold;">
              ${(financialModel.sensitivityAnalysis.bestCase?.irr || 0).toFixed(1)}%
            </td>
          </tr>
          <tr style="background: #f7fafc;">
            <td style="${STYLES.tableCell}; font-weight: bold;">السيناريو الأساسي</td>
            <td style="${STYLES.tableCell}; text-align: center; font-weight: bold;">
              ${formatCurrency(financialModel.npv || "0", project.currency)}
            </td>
            <td style="${STYLES.tableCell}; text-align: center; font-weight: bold;">
              ${parseFloat(financialModel.irr || "0").toFixed(1)}%
            </td>
          </tr>
          <tr style="background: #fff5f5;">
            <td style="${STYLES.tableCell}; font-weight: bold;">أسوأ سيناريو</td>
            <td style="${STYLES.tableCell}; text-align: center; color: #c53030; font-weight: bold;">
              ${formatCurrency(financialModel.sensitivityAnalysis.worstCase?.npv || 0, project.currency)}
            </td>
            <td style="${STYLES.tableCell}; text-align: center; color: #c53030; font-weight: bold;">
              ${(financialModel.sensitivityAnalysis.worstCase?.irr || 0).toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    `);
  }
  
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          التحليل المالي (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

function createRiskAnalysisPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const pages = createRiskAnalysisPages(data, pageNum, totalPages);
  return pages[0];
}

function createRiskAnalysisPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report, risks } = data;
  const pages: HTMLDivElement[] = [];
  
  const getRiskColor = (score: number) => {
    if (score >= 15) return { bg: '#fff5f5', border: '#c53030', text: '#c53030', label: 'عالية' };
    if (score >= 8) return { bg: '#fffbeb', border: '#d69e2e', text: '#d69e2e', label: 'متوسطة' };
    return { bg: '#f0fff4', border: '#38a169', text: '#38a169', label: 'منخفضة' };
  };
  
  const createRiskCardHtml = (risk: NonNullable<typeof risks>[0], index: number) => {
    const colors = getRiskColor(risk.riskScore || 0);
    return `
      <div style="
        margin-bottom: 15px;
        padding: 15px 18px;
        background: ${colors.bg};
        border-radius: 10px;
        border-right: 4px solid ${colors.border};
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span style="font-weight: bold; font-size: 13px; color: #2d3748;">
            ${index + 1}. ${escapeHtml(risk.titleAr || '')}
          </span>
          <span style="
            background: ${colors.border};
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 10px;
            font-weight: bold;
          ">${colors.label} (${risk.riskScore}/25)</span>
        </div>
        <p style="color: #4a5568; font-size: 12px; margin: 0 0 10px 0; line-height: 1.7;">
          ${escapeHtml(risk.descriptionAr || '')}
        </p>
        <div style="display: flex; gap: 20px; font-size: 11px; color: #718096; margin-bottom: 10px;">
          <span>الاحتمالية: <strong>${risk.likelihood}/5</strong></span>
          <span>التأثير: <strong>${risk.impact}/5</strong></span>
          <span>التصنيف: <strong>${risk.category || 'عام'}</strong></span>
        </div>
        ${risk.mitigationAr ? `
          <div style="
            background: white;
            padding: 10px 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          ">
            <span style="color: #276749; font-weight: bold; font-size: 11px;">إجراءات التخفيف: </span>
            <span style="color: #2f855a; font-size: 11px;">${escapeHtml(risk.mitigationAr)}</span>
          </div>
        ` : ''}
      </div>
    `;
  };
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">5</span>تحليل المخاطر</h2>`;
  const riskAnalysisTextBlocks = report.riskAnalysisAr ? textToHtmlBlocks(report.riskAnalysisAr) : [];
  const riskMatrixHeader = risks && risks.length > 0 ? 
    [`<h3 style="color: #2c5282; font-size: 15px; margin: 20px 0 15px;">مصفوفة المخاطر المحددة</h3>`] : [];
  const riskCards = (risks || []).map((r, i) => createRiskCardHtml(r, i));
  
  const allBlocks = [headerBlock, ...riskAnalysisTextBlocks, ...riskMatrixHeader, ...riskCards];
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          تحليل المخاطر (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

function createRecommendationsPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const { project, report } = data;
  const { container, content } = createPageContainer(pageNum, totalPages, project.name);
  
  content.innerHTML = `
    <h2 style="${STYLES.sectionTitle}">
      <span style="font-size: 24px;">6</span>
      التوصيات النهائية
    </h2>
    
    ${report.recommendationsAr ? `
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.recommendationsAr)}
      </div>
    ` : ''}
    
    <div style="
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 12px;
      padding: 25px;
      margin-top: 30px;
    ">
      <h4 style="color: #2c5282; margin: 0 0 15px 0; font-size: 16px;">خطوات التنفيذ المقترحة</h4>
      <div style="display: grid; gap: 15px;">
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="
            width: 30px;
            height: 30px;
            background: #2c5282;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          ">1</span>
          <span style="font-size: 13px; color: #2d3748;">مراجعة التحليل المالي وتأكيد الأرقام</span>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="
            width: 30px;
            height: 30px;
            background: #2c5282;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          ">2</span>
          <span style="font-size: 13px; color: #2d3748;">تأمين التمويل اللازم</span>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="
            width: 30px;
            height: 30px;
            background: #2c5282;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          ">3</span>
          <span style="font-size: 13px; color: #2d3748;">إعداد خطة التنفيذ التفصيلية</span>
        </div>
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="
            width: 30px;
            height: 30px;
            background: #2c5282;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
          ">4</span>
          <span style="font-size: 13px; color: #2d3748;">البدء في التنفيذ ومتابعة الأداء</span>
        </div>
      </div>
    </div>
  `;
  
  return container;
}

function createRecommendationsPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report } = data;
  const pages: HTMLDivElement[] = [];
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">6</span>التوصيات النهائية</h2>`;
  
  const implementationSteps = `
    <div style="
      background: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 12px;
      padding: 20px;
      margin-top: 25px;
    ">
      <h4 style="color: #2c5282; margin: 0 0 12px 0; font-size: 14px;">خطوات التنفيذ المقترحة</h4>
      <div style="display: grid; gap: 12px;">
        ${[
          'مراجعة التحليل المالي وتأكيد الأرقام',
          'تأمين التمويل اللازم',
          'إعداد خطة التنفيذ التفصيلية',
          'البدء في التنفيذ ومتابعة الأداء'
        ].map((step, i) => `
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="
              width: 26px;
              height: 26px;
              background: #2c5282;
              color: white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 12px;
            ">${i + 1}</span>
            <span style="font-size: 12px; color: #2d3748;">${step}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  const recommendationBlocks = textToHtmlBlocks(report.recommendationsAr || '');
  const allBlocks = [headerBlock, ...recommendationBlocks, implementationSteps];
  
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          التوصيات النهائية (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

function createConclusionPage(data: PrintableReportData, pageNum: number, totalPages: number): HTMLDivElement {
  const { project, report, financialModel } = data;
  const { container, content } = createPageContainer(pageNum, totalPages, project.name);
  
  const npv = parseFloat(financialModel?.npv || "0");
  const irr = parseFloat(financialModel?.irr || "0");
  const isPositive = npv > 0 && irr > 10;
  
  content.innerHTML = `
    <h2 style="${STYLES.sectionTitle}">
      <span style="font-size: 24px;">7</span>
      الخلاصة والتوصية الاستثمارية
    </h2>
    
    ${report.conclusionAr ? `
      <div style="${STYLES.card}">
        ${formatParagraphWithBullets(report.conclusionAr)}
      </div>
    ` : ''}
    
    <div style="
      background: ${isPositive ? 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'};
      border: 2px solid ${isPositive ? '#38a169' : '#d69e2e'};
      border-radius: 15px;
      padding: 30px;
      margin-top: 30px;
      text-align: center;
    ">
      <h3 style="
        color: ${isPositive ? '#276749' : '#b7791f'};
        font-size: 20px;
        margin: 0 0 15px 0;
      ">التوصية النهائية</h3>
      <p style="
        font-size: 18px;
        font-weight: bold;
        color: ${isPositive ? '#22543d' : '#744210'};
        margin: 0 0 15px 0;
      ">
        ${isPositive ? 
          '[موصى به] يُنصح بالمضي قدماً في تنفيذ المشروع' : 
          '[تحذير] يُنصح بمراجعة المشروع وتحسين الجدوى المالية'}
      </p>
      <p style="color: #4a5568; font-size: 13px; margin: 0;">
        بناءً على التحليل المالي والسوقي، المشروع ${isPositive ? 'يحقق عوائد مجزية' : 'يتطلب تحسينات'} 
        مع صافي قيمة حالية ${formatCurrency(npv, project.currency)} 
        ومعدل عائد داخلي ${irr.toFixed(1)}%
      </p>
    </div>
    
    <div style="
      margin-top: 50px;
      padding: 25px;
      background: #f7fafc;
      border-radius: 12px;
      text-align: center;
    ">
      <p style="color: #718096; font-size: 12px; margin: 0 0 10px 0;">
        تم إعداد هذا التقرير بواسطة
      </p>
      <p style="
        color: #1a365d;
        font-size: 18px;
        font-weight: bold;
        margin: 0 0 10px 0;
      ">INFERA Vision</p>
      <p style="color: #a0aec0; font-size: 11px; margin: 0;">
        منصة دراسات الجدوى الذكية المدعومة بالذكاء الاصطناعي
      </p>
      <p style="color: #a0aec0; font-size: 10px; margin: 15px 0 0 0;">
        إخلاء مسؤولية: الأرقام والتقديرات الواردة تستند إلى البيانات المقدمة وتحليلات السوق المتاحة.
        يُنصح بإجراء دراسات تفصيلية إضافية قبل اتخاذ قرارات استثمارية نهائية.
      </p>
    </div>
  `;
  
  return container;
}

function createConclusionPages(data: PrintableReportData, startPageNum: number, totalPages: number): HTMLDivElement[] {
  const { project, report, financialModel } = data;
  const pages: HTMLDivElement[] = [];
  
  const npv = parseFloat(financialModel?.npv || "0");
  const irr = parseFloat(financialModel?.irr || "0");
  const isPositive = npv > 0 && irr > 10;
  
  const headerBlock = `<h2 style="${STYLES.sectionTitle}"><span style="font-size: 24px;">7</span>الخلاصة والتوصية الاستثمارية</h2>`;
  const conclusionBlocks = report.conclusionAr ? textToHtmlBlocks(report.conclusionAr) : [];
  
  const recommendationBox = `
    <div style="
      background: ${isPositive ? 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)'};
      border: 2px solid ${isPositive ? '#38a169' : '#d69e2e'};
      border-radius: 15px;
      padding: 25px;
      margin-top: 25px;
      text-align: center;
    ">
      <h3 style="color: ${isPositive ? '#276749' : '#b7791f'}; font-size: 18px; margin: 0 0 12px 0;">التوصية النهائية</h3>
      <p style="font-size: 16px; font-weight: bold; color: ${isPositive ? '#22543d' : '#744210'}; margin: 0 0 12px 0;">
        ${isPositive ? '[موصى به] يُنصح بالمضي قدماً في تنفيذ المشروع' : '[تحذير] يُنصح بمراجعة المشروع وتحسين الجدوى المالية'}
      </p>
      <p style="color: #4a5568; font-size: 12px; margin: 0;">
        بناءً على التحليل المالي والسوقي، المشروع ${isPositive ? 'يحقق عوائد مجزية' : 'يتطلب تحسينات'} 
        مع صافي قيمة حالية ${formatCurrency(npv, project.currency)} 
        ومعدل عائد داخلي ${irr.toFixed(1)}%
      </p>
    </div>
  `;
  
  const footer = `
    <div style="margin-top: 40px; padding: 20px; background: #f7fafc; border-radius: 12px; text-align: center;">
      <p style="color: #718096; font-size: 11px; margin: 0 0 8px 0;">تم إعداد هذا التقرير بواسطة</p>
      <p style="color: #1a365d; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">INFERA Vision</p>
      <p style="color: #a0aec0; font-size: 10px; margin: 0;">منصة دراسات الجدوى الذكية المدعومة بالذكاء الاصطناعي</p>
      <p style="color: #a0aec0; font-size: 9px; margin: 12px 0 0 0;">
        إخلاء مسؤولية: الأرقام والتقديرات الواردة تستند إلى البيانات المقدمة وتحليلات السوق المتاحة.
        يُنصح بإجراء دراسات تفصيلية إضافية قبل اتخاذ قرارات استثمارية نهائية.
      </p>
    </div>
  `;
  
  const allBlocks = [headerBlock, ...conclusionBlocks, recommendationBox, footer];
  const chunks = paginateHtmlBlocks(allBlocks, PAGE_CONFIG.contentHeight);
  
  for (let i = 0; i < chunks.length; i++) {
    const pageNum = startPageNum + i;
    const { container, content } = createPageContainer(pageNum, totalPages, project.name);
    
    if (i > 0) {
      content.innerHTML = `
        <p style="color: #718096; font-size: 11px; margin-bottom: 15px; font-style: italic;">
          الخلاصة والتوصية الاستثمارية (تابع - صفحة ${i + 1})
        </p>
        ${chunks[i].join('')}
      `;
    } else {
      content.innerHTML = chunks[i].join('');
    }
    
    pages.push(container);
  }
  
  return pages;
}

export async function exportReportFromHTML(data: PrintableReportData): Promise<void> {
  const sectionCreators: Array<{
    id: string;
    title: string;
    sectionNum: number;
    createPages: (startPage: number, totalPages: number) => HTMLDivElement[];
  }> = [
    { 
      id: 'executiveSummary', 
      title: 'الملخص التنفيذي', 
      sectionNum: 1,
      createPages: (p, t) => createExecutiveSummaryPages(data, p, t)
    },
    { 
      id: 'marketAnalysis', 
      title: 'تحليل السوق', 
      sectionNum: 2,
      createPages: (p, t) => createMarketAnalysisPages(data, p, t)
    },
    { 
      id: 'technicalAnalysis', 
      title: 'التحليل الفني والتشغيلي', 
      sectionNum: 3,
      createPages: (p, t) => createTechnicalAnalysisPages(data, p, t)
    },
    { 
      id: 'financialAnalysis', 
      title: 'التحليل المالي', 
      sectionNum: 4,
      createPages: (p, t) => createFinancialAnalysisPages(data, p, t)
    },
    { 
      id: 'riskAnalysis', 
      title: 'تحليل المخاطر', 
      sectionNum: 5,
      createPages: (p, t) => createRiskAnalysisPages(data, p, t)
    },
    { 
      id: 'recommendations', 
      title: 'التوصيات النهائية', 
      sectionNum: 6,
      createPages: (p, t) => createRecommendationsPages(data, p, t)
    },
    { 
      id: 'conclusion', 
      title: 'الخلاصة والتوصية الاستثمارية', 
      sectionNum: 7,
      createPages: (p, t) => createConclusionPages(data, p, t)
    },
  ];
  
  const sectionPageInfo: SectionPageInfo[] = [
    { sectionId: 'cover', title: 'صفحة الغلاف', startPage: 1, pageCount: 1 },
    { sectionId: 'toc', title: 'فهرس المحتويات', startPage: 2, pageCount: 1 },
  ];
  
  let currentPage = 3;
  const sectionPagesMap: Map<string, HTMLDivElement[]> = new Map();
  
  const estimatedTotal = 9 + (data.risks?.length || 0);
  
  for (const section of sectionCreators) {
    const sectionPages = section.createPages(currentPage, estimatedTotal);
    sectionPagesMap.set(section.id, sectionPages);
    
    sectionPageInfo.push({
      sectionId: section.id,
      title: section.title,
      startPage: currentPage,
      pageCount: sectionPages.length,
    });
    
    currentPage += sectionPages.length;
  }
  
  const totalPages = currentPage - 1;
  
  const coverPage = await createCoverPage(data);
  const allPages: HTMLDivElement[] = [
    coverPage,
    createTableOfContents(data, totalPages, sectionPageInfo),
  ];
  
  for (const section of sectionCreators) {
    const sectionPages = sectionPagesMap.get(section.id) || [];
    const pageInfo = sectionPageInfo.find(s => s.sectionId === section.id);
    
    if (pageInfo) {
      for (let i = 0; i < sectionPages.length; i++) {
        const page = sectionPages[i];
        const footer = page.querySelector('[data-footer]') as HTMLElement;
        if (footer) {
          const pageNumSpan = footer.querySelector('[data-page-num]');
          if (pageNumSpan) {
            pageNumSpan.textContent = `صفحة ${pageInfo.startPage + i} من ${totalPages}`;
          }
        }
        allPages.push(page);
      }
    }
  }
  
  const pages = allPages;
  
  await document.fonts.ready;
  
  const testFont = document.createElement('div');
  testFont.style.cssText = `
    position: fixed;
    left: -9999px;
    font-family: 'Cairo', 'Noto Naskh Arabic', 'Amiri', sans-serif;
    font-size: 24px;
    direction: rtl;
  `;
  testFont.textContent = 'مصنع أغلاف الرياض فهرس المحتويات الملخص التنفيذي تحليل السوق التحليل الفني والتشغيلي التحليل المالي تحليل المخاطر التوصيات النهائية الخلاصة';
  document.body.appendChild(testFont);
  await new Promise(resolve => setTimeout(resolve, 300));
  document.body.removeChild(testFont);
  
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    page.style.position = 'fixed';
    page.style.left = '-9999px';
    page.style.top = '0';
    page.style.fontFamily = "'Cairo', 'Noto Naskh Arabic', 'Amiri', 'Segoe UI', 'Arial', 'Tahoma', sans-serif";
    document.body.appendChild(page);
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const canvas = await html2canvas(page, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794,
      height: 1123,
      logging: false,
    });
    
    document.body.removeChild(page);
    
    if (i > 0) {
      pdf.addPage();
    }
    
    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
  }
  
  const filename = `${sanitizeFilename(data.project.name)}_دراسة_الجدوى_v${data.report.version}.pdf`;
  pdf.save(filename);
}

export async function exportReportToPDF(data: ReportData, language: string = "en"): Promise<void> {
  const { report, project, financialModel, marketEstimate, risks } = data;
  
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let yPos = margin;

  const addHeader = () => {
    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text("INFERA Vision - Feasibility Study", margin, 10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 10);
    doc.setDrawColor(200);
    doc.line(margin, 12, pageWidth - margin, 12);
  };

  const addFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
  };

  const checkNewPage = (neededHeight: number): boolean => {
    if (yPos + neededHeight > pageHeight - 30) {
      addFooter(doc.getNumberOfPages());
      doc.addPage();
      addHeader();
      yPos = 25;
      return true;
    }
    return false;
  };

  const addTitle = (text: string) => {
    checkNewPage(15);
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, yPos);
    yPos += 10;
  };

  const addParagraph = (text: string) => {
    if (!text) return;
    checkNewPage(20);
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentWidth);
    lines.forEach((line: string) => {
      checkNewPage(6);
      doc.text(line, margin, yPos);
      yPos += 5;
    });
    yPos += 5;
  };

  const addKeyValue = (label: string, value: string) => {
    checkNewPage(8);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80);
    doc.text(label + ":", margin, yPos);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40);
    doc.text(value, margin + 60, yPos);
    yPos += 6;
  };

  const formatCurr = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: project.currency || "USD",
      minimumFractionDigits: 0,
    }).format(val);
  };

  addHeader();
  yPos = 25;

  doc.setFontSize(24);
  doc.setTextColor(0, 100, 200);
  doc.setFont("helvetica", "bold");
  doc.text(project.name, pageWidth / 2, yPos, { align: "center" });
  yPos += 12;

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("Feasibility Study Report", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(12);
  doc.text(`Version ${report.version}`, pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  addKeyValue("Industry", project.industry);
  addKeyValue("Country", project.country);
  addKeyValue("Currency", project.currency);
  addKeyValue("Duration", `${project.projectDuration} years`);
  yPos += 10;

  addTitle("1. Executive Summary");
  addParagraph(report.executiveSummaryEn || "");

  addTitle("2. Market Analysis");
  addParagraph(report.marketAnalysisEn || "");

  if (marketEstimate) {
    yPos += 5;
    addKeyValue("TAM", formatCurr(parseFloat(marketEstimate.tam || "0")));
    addKeyValue("SAM", formatCurr(parseFloat(marketEstimate.sam || "0")));
    addKeyValue("SOM", formatCurr(parseFloat(marketEstimate.som || "0")));
    if (marketEstimate.marketGrowthRate) {
      addKeyValue("Growth Rate", `${(parseFloat(marketEstimate.marketGrowthRate) * 100).toFixed(1)}%`);
    }
  }

  addTitle("3. Financial Analysis");
  addParagraph(report.financialAnalysisEn || "");

  if (financialModel) {
    yPos += 5;
    addKeyValue("NPV", formatCurr(parseFloat(financialModel.npv || "0")));
    addKeyValue("IRR", `${parseFloat(financialModel.irr || "0").toFixed(1)}%`);
    addKeyValue("ROI", `${parseFloat(financialModel.roi || "0").toFixed(1)}%`);
    addKeyValue("Payback Period", `${parseFloat(financialModel.paybackPeriod || "0").toFixed(1)} years`);
  }

  addTitle("4. Risk Analysis");
  addParagraph(report.riskAnalysisEn || "");

  if (risks && risks.length > 0) {
    risks.forEach((risk, i) => {
      checkNewPage(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${risk.titleEn || "Risk"}`, margin, yPos);
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (risk.descriptionEn) {
        const lines = doc.splitTextToSize(risk.descriptionEn, contentWidth);
        lines.forEach((line: string) => {
          doc.text(line, margin, yPos);
          yPos += 5;
        });
      }
      yPos += 3;
    });
  }

  addTitle("5. Recommendations");
  addParagraph(report.recommendationsEn || "");

  addTitle("6. Conclusion");
  addParagraph(report.conclusionEn || "");

  addFooter(doc.getNumberOfPages());

  const filename = `${sanitizeFilename(project.name)}_Feasibility_Study_v${report.version}.pdf`;
  doc.save(filename);
}
