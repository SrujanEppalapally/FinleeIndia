import { useEffect } from 'react';
import { ArrowLeft, Calculator, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalcPanel, StepInput, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}

interface EmiResult { monthlyEmi: number; totalInterest: number; totalPayment: number; principalPct: number; interestPct: number; }

function calculateEmi(v: Record<string, string>): EmiResult | null {
  const P = parseFloat(v.loan), annual = parseFloat(v.rate), years = parseFloat(v.tenure);
  if (!P || !annual || !years || P <= 0 || annual <= 0 || years <= 0) return null;
  const r = annual / 12 / 100, n = years * 12;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n, totalInterest = totalPayment - P;
  return { monthlyEmi: Math.round(emi), totalInterest: Math.round(totalInterest), totalPayment: Math.round(totalPayment), principalPct: Math.round((P / totalPayment) * 100), interestPct: Math.round((totalInterest / totalPayment) * 100) };
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d]">{payload[0].name}</p>
      <p className="text-[#7a7974] mt-0.5">{formatINR(payload[0].value)}</p>
    </div>
  );
}

const DEFAULTS = { loan: '2000000', rate: '8.5', tenure: '20' };
const COLORS = ['#01696f', '#a12c7b'];

const STEPS: StepDef[] = [
  {
    question: 'Loan Amount',
    description: 'Total amount you are borrowing from the bank.',
    fields: ['loan'],
    fieldLabels: ['Loan Amount'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.loan} onChange={(val) => onChange('loan', val)} prefix="₹" placeholder="2000000" min={1} error={errors.loan} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (!v.loan || Number(v.loan) <= 0) errs.loan = 'Enter a valid loan amount';
      return errs;
    },
    formatReview: (v) => formatINR(parseFloat(v.loan || '0')),
  },
  {
    question: 'Annual Interest Rate',
    description: 'The yearly interest rate charged by the lender on your loan.',
    fields: ['rate'],
    fieldLabels: ['Interest Rate'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.rate} onChange={(val) => onChange('rate', val)} suffix="% per year" placeholder="8.5" min={1} max={36} error={errors.rate} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (!v.rate || Number(v.rate) <= 0) errs.rate = 'Enter a valid interest rate';
      return errs;
    },
    formatReview: (v) => `${v.rate}%`,
  },
  {
    question: 'Loan Tenure',
    description: 'How many years do you want to repay the loan?',
    fields: ['tenure'],
    fieldLabels: ['Loan Tenure'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.tenure} onChange={(val) => onChange('tenure', val)} suffix="years" placeholder="20" min={1} max={40} error={errors.tenure} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (!v.tenure || Number(v.tenure) <= 0 || Number(v.tenure) > 40) errs.tenure = 'Enter 1–40 years';
      return errs;
    },
    formatReview: (v) => `${v.tenure} years`,
  },
];

export function EmiCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calculateEmi(panel.values) : null;
  const pieData = result ? [{ name: 'Principal', value: parseFloat(panel.values.loan) }, { name: 'Interest', value: result.totalInterest }] : [];

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center"><Calculator className="w-5 h-5 text-[#b45309]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">EMI Calculator</h2><p className="text-xs text-[#7a7974]">Calculate your loan EMI and total interest</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Monthly EMI</p>
                <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.monthlyEmi)}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">Total Interest Paid</p><p className="text-base font-bold text-[#a12c7b]">{formatINR(result.totalInterest)}</p></div>
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">Total Payment</p><p className="text-base font-bold text-[#28251d]">{formatINR(result.totalPayment)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Principal vs Interest</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974' }} iconType="circle" iconSize={7} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                <div className="text-center"><p className="text-xs text-[#7a7974]">Principal</p><p className="text-sm font-semibold text-[#01696f]">{result.principalPct}%</p></div>
                <div className="text-center"><p className="text-xs text-[#7a7974]">Interest</p><p className="text-sm font-semibold text-[#a12c7b]">{result.interestPct}%</p></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Calculator className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Calculate your loan EMI</p><p className="text-xs text-[#7a7974] mt-1">Enter your loan details in 3 quick steps</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calculateEmi(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
