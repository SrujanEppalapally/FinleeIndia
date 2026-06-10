from fastapi import APIRouter
from schemas.calculators import (
    SipInput, SipResult,
    EmiInput, EmiResult,
    RetirementInput, RetirementResult,
    CtcInhandInput, CtcInhandResult,
    TaxRegimeInput, TaxRegimeResult,
)
from services.calculator_service import (
    calc_sip, calc_emi, calc_retirement, calc_ctc_inhand, calc_tax_regime,
)

router = APIRouter(prefix="/calculators", tags=["calculators"])


@router.post("/sip", response_model=SipResult)
def sip(body: SipInput) -> SipResult:
    return calc_sip(body)


@router.post("/emi", response_model=EmiResult)
def emi(body: EmiInput) -> EmiResult:
    return calc_emi(body)


@router.post("/retirement", response_model=RetirementResult)
def retirement(body: RetirementInput) -> RetirementResult:
    return calc_retirement(body)


@router.post("/ctc-inhand", response_model=CtcInhandResult)
def ctc_inhand(body: CtcInhandInput) -> CtcInhandResult:
    return calc_ctc_inhand(body)


@router.post("/tax-regime", response_model=TaxRegimeResult)
def tax_regime(body: TaxRegimeInput) -> TaxRegimeResult:
    return calc_tax_regime(body)
