export interface FinancialInputs {
  initialInvestment: number;
  projectDuration: number;
  discountRate: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  revenueGrowthRate: number;
  expenseGrowthRate: number;
  fixedCosts: number;
  variableCostPerUnit: number;
  pricePerUnit: number;
}

export interface FinancialMetrics {
  npv: number;
  irr: number;
  roi: number;
  paybackPeriod: number;
  profitabilityIndex: number;
  breakEvenPoint: number;
  breakEvenUnits: number;
  capex: number;
  opex: number;
  revenueProjections: number[];
  expenseProjections: number[];
  cashFlows: number[];
  sensitivityAnalysis: {
    bestCase: { npv: number; irr: number; assumptions: string };
    worstCase: { npv: number; irr: number; assumptions: string };
    baseCase: { npv: number; irr: number };
  };
}

export function calculateFinancialMetrics(inputs: FinancialInputs): FinancialMetrics {
  const {
    initialInvestment,
    projectDuration,
    discountRate,
    monthlyRevenue,
    monthlyExpenses,
    revenueGrowthRate,
    expenseGrowthRate,
    fixedCosts,
    variableCostPerUnit,
    pricePerUnit,
  } = inputs;

  const annualRevenue = monthlyRevenue * 12;
  const annualExpenses = monthlyExpenses * 12;
  
  const revenueProjections: number[] = [];
  const expenseProjections: number[] = [];
  const cashFlows: number[] = [-initialInvestment];

  for (let year = 1; year <= projectDuration; year++) {
    const revenue = annualRevenue * Math.pow(1 + revenueGrowthRate, year - 1);
    const expenses = annualExpenses * Math.pow(1 + expenseGrowthRate, year - 1);
    const netCashFlow = revenue - expenses;
    
    revenueProjections.push(revenue);
    expenseProjections.push(expenses);
    cashFlows.push(netCashFlow);
  }

  const npv = calculateNPV(cashFlows, discountRate);
  
  const irr = calculateIRR(cashFlows);
  
  const totalProfit = cashFlows.slice(1).reduce((sum, cf) => sum + cf, 0);
  const roi = (totalProfit / initialInvestment) * 100;
  
  const paybackPeriod = calculatePaybackPeriod(cashFlows);
  
  const profitabilityIndex = (npv + initialInvestment) / initialInvestment;
  
  const contributionMargin = pricePerUnit - variableCostPerUnit;
  const breakEvenUnits = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;
  const breakEvenPoint = breakEvenUnits * pricePerUnit;
  
  const bestCaseCashFlows = cashFlows.map((cf, i) => i === 0 ? cf : cf * 1.2);
  const worstCaseCashFlows = cashFlows.map((cf, i) => i === 0 ? cf : cf * 0.8);
  
  const sensitivityAnalysis = {
    bestCase: {
      npv: calculateNPV(bestCaseCashFlows, discountRate),
      irr: calculateIRR(bestCaseCashFlows),
      assumptions: "20% higher revenues than projected",
    },
    worstCase: {
      npv: calculateNPV(worstCaseCashFlows, discountRate),
      irr: calculateIRR(worstCaseCashFlows),
      assumptions: "20% lower revenues than projected",
    },
    baseCase: {
      npv,
      irr,
    },
  };

  return {
    npv,
    irr,
    roi,
    paybackPeriod,
    profitabilityIndex,
    breakEvenPoint,
    breakEvenUnits,
    capex: initialInvestment,
    opex: annualExpenses,
    revenueProjections,
    expenseProjections,
    cashFlows,
    sensitivityAnalysis,
  };
}

function calculateNPV(cashFlows: number[], discountRate: number): number {
  return cashFlows.reduce((npv, cf, i) => {
    return npv + cf / Math.pow(1 + discountRate, i);
  }, 0);
}

function calculateIRR(cashFlows: number[], guess: number = 0.1): number {
  const maxIterations = 100;
  const tolerance = 0.0001;
  let rate = guess;

  for (let i = 0; i < maxIterations; i++) {
    const npv = calculateNPV(cashFlows, rate);
    const derivative = cashFlows.reduce((sum, cf, j) => {
      return sum - j * cf / Math.pow(1 + rate, j + 1);
    }, 0);

    if (Math.abs(derivative) < 1e-10) break;

    const newRate = rate - npv / derivative;
    
    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100;
    }
    
    rate = newRate;
  }

  return rate * 100;
}

function calculatePaybackPeriod(cashFlows: number[]): number {
  let cumulativeCashFlow = 0;
  
  for (let i = 0; i < cashFlows.length; i++) {
    cumulativeCashFlow += cashFlows[i];
    
    if (cumulativeCashFlow >= 0) {
      if (i === 0) return 0;
      
      const previousCumulative = cumulativeCashFlow - cashFlows[i];
      const fraction = -previousCumulative / cashFlows[i];
      return i - 1 + fraction;
    }
  }
  
  return cashFlows.length;
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}
