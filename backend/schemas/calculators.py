from pydantic import BaseModel
from typing import List


# ── SIP ──────────────────────────────────────────────────────────────────────

class SipInput(BaseModel):
    monthlyInvestment: float
    annualReturnRate: float
    tenureYears: int


class SipResult(BaseModel):
    totalInvested: float
    estimatedReturns: float
    maturityValue: float


# ── EMI ──────────────────────────────────────────────────────────────────────

class EmiInput(BaseModel):
    principalAmount: float
    annualInterestRate: float
    tenureMonths: int


class AmortizationRow(BaseModel):
    month: int
    principal: float
    interest: float
    balance: float


class EmiResult(BaseModel):
    emi: float
    totalAmount: float
    totalInterest: float
    amortizationSchedule: List[AmortizationRow]


# ── Retirement ────────────────────────────────────────────────────────────────

class RetirementInput(BaseModel):
    currentAge: int
    retirementAge: int
    monthlyExpenses: float
    currentSavings: float
    expectedReturnRate: float
    inflationRate: float


class RetirementResult(BaseModel):
    corpusRequired: float
    monthlySavingsNeeded: float
    projectedCorpus: float
    yearsToRetirement: int


# ── CTC In-hand ───────────────────────────────────────────────────────────────

class CtcInhandInput(BaseModel):
    ctcAnnual: float
    pfContribution: float
    professionalTax: float
    otherDeductions: float


class BreakdownRow(BaseModel):
    label: str
    amount: float


class CtcInhandResult(BaseModel):
    grossMonthly: float
    deductions: float
    netMonthly: float
    annualTakeHome: float
    breakdown: List[BreakdownRow]


# ── Tax Regime ────────────────────────────────────────────────────────────────

class TaxRegimeInput(BaseModel):
    annualIncome: float
    hraReceived: float
    rentPaid: float
    section80c: float
    section80d: float
    otherDeductions: float


class SlabRow(BaseModel):
    slab: str
    tax: float


class TaxRegimeResult(BaseModel):
    oldRegimeTax: float
    newRegimeTax: float
    recommendation: str
    savings: float
    oldRegimeBreakdown: List[SlabRow]
    newRegimeBreakdown: List[SlabRow]
