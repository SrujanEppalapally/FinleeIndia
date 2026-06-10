import math
from schemas.calculators import (
    SipInput, SipResult,
    EmiInput, EmiResult, AmortizationRow,
    RetirementInput, RetirementResult,
    CtcInhandInput, CtcInhandResult, BreakdownRow,
    TaxRegimeInput, TaxRegimeResult, SlabRow,
)


def calc_sip(inp: SipInput) -> SipResult:
    p = inp.monthlyInvestment
    r = inp.annualReturnRate / 100 / 12
    n = inp.tenureYears * 12
    if r == 0:
        maturity = p * n
    else:
        maturity = p * ((math.pow(1 + r, n) - 1) / r) * (1 + r)
    invested = p * n
    return SipResult(
        totalInvested=round(invested, 2),
        estimatedReturns=round(maturity - invested, 2),
        maturityValue=round(maturity, 2),
    )


def calc_emi(inp: EmiInput) -> EmiResult:
    p = inp.principalAmount
    r = inp.annualInterestRate / 100 / 12
    n = inp.tenureMonths
    if r == 0:
        emi = p / n
    else:
        emi = p * r * math.pow(1 + r, n) / (math.pow(1 + r, n) - 1)

    schedule: list[AmortizationRow] = []
    balance = p
    for month in range(1, n + 1):
        interest = balance * r
        principal = emi - interest
        balance = max(0.0, balance - principal)
        schedule.append(AmortizationRow(
            month=month,
            principal=round(principal, 2),
            interest=round(interest, 2),
            balance=round(balance, 2),
        ))

    total = emi * n
    return EmiResult(
        emi=round(emi, 2),
        totalAmount=round(total, 2),
        totalInterest=round(total - p, 2),
        amortizationSchedule=schedule,
    )


def calc_retirement(inp: RetirementInput) -> RetirementResult:
    years = inp.retirementAge - inp.currentAge
    if years <= 0:
        return RetirementResult(corpusRequired=0, monthlySavingsNeeded=0, projectedCorpus=0, yearsToRetirement=0)

    monthly_exp_at_retirement = inp.monthlyExpenses * math.pow(1 + inp.inflationRate / 100, years)
    # Corpus needed to sustain expenses for 25 years post-retirement (4% SWR)
    corpus_required = monthly_exp_at_retirement * 12 * 25

    r = inp.expectedReturnRate / 100 / 12
    n = years * 12
    fv_savings = inp.currentSavings * math.pow(1 + r, n)
    remaining = max(0.0, corpus_required - fv_savings)

    if r == 0:
        monthly_needed = remaining / n if n > 0 else 0
    else:
        monthly_needed = remaining * r / (math.pow(1 + r, n) - 1)

    # Projected corpus with monthly_needed SIP
    if r == 0:
        projected = fv_savings + monthly_needed * n
    else:
        projected = fv_savings + monthly_needed * ((math.pow(1 + r, n) - 1) / r) * (1 + r)

    return RetirementResult(
        corpusRequired=round(corpus_required, 2),
        monthlySavingsNeeded=round(monthly_needed, 2),
        projectedCorpus=round(projected, 2),
        yearsToRetirement=years,
    )


def calc_ctc_inhand(inp: CtcInhandInput) -> CtcInhandResult:
    gross_monthly = inp.ctcAnnual / 12
    pf = inp.pfContribution
    pt = inp.professionalTax
    other = inp.otherDeductions
    total_deductions = pf + pt + other
    net_monthly = gross_monthly - total_deductions
    annual_take_home = net_monthly * 12

    breakdown = [
        BreakdownRow(label="Gross Monthly", amount=round(gross_monthly, 2)),
        BreakdownRow(label="PF Contribution", amount=round(pf, 2)),
        BreakdownRow(label="Professional Tax", amount=round(pt, 2)),
        BreakdownRow(label="Other Deductions", amount=round(other, 2)),
        BreakdownRow(label="Net In-Hand", amount=round(net_monthly, 2)),
    ]

    return CtcInhandResult(
        grossMonthly=round(gross_monthly, 2),
        deductions=round(total_deductions, 2),
        netMonthly=round(net_monthly, 2),
        annualTakeHome=round(annual_take_home, 2),
        breakdown=breakdown,
    )


def _old_regime_tax(taxable: float) -> tuple[float, list[SlabRow]]:
    slabs = [
        (250_000, 0.0, "Up to ₹2.5L"),
        (250_000, 0.05, "₹2.5L–₹5L"),
        (500_000, 0.20, "₹5L–₹10L"),
        (float("inf"), 0.30, "Above ₹10L"),
    ]
    tax = 0.0
    rows: list[SlabRow] = []
    remaining = taxable
    for limit, rate, label in slabs:
        chunk = min(remaining, limit)
        slab_tax = chunk * rate
        rows.append(SlabRow(slab=label, tax=round(slab_tax, 2)))
        tax += slab_tax
        remaining -= chunk
        if remaining <= 0:
            break
    return tax, rows


def _new_regime_tax(income: float) -> tuple[float, list[SlabRow]]:
    slabs = [
        (300_000, 0.0, "Up to ₹3L"),
        (300_000, 0.05, "₹3L–₹6L"),
        (300_000, 0.10, "₹6L–₹9L"),
        (300_000, 0.15, "₹9L–₹12L"),
        (300_000, 0.20, "₹12L–₹15L"),
        (float("inf"), 0.30, "Above ₹15L"),
    ]
    tax = 0.0
    rows: list[SlabRow] = []
    remaining = income
    for limit, rate, label in slabs:
        chunk = min(remaining, limit)
        slab_tax = chunk * rate
        rows.append(SlabRow(slab=label, tax=round(slab_tax, 2)))
        tax += slab_tax
        remaining -= chunk
        if remaining <= 0:
            break
    return tax, rows


def calc_tax_regime(inp: TaxRegimeInput) -> TaxRegimeResult:
    income = inp.annualIncome
    std_deduction = 50_000

    # Old regime: apply all deductions
    hra_exemption = min(inp.hraReceived, inp.rentPaid - 0.1 * income, 0.4 * income)
    hra_exemption = max(0.0, hra_exemption)
    old_taxable = max(
        0.0,
        income
        - std_deduction
        - hra_exemption
        - min(inp.section80c, 150_000)
        - min(inp.section80d, 25_000)
        - inp.otherDeductions,
    )
    old_tax, old_breakdown = _old_regime_tax(old_taxable)

    # New regime: only standard deduction
    new_taxable = max(0.0, income - 75_000)  # new std deduction FY2024-25
    new_tax, new_breakdown = _new_regime_tax(new_taxable)

    # 4% health & education cess
    old_tax *= 1.04
    new_tax *= 1.04

    recommendation: str = "old" if old_tax < new_tax else "new"
    savings = abs(old_tax - new_tax)

    return TaxRegimeResult(
        oldRegimeTax=round(old_tax, 2),
        newRegimeTax=round(new_tax, 2),
        recommendation=recommendation,
        savings=round(savings, 2),
        oldRegimeBreakdown=old_breakdown,
        newRegimeBreakdown=new_breakdown,
    )
