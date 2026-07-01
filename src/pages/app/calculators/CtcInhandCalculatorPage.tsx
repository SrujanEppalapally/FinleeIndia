import { useEffect } from 'react';
import { ArrowLeft, IndianRupee, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { CalcPanel, StepInput, OptionCards, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}
function formatRs(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function calcOldRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) { tax = (taxableIncome - 250000) * 0.05; }
  else if (taxableIncome <= 1000000) { tax = 12500 + (taxableIncome - 500000) * 0.2; }
  else { tax = 112500 + (taxableIncome - 1000000) * 0.3; }
  if (taxableIncome <= 500000) tax = 0;
  return tax + tax * 0.04;
}

function calcNewRegimeTax(taxableIncome: number): number {
  let tax = 0;
  const slabs = [[300000, 0], [700000, 0.05], [1000000, 0.1], [1200000, 0.15], [1500000, 0.2], [Infinity, 0.3]] as [number, number][];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, limit) - prev) * rate;
    prev = limit;
  }
  if (taxableIncome <= 700000) tax = 0;
  return tax + tax * 0.04;
}

interface CtcResult {
  annualCtc: number;
  annualBasic: number;
  monthlyBasic: number;
  monthlyHra: number;
  monthlyPf: number;
  monthlyGross: number;
  monthlyProfTax: number;
  monthlyTax: number;
  monthlyInHand: number;
  hraExemption: number;
  regime: 'old' | 'new';
}

function calc(v: Record<string, string>): CtcResult | null {
  const annualCtc = parseFloat(v.ctc);
  if (!annualCtc || annualCtc <= 0) return null;
  const basicFraction = parseFloat(v.basicPct) / 100;
  const hraFraction = parseFloat(v.hraPct) / 100;
  const pfFraction = parseFloat(v.pfPct) / 100;
  const profTaxMonthly = parseFloat(v.profTax);
  const annualBasic = annualCtc * basicFraction;
  const monthlyBasic = annualBasic / 12;
  const monthlyHra = monthlyBasic * hraFraction;
  const monthlyPf = monthlyBasic * pfFraction;
  const monthlyGross = annualCtc / 12;
  const rentFraction = v.city === 'metro' ? 0.5 : 0.4;
  const hraExemption = Math.min(monthlyHra, monthlyBasic * rentFraction, monthlyHra);
  const annualPf = monthlyPf * 12;
  const regime = v.regime as 'old' | 'new';
  const annualStdDed = regime === 'old' ? 50000 : 75000;
  const annualHraExemption = regime === 'old' ? hraExemption * 12 : 0;
  const grossIncome = annualCtc - annualPf;
  const taxableIncome = Math.max(0, grossIncome - annualStdDed - annualHraExemption);
  const annualTax = regime === 'old' ? calcOldRegimeTax(taxableIncome) : calcNewRegimeTax(taxableIncome);
  const monthlyTax = annualTax / 12;
  const monthlyInHand = monthlyGross - monthlyPf - profTaxMonthly - monthlyTax;
  return { annualCtc, annualBasic, monthlyBasic, monthlyHra, monthlyPf, monthlyGross, monthlyProfTax: profTaxMonthly, monthlyTax, monthlyInHand, hraExemption, regime };
}

const CITY_OPTIONS = [
  { value: 'metro', label: 'Metro', description: 'Mumbai / Delhi / Kolkata / Chennai' },
  { value: 'non-metro', label: 'Non-Metro', description: 'All other cities' },
];
const REGIME_OPTIONS = [
  { value: 'new', label: 'New Regime', description: '₹75K std. deduction, lower slabs' },
  { value: 'old', label: 'Old Regime', description: '₹50K std. deduction + 80C/HRA/etc.' },
];

const DEFAULTS = { ctc: '1200000', basicPct: '40', hraPct: '50', pfPct: '12', city: 'metro', profTax: '200', regime: 'new' };

const STEPS: StepDef[] = [
  {
    question: 'Annual CTC',
    description: 'Your Cost to Company — the total package offered by your employer.',
    fields: ['ctc'], fieldLabels: ['Annual CTC'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.ctc} onChange={(val) => onChange('ctc', val)} prefix="₹" placeholder="1200000" min={1} error={errors.ctc} autoFocus />,
    validate: (v) => (!v.ctc || Number(v.ctc) <= 0) ? { ctc: 'Enter your annual CTC' } : {},
    formatReview: (v) => formatINR(parseFloat(v.ctc || '0')),
  },
  {
    question: 'Basic Salary %',
    description: 'Basic salary as a percentage of your CTC (typically 40–50%).',
    fields: ['basicPct'], fieldLabels: ['Basic %'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.basicPct} onChange={(val) => onChange('basicPct', val)} suffix="% of CTC" placeholder="40" min={20} max={80} error={errors.basicPct} autoFocus />,
    validate: (v) => {
      const n = Number(v.basicPct);
      return (n < 20 || n > 80) ? { basicPct: 'Enter 20–80%' } : {};
    },
    formatReview: (v) => `${v.basicPct}% of CTC`,
  },
  {
    question: 'HRA % of Basic',
    description: 'House Rent Allowance as a percentage of basic salary.',
    fields: ['hraPct'], fieldLabels: ['HRA %'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.hraPct} onChange={(val) => onChange('hraPct', val)} suffix="% of basic" placeholder="50" min={0} max={100} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.hraPct}% of basic`,
  },
  {
    question: 'City Type',
    description: 'Metro cities have higher HRA exemption limits (50% vs 40%).',
    fields: ['city'], fieldLabels: ['City'],
    renderInput: ({ values: v, onChange }) => <OptionCards<string> options={CITY_OPTIONS} value={v.city} onChange={(val) => onChange('city', val)} />,
    validate: () => ({}),
    formatReview: (v) => v.city === 'metro' ? 'Metro city' : 'Non-metro city',
  },
  {
    question: 'PF % of Basic',
    description: 'Employee Provident Fund contribution (typically 12%).',
    fields: ['pfPct'], fieldLabels: ['PF %'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.pfPct} onChange={(val) => onChange('pfPct', val)} suffix="% of basic" placeholder="12" min={0} max={20} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.pfPct}% of basic`,
  },
  {
    question: 'Professional Tax',
    description: 'Monthly professional tax deducted by your employer (state-specific).',
    fields: ['profTax'], fieldLabels: ['Professional Tax'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.profTax} onChange={(val) => onChange('profTax', val)} prefix="₹" suffix="/month" placeholder="200" min={0} max={2500} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `₹${v.profTax}/month`,
  },
  {
    question: 'Income Tax Regime',
    description: 'Choose the tax regime to calculate your in-hand salary.',
    fields: ['regime'], fieldLabels: ['Tax Regime'],
    renderInput: ({ values: v, onChange }) => <OptionCards<string> options={REGIME_OPTIONS} value={v.regime} onChange={(val) => onChange('regime', val)} />,
    validate: () => ({}),
    formatReview: (v) => v.regime === 'new' ? 'New Regime' : 'Old Regime',
  },
];

export function CtcInhandCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calc(panel.values) : null;

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0e7490]/10 flex items-center justify-center"><IndianRupee className="w-5 h-5 text-[#0e7490]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">CTC → In-Hand</h2><p className="text-xs text-[#7a7974]">Calculate your actual monthly take-home salary</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Monthly In-Hand Salary</p>
                <p className="text-3xl font-bold text-[#437a22]">{formatRs(result.monthlyInHand)}</p>
                <p className="text-xs text-[#7a7974] mt-1">Annual: {formatINR(result.monthlyInHand * 12)}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly Gross</p><p className="text-sm font-bold text-[#28251d]">{formatRs(result.monthlyGross)}</p></div>
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly Basic</p><p className="text-sm font-bold text-[#28251d]">{formatRs(result.monthlyBasic)}</p></div>
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">HRA</p><p className="text-sm font-bold text-[#28251d]">{formatRs(result.monthlyHra)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-3">Monthly Deductions Breakdown</p>
              <div className="divide-y divide-[#f0ede6]">
                <div className="flex justify-between py-2.5"><span className="text-sm text-[#28251d]">Monthly Gross</span><span className="text-sm font-semibold text-[#28251d]">{formatRs(result.monthlyGross)}</span></div>
                {[
                  { label: 'Employee PF', value: result.monthlyPf },
                  { label: 'Professional Tax', value: result.monthlyProfTax },
                  { label: 'Income Tax (monthly)', value: result.monthlyTax },
                ].map((d) => (
                  <div key={d.label} className="flex justify-between py-2.5">
                    <span className="text-sm text-[#7a7974]">- {d.label}</span>
                    <span className="text-sm font-medium text-[#a12c7b]">{formatRs(d.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 bg-[#f7f6f2] -mx-5 px-5">
                  <span className="text-sm font-bold text-[#28251d]">Monthly In-Hand</span>
                  <span className="text-sm font-bold text-[#437a22]">{formatRs(result.monthlyInHand)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#7a7974] mt-3">{result.regime === 'old' ? 'Old Regime' : 'New Regime'} · Standard deduction ₹{result.regime === 'old' ? '50,000' : '75,000'}/yr applied</p>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <IndianRupee className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Calculate your take-home salary</p><p className="text-xs text-[#7a7974] mt-1">7 questions to see your actual in-hand pay</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
