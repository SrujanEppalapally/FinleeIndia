import { useEffect } from 'react';
import { ArrowLeft, Flame, RefreshCw, RotateCcw, TrendingUp, Brain, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
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

interface FireResult {
  fireNumber: number;
  projectedCorpus: number;
  investmentRequired: number;
  sipNeeded: number;
  yearsToFire: number;
  onTrack: boolean;
  shortfall: number;
  chartData: { age: number; corpus: number; fireNumber: number }[];
  fireAgeLabel: number;
}

function calc(v: Record<string, string>): FireResult | null {
  const age = parseInt(v.age, 10);
  const fireAge = parseInt(v.fireAge, 10);
  const annualExpenses = parseFloat(v.annualExpenses);
  const currentInvestment = parseFloat(v.currentInvestment || '0');
  const ret = parseFloat(v.returnRate) / 100;
  if (!age || !fireAge || !annualExpenses || fireAge <= age) return null;

  const years = fireAge - age;
  const annualExpAtRetirement = annualExpenses * Math.pow(1.06, years);
  const fireNumber = annualExpAtRetirement / 0.04;
  const projectedCorpus = currentInvestment * Math.pow(1 + ret, years);
  const investmentRequired = Math.max(0, fireNumber - projectedCorpus);

  const r = ret / 12;
  const n = years * 12;
  const sipNeeded = investmentRequired > 0
    ? Math.round((investmentRequired * r) / (Math.pow(1 + r, n) - 1) / (1 + r))
    : 0;

  const onTrack = projectedCorpus >= fireNumber;
  const shortfall = Math.max(0, fireNumber - projectedCorpus);

  const chartData: { age: number; corpus: number; fireNumber: number }[] = [];
  for (let y = 0; y <= Math.min(years + 5, 50); y++) {
    const curAge = age + y;
    const corpus = Math.round(currentInvestment * Math.pow(1 + ret, y));
    const fn = Math.round(annualExpenses * Math.pow(1.06, y) / 0.04);
    chartData.push({ age: curAge, corpus, fireNumber: fn });
  }

  return { fireNumber: Math.round(fireNumber), projectedCorpus: Math.round(projectedCorpus), investmentRequired: Math.round(investmentRequired), sipNeeded, yearsToFire: years, onTrack, shortfall: Math.round(shortfall), chartData, fireAgeLabel: fireAge };
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card p-3 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">Age {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#7a7974]">{p.name}:</span>
          <span className="font-medium text-[#28251d]">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

const DEFAULTS = { age: '28', annualIncome: '1200000', salaryGrowth: '8', annualExpenses: '600000', currentInvestment: '0', fireAge: '45', returnRate: '10' };

const STEPS: StepDef[] = [
  {
    question: 'Your Current Age',
    description: 'How old are you today?',
    fields: ['age'], fieldLabels: ['Current Age'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.age} onChange={(val) => onChange('age', val)} suffix="years old" placeholder="28" min={18} max={70} error={errors.age} autoFocus />,
    validate: (v) => (!v.age || Number(v.age) < 18) ? { age: 'Enter age 18+' } : {},
    formatReview: (v) => `${v.age} years old`,
  },
  {
    question: 'Annual Income',
    description: 'Your current annual income or CTC.',
    fields: ['annualIncome'], fieldLabels: ['Annual Income'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.annualIncome} onChange={(val) => onChange('annualIncome', val)} prefix="₹" placeholder="1200000" min={1} error={errors.annualIncome} autoFocus />,
    validate: (v) => (!v.annualIncome || Number(v.annualIncome) <= 0) ? { annualIncome: 'Enter your annual income' } : {},
    formatReview: (v) => formatINR(parseFloat(v.annualIncome || '0')),
  },
  {
    question: 'Expected Salary Growth',
    description: 'Annual percentage increase in your income.',
    fields: ['salaryGrowth'], fieldLabels: ['Salary Growth'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.salaryGrowth} onChange={(val) => onChange('salaryGrowth', val)} suffix="% per year" placeholder="8" min={0} max={50} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.salaryGrowth}% per year`,
  },
  {
    question: 'Annual Living Expenses',
    description: 'Your current total annual expenses (all spending).',
    fields: ['annualExpenses'], fieldLabels: ['Annual Expenses'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.annualExpenses} onChange={(val) => onChange('annualExpenses', val)} prefix="₹" placeholder="600000" min={1} error={errors.annualExpenses} autoFocus />,
    validate: (v) => (!v.annualExpenses || Number(v.annualExpenses) <= 0) ? { annualExpenses: 'Enter your annual expenses' } : {},
    formatReview: (v) => formatINR(parseFloat(v.annualExpenses || '0')),
  },
  {
    question: 'Current Investments / Corpus',
    description: 'Total wealth you have already invested today.',
    fields: ['currentInvestment'], fieldLabels: ['Current Investment'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.currentInvestment} onChange={(val) => onChange('currentInvestment', val)} prefix="₹" placeholder="0" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.currentInvestment || '0')),
  },
  {
    question: 'Target FIRE Age',
    description: 'The age at which you want to achieve financial independence.',
    fields: ['fireAge'], fieldLabels: ['FIRE Age'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.fireAge} onChange={(val) => onChange('fireAge', val)} suffix="years old" placeholder="45" min={Number(v.age) + 1} max={80} error={errors.fireAge} autoFocus />,
    validate: (v) => {
      if (!v.fireAge) return { fireAge: 'Enter your FIRE age' };
      if (Number(v.fireAge) <= Number(v.age)) return { fireAge: 'Must be greater than your current age' };
      if (Number(v.fireAge) > 80) return { fireAge: 'Maximum FIRE age is 80' };
      return {};
    },
    formatReview: (v) => `Age ${v.fireAge}`,
  },
  {
    question: 'Expected Investment Return',
    description: 'Annual return rate you expect from your portfolio.',
    fields: ['returnRate'], fieldLabels: ['Return Rate'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.returnRate} onChange={(val) => onChange('returnRate', val)} suffix="% per year" placeholder="10" min={1} max={30} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.returnRate}% per year`,
  },
];

const PRINCIPLES = [
  { icon: PiggyBank, color: '#01696f', title: 'Save 50–70% of Income', desc: 'The more aggressively you save, the sooner you reach FIRE. High savings rate is the biggest lever.' },
  { icon: Brain, color: '#437a22', title: 'Spend Wisely', desc: 'Track every rupee. Cut lifestyle inflation. Your FIRE Number is 25× your annual expenses — lower it.' },
  { icon: TrendingUp, color: '#b45309', title: 'Invest Consistently', desc: 'Stay invested in equity long-term. Time in market beats timing the market. Compound works silently.' },
];

export function FireCalculatorPage() {
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
          <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center"><Flame className="w-5 h-5 text-[#b45309]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">FIRE Calculator</h2><p className="text-xs text-[#7a7974]">Financial Independence, Retire Early</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            {/* Status card */}
            <div className={`rounded-[8px] p-4 border ${result.onTrack ? 'bg-[#437a22]/8 border-[#437a22]/20' : 'bg-[#a12c7b]/8 border-[#a12c7b]/20'}`}>
              <p className={`text-sm font-bold ${result.onTrack ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                {result.onTrack ? 'You are on track for FIRE!' : 'You need to invest more to reach FIRE'}
              </p>
              {!result.onTrack && (
                <p className={`text-xs mt-1 text-[#a12c7b]`}>
                  Shortfall: <strong>{formatINR(result.shortfall)}</strong> — SIP needed: <strong>{formatINR(result.sipNeeded)}/month</strong>
                </p>
              )}
            </div>
            {/* FIRE Number */}
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-1">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-2">Results</p>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">FIRE Number (Corpus Needed)</p>
                <p className="text-4xl font-bold text-[#28251d]">{formatINR(result.fireNumber)}</p>
              </div>
              {[
                { label: 'Projected Corpus at FIRE Age', value: formatINR(result.projectedCorpus), color: result.onTrack ? 'text-[#437a22]' : 'text-[#28251d]' },
                { label: 'Years to FIRE', value: `${result.yearsToFire} years` },
                { label: result.onTrack ? 'Surplus Corpus' : 'Investment Required', value: formatINR(result.onTrack ? result.projectedCorpus - result.fireNumber : result.investmentRequired), color: result.onTrack ? 'text-[#437a22]' : 'text-[#a12c7b]' },
                ...(!result.onTrack ? [{ label: 'Monthly SIP Needed', value: formatINR(result.sipNeeded), color: 'text-[#b45309]' }] : []),
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#f7f6f2] last:border-0">
                  <span className="text-sm text-[#7a7974]">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color ?? 'text-[#28251d]'}`}>{row.value}</span>
                </div>
              ))}
            </div>
            {/* Chart */}
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Corpus vs FIRE Number</p>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                  <ReferenceLine x={result.fireAgeLabel} stroke="#437a22" strokeDasharray="5 3" label={{ value: `FIRE at ${result.fireAgeLabel}`, position: 'top', fontSize: 10, fill: '#437a22' }} />
                  <Line type="monotone" dataKey="corpus" name="Your Corpus" stroke="#01696f" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
                  <Line type="monotone" dataKey="fireNumber" name="FIRE Target" stroke="#b45309" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3, fill: '#b45309' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* 3 Principles */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">3 FIRE Principles</p>
              {PRINCIPLES.map((p) => (
                <div key={p.title} className="bg-white rounded-[8px] shadow-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${p.color}18` }}>
                    <p.icon className="w-4 h-4" style={{ color: p.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#28251d]">{p.title}</p>
                    <p className="text-xs text-[#7a7974] mt-0.5 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <AddPlanAsGoalButton prefill={{
              name: 'FIRE',
              type: 'fire',
              targetAmount: result.fireNumber,
              targetDate: monthsFromNow(result.yearsToFire * 12),
              savedAmount: parseFloat(panel.values.currentInvestment || '0'),
              monthlyContribution: result.sipNeeded,
              linkedCalculator: '/calculators/fire',
              linkedCalculatorName: 'FIRE Calculator',
            }} />
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Flame className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Plan your Financial Independence</p><p className="text-xs text-[#7a7974] mt-1">7 quick questions to find your FIRE number</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
