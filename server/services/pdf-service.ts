import puppeteer from 'puppeteer';
import type { Project, FinancialModel, MarketEstimate, RiskItem } from '@shared/schema';
import { generateReportImages, type ReportImages } from './project-image-service';

type FeasibilityReport = {
  id: number;
  projectId: number;
  version: number;
  executiveSummaryEn: string | null;
  executiveSummaryAr: string | null;
  projectDescriptionEn: string | null;
  projectDescriptionAr: string | null;
  marketAnalysisEn: string | null;
  marketAnalysisAr: string | null;
  locationAnalysisEn: string | null;
  locationAnalysisAr: string | null;
  operationalModelEn: string | null;
  operationalModelAr: string | null;
  capexAnalysisEn: string | null;
  capexAnalysisAr: string | null;
  opexAnalysisEn: string | null;
  opexAnalysisAr: string | null;
  revenueProjectionsEn: string | null;
  revenueProjectionsAr: string | null;
  financialAnalysisEn: string | null;
  financialAnalysisAr: string | null;
  riskAnalysisEn: string | null;
  riskAnalysisAr: string | null;
  recommendationsEn: string | null;
  recommendationsAr: string | null;
  conclusionEn: string | null;
  conclusionAr: string | null;
  createdAt: Date;
};

interface ReportData {
  report: FeasibilityReport;
  project: Project;
  financialModels: FinancialModel[];
  marketEstimates: MarketEstimate[];
  riskItems: RiskItem[];
  issuer?: {
    name?: string | null;
    email?: string | null;
    organization?: string | null;
  } | null;
}

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('ar-SA').format(n);
}

function formatCurrency(amount: number | string | null | undefined, currency: string = 'SAR'): string {
  if (amount === null || amount === undefined) return `0 ${currency}`;
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return `0 ${currency}`;
  return `${formatNumber(n)} ${currency}`;
}

function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '0%';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(n)) return '0%';
  return `${n.toFixed(1)}%`;
}

function getGoNoGoDecision(irr: number | string | null | undefined): { decision: string; color: string; bgColor: string } {
  const irrValue = typeof irr === 'string' ? parseFloat(irr) : (irr || 0);
  if (irrValue >= 15) {
    return { decision: 'GO - استثمار موصى به', color: '#059669', bgColor: '#D1FAE5' };
  } else if (irrValue >= 10) {
    return { decision: 'CONDITIONAL GO - استثمار مشروط', color: '#D97706', bgColor: '#FEF3C7' };
  } else {
    return { decision: 'NO GO - استثمار غير موصى به', color: '#DC2626', bgColor: '#FEE2E2' };
  }
}

function getRiskLevel(likelihood: number | null, impact: number | null): { level: string; color: string; cssClass: string } {
  const score = ((likelihood || 0) + (impact || 0)) / 2;
  if (score >= 4) {
    return { level: 'عالية', color: '#DC2626', cssClass: 'risk-high' };
  } else if (score >= 2.5) {
    return { level: 'متوسطة', color: '#D97706', cssClass: 'risk-medium' };
  } else {
    return { level: 'منخفضة', color: '#059669', cssClass: 'risk-low' };
  }
}

function generateCashFlowChartSVG(data: ReportData): string {
  const projectDuration = data.project.projectDuration || 5;
  const years = Array.from({ length: projectDuration }, (_, i) => i + 1);
  
  const fm = data.financialModels[0];
  const cashFlows = fm?.cashFlows || years.map((_, idx) => 100000 * (1 + 0.1 * idx));
  
  const maxValue = Math.max(...cashFlows.map(Math.abs), 1);
  const chartHeight = 200;
  const chartWidth = 500;
  const barWidth = Math.min(40, (chartWidth - 60) / years.length - 10);
  
  let bars = '';
  years.forEach((year, idx) => {
    const cf = cashFlows[idx] || 0;
    const barHeight = (Math.abs(cf) / maxValue) * (chartHeight - 50);
    const x = 50 + idx * (barWidth + 15);
    const y = cf >= 0 ? chartHeight - 30 - barHeight : chartHeight - 30;
    const color = cf >= 0 ? '#059669' : '#DC2626';
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4"/>`;
    bars += `<text x="${x + barWidth/2}" y="${chartHeight - 5}" text-anchor="middle" fill="#64748B" font-size="11" font-family="Cairo, sans-serif">السنة ${year}</text>`;
  });
  
  return `
    <svg width="${chartWidth}" height="${chartHeight + 10}" viewBox="0 0 ${chartWidth} ${chartHeight + 10}">
      <defs>
        <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#F8FAFC"/>
          <stop offset="100%" style="stop-color:#F1F5F9"/>
        </linearGradient>
      </defs>
      <rect x="40" y="10" width="${chartWidth - 50}" height="${chartHeight - 40}" fill="url(#gridGradient)" rx="8"/>
      <line x1="40" y1="${chartHeight - 30}" x2="${chartWidth - 10}" y2="${chartHeight - 30}" stroke="#CBD5E1" stroke-width="2"/>
      ${bars}
    </svg>
  `;
}

function generatePDFHTML(data: ReportData, images?: ReportImages | null): string {
  const { report, project, financialModels, marketEstimates, riskItems } = data;
  const fm = financialModels[0];
  const me = marketEstimates[0];
  
  const currentDate = new Date().toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const goNoGo = getGoNoGoDecision(fm?.irr);
  
  const highRisks = riskItems.filter(r => ((r.likelihood || 0) + (r.impact || 0)) / 2 >= 4);
  const mediumRisks = riskItems.filter(r => {
    const score = ((r.likelihood || 0) + (r.impact || 0)) / 2;
    return score >= 2.5 && score < 4;
  });
  const lowRisks = riskItems.filter(r => ((r.likelihood || 0) + (r.impact || 0)) / 2 < 2.5);
  
  const coverImageStyle = images?.cover 
    ? `background-image: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 58, 95, 0.85) 50%, rgba(15, 23, 42, 0.9) 100%), url(data:image/png;base64,${images.cover}); background-size: cover; background-position: center;`
    : 'background: linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #0F172A 100%);';

  return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1E293B;
      background: white;
      direction: rtl;
      text-align: right;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      max-height: 297mm;
      padding: 20mm;
      page-break-after: always;
      page-break-inside: avoid;
      background: white;
      position: relative;
      overflow: hidden;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    .cover-page {
      padding: 0;
      display: flex;
      flex-direction: column;
      color: white;
      height: 297mm;
      max-height: 297mm;
      overflow: hidden;
    }
    
    .cover-header {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%);
      padding: 25mm 20mm 15mm;
      text-align: center;
      flex-shrink: 0;
    }
    
    .cover-logo {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: 4px;
      margin-bottom: 5mm;
      background: linear-gradient(135deg, #60A5FA, #A78BFA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .cover-subtitle {
      font-size: 14px;
      color: #94A3B8;
      letter-spacing: 2px;
    }
    
    .cover-main {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 10mm 20mm;
      text-align: center;
      min-height: 0;
    }
    
    .cover-badge {
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      padding: 2mm 6mm;
      border-radius: 20px;
      font-size: 10px;
      font-weight: 600;
      margin-bottom: 5mm;
      letter-spacing: 1px;
    }
    
    .cover-title {
      font-size: 28px;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 5mm;
      text-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }
    
    .cover-project-name {
      font-size: 24px;
      font-weight: 700;
      color: #60A5FA;
      margin-bottom: 8mm;
    }
    
    .cover-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 4mm;
      width: 100%;
      max-width: 130mm;
      margin-top: 5mm;
    }
    
    .cover-meta-item {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 4mm;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.1);
    }
    
    .cover-meta-label {
      font-size: 9px;
      color: #94A3B8;
      margin-bottom: 1mm;
    }
    
    .cover-meta-value {
      font-size: 12px;
      font-weight: 700;
    }
    
    .cover-footer {
      background: linear-gradient(0deg, rgba(15, 23, 42, 0.95) 0%, transparent 100%);
      padding: 12mm 20mm;
      text-align: center;
      flex-shrink: 0;
    }
    
    .cover-date {
      font-size: 12px;
      color: #94A3B8;
    }
    
    .cover-copyright {
      font-size: 10px;
      color: #64748B;
      margin-top: 5mm;
    }
    
    .decision-banner {
      background: ${goNoGo.bgColor};
      border: 2px solid ${goNoGo.color};
      border-radius: 12px;
      padding: 8mm;
      margin: 10mm 0;
      text-align: center;
    }
    
    .decision-label {
      font-size: 11px;
      color: #64748B;
      margin-bottom: 3mm;
    }
    
    .decision-value {
      font-size: 24px;
      font-weight: 800;
      color: ${goNoGo.color};
    }
    
    .section-header {
      display: flex;
      align-items: center;
      gap: 3mm;
      margin-bottom: 5mm;
      padding-bottom: 3mm;
      border-bottom: 2px solid #3B82F6;
    }
    
    .section-number {
      width: 10mm;
      height: 10mm;
      background: linear-gradient(135deg, #3B82F6, #8B5CF6);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 800;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
    }
    
    .subsection-title {
      font-size: 14px;
      font-weight: 700;
      color: #1E3A5F;
      margin: 4mm 0 3mm;
      padding-right: 3mm;
      border-right: 3px solid #3B82F6;
    }
    
    .content-text {
      font-size: 10px;
      line-height: 1.6;
      color: #374151;
      text-align: justify;
      margin-bottom: 3mm;
    }
    
    .page-content {
      height: calc(297mm - 50mm);
      overflow: hidden;
    }
    
    .card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 5mm;
      margin-bottom: 5mm;
    }
    
    .card-highlight {
      background: linear-gradient(135deg, #EFF6FF, #F0F9FF);
      border: 1px solid #BFDBFE;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
      margin: 4mm 0;
    }
    
    .metric-card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 3mm;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    
    .metric-label {
      font-size: 10px;
      color: #64748B;
      margin-bottom: 2mm;
    }
    
    .metric-value {
      font-size: 18px;
      font-weight: 800;
      color: #0F172A;
    }
    
    .metric-value.positive { color: #059669; }
    .metric-value.negative { color: #DC2626; }
    .metric-value.primary { color: #3B82F6; }
    
    .table-container {
      margin: 5mm 0;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    
    th {
      background: linear-gradient(135deg, #1E3A5F, #0F172A);
      color: white;
      padding: 4mm 3mm;
      text-align: right;
      font-weight: 700;
    }
    
    td {
      padding: 3mm;
      border-bottom: 1px solid #E2E8F0;
      text-align: right;
    }
    
    tr:nth-child(even) td {
      background: #F8FAFC;
    }
    
    tr:last-child td {
      border-bottom: none;
    }
    
    .risk-badge {
      display: inline-block;
      padding: 2mm 4mm;
      border-radius: 6px;
      font-size: 10px;
      font-weight: 700;
    }
    
    .risk-high {
      background: #FEE2E2;
      color: #DC2626;
    }
    
    .risk-medium {
      background: #FEF3C7;
      color: #D97706;
    }
    
    .risk-low {
      background: #D1FAE5;
      color: #059669;
    }
    
    .chart-container {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 5mm;
      margin: 5mm 0;
      text-align: center;
    }
    
    .chart-title {
      font-size: 14px;
      font-weight: 700;
      color: #1E3A5F;
      margin-bottom: 4mm;
    }
    
    .page-header {
      position: absolute;
      top: 10mm;
      right: 20mm;
      left: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 3mm;
      border-bottom: 1px solid #E2E8F0;
    }
    
    .page-header-logo {
      font-size: 12px;
      font-weight: 800;
      color: #3B82F6;
    }
    
    .page-header-title {
      font-size: 10px;
      color: #64748B;
    }
    
    .page-footer {
      position: absolute;
      bottom: 10mm;
      right: 20mm;
      left: 20mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 3mm;
      border-top: 1px solid #E2E8F0;
      font-size: 9px;
      color: #94A3B8;
    }
    
    .page-number {
      background: #1E3A5F;
      color: white;
      width: 8mm;
      height: 8mm;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    
    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4mm 0;
      border-bottom: 1px dashed #CBD5E1;
    }
    
    .toc-item-left {
      display: flex;
      align-items: center;
      gap: 3mm;
    }
    
    .toc-number {
      width: 8mm;
      height: 8mm;
      background: #1E3A5F;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
    }
    
    .toc-title {
      font-size: 14px;
      font-weight: 600;
      color: #1E293B;
    }
    
    .toc-page {
      font-size: 14px;
      font-weight: 700;
      color: #3B82F6;
    }
    
    .recommendation-item {
      display: flex;
      gap: 4mm;
      margin-bottom: 5mm;
      padding: 4mm;
      background: #F0F9FF;
      border-radius: 10px;
      border-right: 4px solid #3B82F6;
    }
    
    .recommendation-number {
      width: 8mm;
      height: 8mm;
      background: #3B82F6;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }
    
    .recommendation-content {
      flex: 1;
    }
    
    .recommendation-title {
      font-size: 13px;
      font-weight: 700;
      color: #1E3A5F;
      margin-bottom: 2mm;
    }
    
    .recommendation-text {
      font-size: 11px;
      color: #475569;
      line-height: 1.6;
    }
    
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { margin: 0; box-shadow: none; }
    }
  </style>
</head>
<body>
  <!-- Cover Page -->
  <div class="page cover-page" style="${coverImageStyle}">
    <div class="cover-header">
      <div class="cover-logo">INFERA VISION</div>
      <div class="cover-subtitle">منصة الذكاء الاصطناعي لدراسات الجدوى</div>
    </div>
    
    <div class="cover-main">
      <div class="cover-badge">دراسة جدوى استثمارية شاملة</div>
      <h1 class="cover-title">تقرير دراسة الجدوى الاقتصادية</h1>
      <div class="cover-project-name">${escapeHtml(project.name)}</div>
      
      <div class="cover-meta-grid">
        <div class="cover-meta-item">
          <div class="cover-meta-label">القطاع</div>
          <div class="cover-meta-value">${escapeHtml(project.industry)}</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">الموقع</div>
          <div class="cover-meta-value">${escapeHtml(project.country)}</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">مدة المشروع</div>
          <div class="cover-meta-value">${project.projectDuration || 5} سنوات</div>
        </div>
        <div class="cover-meta-item">
          <div class="cover-meta-label">الإصدار</div>
          <div class="cover-meta-value">v${report.version}.0</div>
        </div>
      </div>
    </div>
    
    ${(data.issuer?.name || data.issuer?.organization || project.clientName || project.clientCompany) ? `
    <div style="display: flex; justify-content: center; gap: 20px; margin-top: 15px; margin-bottom: 15px;">
      ${data.issuer?.name || data.issuer?.organization ? `
      <div style="background: rgba(255,255,255,0.95); padding: 10px 20px; border-radius: 8px; text-align: center; min-width: 160px; border: 1px solid rgba(59, 130, 246, 0.3);">
        <div style="color: #3b82f6; font-size: 9px; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px;">صادر من</div>
        <div style="color: #1e40af; font-size: 12px; font-weight: bold;">${escapeHtml(data.issuer?.name || '')}</div>
        ${data.issuer?.organization ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;">${escapeHtml(data.issuer.organization)}</div>` : ''}
      </div>
      ` : ''}
      ${project.clientName || project.clientCompany ? `
      <div style="background: rgba(255,255,255,0.95); padding: 10px 20px; border-radius: 8px; text-align: center; min-width: 160px; border: 1px solid rgba(34, 197, 94, 0.3);">
        <div style="color: #22c55e; font-size: 9px; font-weight: 600; letter-spacing: 1px; margin-bottom: 4px;">مُقدم إلى</div>
        <div style="color: #15803d; font-size: 12px; font-weight: bold;">${escapeHtml(project.clientName || '')}</div>
        ${project.clientCompany ? `<div style="color: #64748b; font-size: 10px; margin-top: 2px;">${escapeHtml(project.clientCompany)}</div>` : ''}
      </div>
      ` : ''}
    </div>
    ` : ''}
    
    <div class="cover-footer">
      <div class="cover-date">تاريخ الإصدار: ${currentDate}</div>
      <div class="cover-copyright">© ${new Date().getFullYear()} INFERA Vision - جميع الحقوق محفوظة</div>
    </div>
  </div>
  
  <!-- Table of Contents -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-title">فهرس المحتويات</div>
      </div>
      
      <div style="margin-top: 10mm;">
        <div class="toc-item">
          <div class="toc-item-left">
            <div class="toc-number">1</div>
            <div class="toc-title">الملخص التنفيذي</div>
          </div>
          <div class="toc-page">3</div>
        </div>
        <div class="toc-item">
          <div class="toc-item-left">
            <div class="toc-number">2</div>
            <div class="toc-title">تحليل السوق</div>
          </div>
          <div class="toc-page">4</div>
        </div>
        <div class="toc-item">
          <div class="toc-item-left">
            <div class="toc-number">3</div>
            <div class="toc-title">التحليل الفني والتشغيلي</div>
          </div>
          <div class="toc-page">5</div>
        </div>
        <div class="toc-item">
          <div class="toc-item-left">
            <div class="toc-number">4</div>
            <div class="toc-title">التحليل المالي</div>
          </div>
          <div class="toc-page">6</div>
        </div>
        <div class="toc-item">
          <div class="toc-item-left">
            <div class="toc-number">5</div>
            <div class="toc-title">تحليل المخاطر</div>
          </div>
          <div class="toc-page">7</div>
        </div>
        <div class="toc-item">
          <div class="toc-item-left">
            <div class="toc-number">6</div>
            <div class="toc-title">التوصيات والخلاصة</div>
          </div>
          <div class="toc-page">8</div>
        </div>
      </div>
    </div>
    
    <div class="page-footer">
      <span>تقرير سري - للاستخدام الداخلي فقط</span>
      <div class="page-number">2</div>
    </div>
  </div>
  
  <!-- Executive Summary -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-number">1</div>
        <div class="section-title">الملخص التنفيذي</div>
      </div>
      
      <div class="decision-banner">
        <div class="decision-label">قرار الاستثمار النهائي</div>
        <div class="decision-value">${goNoGo.decision}</div>
      </div>
      
      <div class="card card-highlight">
        <p class="content-text">${escapeHtml(report.executiveSummaryAr || report.executiveSummaryEn)}</p>
      </div>
      
      <div class="subsection-title">المؤشرات المالية الرئيسية</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">إجمالي الاستثمار (CAPEX)</div>
          <div class="metric-value primary">${formatCurrency(fm?.capex, project.currency)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">معدل العائد الداخلي (IRR)</div>
          <div class="metric-value ${parseFloat(fm?.irr || '0') >= 15 ? 'positive' : 'negative'}">${formatPercent(fm?.irr)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">صافي القيمة الحالية (NPV)</div>
          <div class="metric-value ${parseFloat(fm?.npv || '0') >= 0 ? 'positive' : 'negative'}">${formatCurrency(fm?.npv, project.currency)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">العائد على الاستثمار (ROI)</div>
          <div class="metric-value ${parseFloat(fm?.roi || '0') >= 0 ? 'positive' : 'negative'}">${formatPercent(fm?.roi)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">فترة الاسترداد</div>
          <div class="metric-value primary">${fm?.paybackPeriod || 'N/A'} سنوات</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">نقطة التعادل</div>
          <div class="metric-value primary">${formatNumber(fm?.breakEvenUnits)} وحدة</div>
        </div>
      </div>
    </div>
    
    <div class="page-footer">
      <span>تقرير سري - للاستخدام الداخلي فقط</span>
      <div class="page-number">3</div>
    </div>
  </div>
  
  <!-- Market Analysis -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-number">2</div>
        <div class="section-title">تحليل السوق</div>
      </div>
      
      <div class="card">
        <p class="content-text">${escapeHtml(report.marketAnalysisAr || report.marketAnalysisEn)}</p>
      </div>
      
      <div class="subsection-title">تقديرات حجم السوق (TAM/SAM/SOM)</div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">إجمالي السوق المتاح (TAM)</div>
          <div class="metric-value primary">${formatCurrency(me?.tam, project.currency)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">السوق القابل للخدمة (SAM)</div>
          <div class="metric-value primary">${formatCurrency(me?.sam, project.currency)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">السوق المستهدف (SOM)</div>
          <div class="metric-value positive">${formatCurrency(me?.som, project.currency)}</div>
        </div>
      </div>
      
      ${me?.assumptions ? `
      <div class="subsection-title">الافتراضات الأساسية</div>
      <div class="card">
        <p class="content-text">${escapeHtml(me.assumptions)}</p>
      </div>
      ` : ''}
    </div>
    
    <div class="page-footer">
      <span>تقرير سري - للاستخدام الداخلي فقط</span>
      <div class="page-number">4</div>
    </div>
  </div>
  
  <!-- Technical Analysis -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-number">3</div>
        <div class="section-title">التحليل الفني والتشغيلي</div>
      </div>
      
      ${report.projectDescriptionAr || report.projectDescriptionEn ? `
      <div class="subsection-title">وصف المشروع</div>
      <div class="card">
        <p class="content-text">${escapeHtml(report.projectDescriptionAr || report.projectDescriptionEn)}</p>
      </div>
      ` : ''}
      
      ${report.locationAnalysisAr || report.locationAnalysisEn ? `
      <div class="subsection-title">تحليل الموقع</div>
      <div class="card">
        <p class="content-text">${escapeHtml(report.locationAnalysisAr || report.locationAnalysisEn)}</p>
      </div>
      ` : ''}
      
      ${report.operationalModelAr || report.operationalModelEn ? `
      <div class="subsection-title">النموذج التشغيلي</div>
      <div class="card">
        <p class="content-text">${escapeHtml(report.operationalModelAr || report.operationalModelEn)}</p>
      </div>
      ` : ''}
    </div>
    
    <div class="page-footer">
      <span>تقرير سري - للاستخدام الداخلي فقط</span>
      <div class="page-number">5</div>
    </div>
  </div>
  
  <!-- Financial Analysis -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-number">4</div>
        <div class="section-title">التحليل المالي</div>
      </div>
      
      <div class="subsection-title">التكاليف الرأسمالية (CAPEX)</div>
      <div class="card">
        <p class="content-text">${escapeHtml(report.capexAnalysisAr || report.capexAnalysisEn)}</p>
      </div>
      
      <div class="subsection-title">التكاليف التشغيلية (OPEX)</div>
      <div class="card">
        <p class="content-text">${escapeHtml(report.opexAnalysisAr || report.opexAnalysisEn)}</p>
      </div>
      
      <div class="subsection-title">توقعات الإيرادات</div>
      <div class="card">
        <p class="content-text">${escapeHtml(report.revenueProjectionsAr || report.revenueProjectionsEn)}</p>
      </div>
      
      <div class="chart-container">
        <div class="chart-title">التدفقات النقدية المتوقعة</div>
        ${generateCashFlowChartSVG(data)}
      </div>
    </div>
    
    <div class="page-footer">
      <span>تقرير سري - للاستخدام الداخلي فقط</span>
      <div class="page-number">6</div>
    </div>
  </div>
  
  <!-- Risk Analysis -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-number">5</div>
        <div class="section-title">تحليل المخاطر</div>
      </div>
      
      <div class="card">
        <p class="content-text">${escapeHtml(report.riskAnalysisAr || report.riskAnalysisEn)}</p>
      </div>
      
      ${riskItems.length > 0 ? `
      <div class="subsection-title">مصفوفة المخاطر</div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>المخاطرة</th>
              <th>النوع</th>
              <th>مستوى الخطورة</th>
              <th>استراتيجية التخفيف</th>
            </tr>
          </thead>
          <tbody>
            ${riskItems.map(risk => {
              const riskLevel = getRiskLevel(risk.likelihood, risk.impact);
              return `
              <tr>
                <td style="font-weight: 600;">${escapeHtml(risk.titleAr || risk.titleEn)}</td>
                <td>${escapeHtml(risk.category)}</td>
                <td><span class="risk-badge ${riskLevel.cssClass}">${riskLevel.level}</span></td>
                <td style="font-size: 10px;">${escapeHtml(risk.mitigationAr || risk.mitigationEn)}</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="metrics-grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="metric-card" style="border-right: 4px solid #DC2626;">
          <div class="metric-label">مخاطر عالية</div>
          <div class="metric-value negative">${highRisks.length}</div>
        </div>
        <div class="metric-card" style="border-right: 4px solid #F59E0B;">
          <div class="metric-label">مخاطر متوسطة</div>
          <div class="metric-value" style="color: #D97706;">${mediumRisks.length}</div>
        </div>
        <div class="metric-card" style="border-right: 4px solid #059669;">
          <div class="metric-label">مخاطر منخفضة</div>
          <div class="metric-value positive">${lowRisks.length}</div>
        </div>
      </div>
    </div>
    
    <div class="page-footer">
      <span>تقرير سري - للاستخدام الداخلي فقط</span>
      <div class="page-number">7</div>
    </div>
  </div>
  
  <!-- Recommendations & Conclusion -->
  <div class="page">
    <div class="page-header">
      <div class="page-header-logo">INFERA VISION</div>
      <div class="page-header-title">${escapeHtml(project.name)}</div>
    </div>
    
    <div style="margin-top: 20mm;">
      <div class="section-header">
        <div class="section-number">6</div>
        <div class="section-title">التوصيات والخلاصة</div>
      </div>
      
      <div class="card card-highlight">
        <p class="content-text">${escapeHtml(report.recommendationsAr || report.recommendationsEn)}</p>
      </div>
      
      <div class="subsection-title">خطوات التنفيذ الموصى بها</div>
      <div class="recommendation-item">
        <div class="recommendation-number">1</div>
        <div class="recommendation-content">
          <div class="recommendation-title">مرحلة التأسيس</div>
          <div class="recommendation-text">إنهاء الإجراءات القانونية والحصول على التراخيص اللازمة وتأمين التمويل</div>
        </div>
      </div>
      <div class="recommendation-item">
        <div class="recommendation-number">2</div>
        <div class="recommendation-content">
          <div class="recommendation-title">مرحلة الإنشاء</div>
          <div class="recommendation-text">تجهيز الموقع وشراء المعدات وتوظيف الكوادر الأساسية</div>
        </div>
      </div>
      <div class="recommendation-item">
        <div class="recommendation-number">3</div>
        <div class="recommendation-content">
          <div class="recommendation-title">مرحلة التشغيل</div>
          <div class="recommendation-text">بدء الإنتاج التجريبي والتسويق وتطوير قنوات التوزيع</div>
        </div>
      </div>
      
      <div class="decision-banner" style="margin-top: 10mm;">
        <div class="decision-label">التوصية الاستثمارية النهائية</div>
        <div class="decision-value">${goNoGo.decision}</div>
      </div>
      
      <div style="text-align: center; margin-top: 15mm; padding-top: 10mm; border-top: 2px solid #E2E8F0;">
        <p style="color: #64748B; font-size: 11px; margin-bottom: 3mm;">تم إعداد هذا التقرير بواسطة</p>
        <p style="font-size: 18px; font-weight: 800; color: #3B82F6; margin-bottom: 3mm;">INFERA VISION</p>
        <p style="color: #94A3B8; font-size: 10px;">منصة الذكاء الاصطناعي لدراسات الجدوى الاستثمارية</p>
      </div>
    </div>
    
    <div class="page-footer">
      <span>© ${new Date().getFullYear()} INFERA Vision - جميع الحقوق محفوظة</span>
      <div class="page-number">8</div>
    </div>
  </div>
</body>
</html>
  `;
}

async function findChromiumPath(): Promise<string | undefined> {
  const { execSync } = await import('child_process');
  try {
    const path = execSync('which chromium', { encoding: 'utf-8' }).trim();
    if (path) return path;
  } catch {}
  try {
    const path = execSync('which chromium-browser', { encoding: 'utf-8' }).trim();
    if (path) return path;
  } catch {}
  try {
    const path = execSync('which google-chrome', { encoding: 'utf-8' }).trim();
    if (path) return path;
  } catch {}
  return undefined;
}

export async function generatePDF(reportData: ReportData, includeImages: boolean = true): Promise<Buffer> {
  let images: ReportImages | null = null;
  
  if (includeImages) {
    try {
      console.log('Generating AI images for report...');
      images = await generateReportImages({
        projectName: reportData.project.name,
        industry: reportData.project.industry,
        description: reportData.project.description || undefined,
        country: reportData.project.country || undefined,
      });
      console.log('AI images generated successfully');
    } catch (error) {
      console.error('Failed to generate AI images, continuing without images:', error);
    }
  }
  
  const html = generatePDFHTML(reportData, images);
  
  const executablePath = await findChromiumPath();
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });
    
    const page = await browser.newPage();
    
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000,
    });
    
    await page.evaluateHandle('document.fonts.ready');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    
    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export type { ReportData };
