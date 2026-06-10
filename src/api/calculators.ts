import apiClient from './client';

// ── SIP ────────────────────────────────────────────────────────

export interface SipInput {
  monthlyInvestment: number;
  annualReturnRate: number;
  tenureYears: number;
}

export interface SipResult {
  totalInvested: number;
  estimatedReturns: number;
  maturityValue: number;
}

export async function sip(input: SipInput): Promise<SipResult> {
  const { data } = await apiClient.post<SipResult>('/calculators/sip', input);
  return data;
}

// ── EMI ────────────────────────────────────────────────────────

export interface EmiInput {
  principalAmount: number;
  annualInterestRate: number;
  tenureMonths: number;
}

export interface EmiResult {
  emi: number;
  totalAmount: number;
  totalInterest: number;
  amortizationSchedule: Array<{
    month: number;
    principal: number;
    interest: number;
    balance: number;
  }>;
}

export async function emi(input: EmiInput): Promise<EmiResult> {
  const { data } = await apiClient.post<EmiResult>('/calculators/emi', input);
  return data;
}

// ── Retirement ─────────────────────────────────────────────────

export interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  monthlyExpenses: number;
  currentSavings: number;
  expectedReturnRate: number;
  inflationRate: number;
}

export interface RetirementResult {
  corpusRequired: number;
  monthlySavingsNeeded: number;
  projectedCorpus: number;
  yearsToRetirement: number;
}

export async function retirement(input: RetirementInput): Promise<RetirementResult> {
  const { data } = await apiClient.post<RetirementResult>('/calculators/retirement', input);
  return data;
}

// ── CTC In-hand ────────────────────────────────────────────────

export interface CtcInhandInput {
  ctcAnnual: number;
  pfContribution: number;
  professionalTax: number;
  otherDeductions: number;
}

export interface CtcInhandResult {
  grossMonthly: number;
  deductions: number;
  netMonthly: number;
  annualTakeHome: number;
  breakdown: Array<{ label: string; amount: number }>;
}

export async function ctcInhand(input: CtcInhandInput): Promise<CtcInhandResult> {
  const { data } = await apiClient.post<CtcInhandResult>('/calculators/ctc-inhand', input);
  return data;
}

// ── Tax Regime ─────────────────────────────────────────────────

export interface TaxRegimeInput {
  annualIncome: number;
  hraReceived: number;
  rentPaid: number;
  section80c: number;
  section80d: number;
  otherDeductions: number;
}

export interface TaxRegimeResult {
  oldRegimeTax: number;
  newRegimeTax: number;
  recommendation: 'old' | 'new';
  savings: number;
  oldRegimeBreakdown: Array<{ slab: string; tax: number }>;
  newRegimeBreakdown: Array<{ slab: string; tax: number }>;
}

export async function taxRegime(input: TaxRegimeInput): Promise<TaxRegimeResult> {
  const { data } = await apiClient.post<TaxRegimeResult>('/calculators/tax-regime', input);
  return data;
}
