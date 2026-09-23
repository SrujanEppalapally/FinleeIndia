import { useEffect } from 'react';
import { ArrowLeft, Home, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CalcPanel, StepInput, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';
import { AddPlanAsGoalButton } from '../goals/GoalsPage';
import { monthsFromNow } from '../goals/goalsData';

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}
function fmtY(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_00_00_000) return `${(a / 1_00_00_000).toFixed(1)}Cr`;
  if (a >= 1_00_000) return `${(a / 1_00_000).toFixed(1)}L`;
  if (a >= 1_000) return `${(a / 1_000).toFixed(0)}K`;
  return String(a);
}

interface HouseResult {
  futurePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyEmi: number;
  sipNeeded: number;
  chartData: { year: number; price: number }[];
  verdict: 'achievable' | 'stretch' | 'revisit';
}

function calc(v: Record<string, string>): HouseResult | null {
  const cp = parseFloat(v.currentPrice), apr = parseFloat(v.appreciation) / 100;
  const yrs = parseInt(v.years, 10), dp = parseFloat(v.downPct) / 100;
  const lr = parseFloat(v.loanRate) / 12 / 100, lt = parseInt(v.loanTenure, 10) * 12;
  const age = parseInt(v.currentAge, 10);
  if (!cp || !apr || !yrs || !dp || !lr || !lt || isNaN(age)) return null;
  const futurePrice = cp * Math.pow(1 + apr, yrs);
  const downPayment = futurePrice * dp;
  const loanAmount = futurePrice - downPayment;
  const monthlyEmi = (loanAmount * lr * Math.pow(1 + lr, lt)) / (Math.pow(1 + lr, lt) - 1);
  const sr = 0.12 / 12, sn = yrs * 12;
  const sipNeeded = (downPayment * sr) / ((Math.pow(1 + sr, sn) - 1) * (1 + sr));
  const chartData = Array.from({ length: yrs + 1 }, (_, i) => ({ year: new Date().getFullYear() + i, price: Math.round(cp * Math.pow(1 + apr, i)) }));
  const verdict: HouseResult['verdict'] = dp >= 0.3 ? 'achievable' : dp >= 0.2 ? 'stretch' : 'revisit';
  return { futurePrice: Math.round(futurePrice), downPayment: Math.round(downPayment), loanAmount: Math.round(loanAmount), monthlyEmi: Math.round(monthlyEmi), sipNeeded: Math.round(sipNeeded), chartData, verdict };
}

const VERDICT_CFG = {
  achievable: { label: 'Achievable', cls: 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' },
  stretch: { label: 'Stretch', cls: 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20' },
  revisit: { label: 'Revisit Plan', cls: 'bg-[#a12c7b]/10 text-[#a12c7b] border-[#a12c7b]/20' },
};

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1">{label}</p>
      <p className="text-[#7a7974]">Price: <span className="font-medium text-[#28251d]">{formatINR(payload[0].value)}</span></p>
    </div>
  );
}

const DEFAULTS = { currentPrice: '5000000', appreciation: '7', years: '8', downPct: '20', loanRate: '8.5', loanTenure: '20', currentAge: '30' };

const STEPS: StepDef[] = [
  {
    question: 'Current House Price',
    description: 'The current market price of the house you want to buy.',
    fields: ['currentPrice'], fieldLabels: ['House Price'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.currentPrice} onChange={(val) => onChange('currentPrice', val)} prefix="₹" placeholder="5000000" min={1} error={errors.currentPrice} autoFocus />,
    validate: (v) => (!v.currentPrice || Number(v.currentPrice) <= 0) ? { currentPrice: 'Enter a valid house price' } : {},
    formatReview: (v) => formatINR(parseFloat(v.currentPrice || '0')),
  },
  {
    question: 'Annual Price Appreciation',
    description: 'Expected yearly increase in property prices in your area.',
    fields: ['appreciation'], fieldLabels: ['Appreciation'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.appreciation} onChange={(val) => onChange('appreciation', val)} suffix="% per year" placeholder="7" min={0} max={30} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.appreciation}% per year`,
  },
  {
    question: 'Years Until Purchase',
    description: 'How many years from now do you plan to buy the house?',
    fields: ['years'], fieldLabels: ['Years to Purchase'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.years} onChange={(val) => onChange('years', val)} suffix="years" placeholder="8" min={1} max={30} error={errors.years} autoFocus />,
    validate: (v) => (!v.years || Number(v.years) <= 0) ? { years: 'Enter years until purchase' } : {},
    formatReview: (v) => `${v.years} years`,
  },
  {
    question: 'Down Payment Percentage',
    description: 'What percentage of the future price will you pay upfront?',
    fields: ['downPct'], fieldLabels: ['Down Payment'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.downPct} onChange={(val) => onChange('downPct', val)} suffix="% of price" placeholder="20" min={0} max={100} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.downPct}%`,
  },
  {
    question: 'Loan Interest Rate',
    description: 'The annual interest rate on your home loan.',
    fields: ['loanRate'], fieldLabels: ['Loan Rate'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.loanRate} onChange={(val) => onChange('loanRate', val)} suffix="% per year" placeholder="8.5" min={1} max={20} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.loanRate}% per year`,
  },
  {
    question: 'Loan Tenure',
    description: 'How many years to repay the home loan?',
    fields: ['loanTenure'], fieldLabels: ['Loan Tenure'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.loanTenure} onChange={(val) => onChange('loanTenure', val)} suffix="years" placeholder="20" min={1} max={30} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.loanTenure} years`,
  },
  {
    question: 'Your Current Age',
    description: 'Used to compute your age at time of purchase.',
    fields: ['currentAge'], fieldLabels: ['Current Age'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.currentAge} onChange={(val) => onChange('currentAge', val)} suffix="years old" placeholder="30" min={18} max={70} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.currentAge} years old`,
  },
];

export function DreamHouseCalculatorPage() {
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
          <div className="w-9 h-9 rounded-full bg-[#0e7490]/10 flex items-center justify-center"><Home className="w-5 h-5 text-[#0e7490]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Dream House Calculator</h2><p className="text-xs text-[#7a7974]">Future price, EMI, and SIP needed for your home</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${VERDICT_CFG[result.verdict].cls}`}>{VERDICT_CFG[result.verdict].label}</span>
              </div>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Monthly EMI</p>
                <p className="text-4xl font-bold text-[#28251d]">{formatINR(result.monthlyEmi)}</p>
              </div>
              {[
                { label: 'Future House Price', value: formatINR(result.futurePrice) },
                { label: 'Down Payment Needed', value: formatINR(result.downPayment), color: 'text-[#b45309]' },
                { label: 'Loan Amount', value: formatINR(result.loanAmount) },
                { label: 'Monthly SIP Needed Now (for down payment)', value: formatINR(result.sipNeeded), color: 'text-[#437a22]' },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#f7f6f2] last:border-0">
                  <span className="text-sm text-[#7a7974]">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color ?? 'text-[#28251d]'}`}>{row.value}</span>
                </div>
              ))}
              <p className="text-[11px] text-[#7a7974] pt-1">SIP assumes 12% annual return. EMI calculated on loan at stated rate.</p>
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">House Price Inflation</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="houseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0e7490" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0e7490" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                  <Tooltip content={<ChartTip />} />
                  <Area type="monotone" dataKey="price" name="Price" stroke="#0e7490" strokeWidth={2} fill="url(#houseGrad)" dot={false} activeDot={{ r: 4, fill: '#0e7490' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <AddPlanAsGoalButton prefill={{
              name: 'Dream House',
              type: 'house',
              targetAmount: result.futurePrice,
              targetDate: monthsFromNow(parseInt(panel.values.years, 10) * 12),
              savedAmount: 0,
              monthlyContribution: result.sipNeeded,
              linkedCalculator: '/calculators/dream-house',
              linkedCalculatorName: 'Dream House Calculator',
            }} />
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Home className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Plan your dream home purchase</p><p className="text-xs text-[#7a7974] mt-1">7 quick questions to see future price and EMI</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
