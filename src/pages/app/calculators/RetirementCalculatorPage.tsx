import { useEffect } from 'react';
import { ArrowLeft, Sunset, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
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

interface RetirementResult {
  corpusNeeded: number;
  monthlySipRequired: number;
  yearsToRetirement: number;
  depletionData: Array<{ age: number; corpus: number }>;
  depletionAge: number | null;
}

function calculateRetirement(v: Record<string, string>): RetirementResult | null {
  const ca = parseInt(v.currentAge, 10), ra = parseInt(v.retirementAge, 10);
  const me = parseFloat(v.monthlyExpenses), inf = parseFloat(v.inflationRate) / 100;
  const ret = parseFloat(v.postReturn) / 100, cs = parseFloat(v.currentSavings || '0');
  if (!ca || !ra || !me || ra <= ca) return null;
  const yearsToRetirement = ra - ca;
  const monthlyExpAtRetirement = me * Math.pow(1 + inf, yearsToRetirement);
  const annualExpAtRetirement = monthlyExpAtRetirement * 12;
  const retirementYears = 85 - ra;
  const realRate = (1 + ret) / (1 + inf) - 1;
  let corpusNeeded = realRate <= 0
    ? annualExpAtRetirement * retirementYears
    : annualExpAtRetirement * ((1 - Math.pow(1 + realRate, -retirementYears)) / realRate);
  corpusNeeded = Math.round(corpusNeeded);
  const r = 0.12 / 12, n = yearsToRetirement * 12;
  const futureValueOfSavings = cs * Math.pow(1 + 0.12 / 12, n);
  const corpusFromSip = Math.max(0, corpusNeeded - futureValueOfSavings);
  const monthlySipRequired = corpusFromSip > 0 ? Math.round((corpusFromSip * r) / (Math.pow(1 + r, n) - 1) / (1 + r)) : 0;
  const depletionData: Array<{ age: number; corpus: number }> = [];
  let corpus = corpusNeeded, depletionAge: number | null = null;
  for (let y = 0; y <= retirementYears; y++) {
    const age = ra + y;
    depletionData.push({ age, corpus: Math.max(0, Math.round(corpus)) });
    if (corpus <= 0 && depletionAge === null) depletionAge = age;
    const expThisYear = monthlyExpAtRetirement * Math.pow(1 + inf, y) * 12;
    corpus = corpus * (1 + ret) - expThisYear;
  }
  return { corpusNeeded, monthlySipRequired, yearsToRetirement, depletionData, depletionAge };
}

function LineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1">Age {label}</p>
      <p className="text-[#7a7974]">Corpus: <span className="font-medium text-[#28251d]">{formatINR(payload[0].value)}</span></p>
    </div>
  );
}

const DEFAULTS = { currentAge: '30', retirementAge: '60', monthlyExpenses: '50000', inflationRate: '6', postReturn: '7', currentSavings: '0' };

const STEPS: StepDef[] = [
  {
    question: 'Your Current Age',
    description: 'How old are you today?',
    fields: ['currentAge'], fieldLabels: ['Current Age'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.currentAge} onChange={(val) => onChange('currentAge', val)} suffix="years old" placeholder="30" min={18} max={80} error={errors.currentAge} autoFocus />,
    validate: (v) => {
      const ca = parseInt(v.currentAge, 10);
      if (!v.currentAge || ca < 18 || ca > 80) return { currentAge: 'Enter age 18–80' };
      return {};
    },
    formatReview: (v) => `${v.currentAge} years old`,
  },
  {
    question: 'Retirement Age',
    description: 'At what age do you plan to retire?',
    fields: ['retirementAge'], fieldLabels: ['Retirement Age'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.retirementAge} onChange={(val) => onChange('retirementAge', val)} suffix="years old" placeholder="60" min={Number(v.currentAge) + 1} max={85} error={errors.retirementAge} autoFocus />,
    validate: (v) => {
      if (!v.retirementAge || Number(v.retirementAge) <= Number(v.currentAge)) return { retirementAge: 'Must be greater than current age' };
      return {};
    },
    formatReview: (v) => `Age ${v.retirementAge}`,
  },
  {
    question: 'Monthly Expenses Today',
    description: 'Your current monthly spending — this will be inflation-adjusted.',
    fields: ['monthlyExpenses'], fieldLabels: ['Monthly Expenses'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.monthlyExpenses} onChange={(val) => onChange('monthlyExpenses', val)} prefix="₹" placeholder="50000" min={1} error={errors.monthlyExpenses} autoFocus />,
    validate: (v) => (!v.monthlyExpenses || Number(v.monthlyExpenses) <= 0) ? { monthlyExpenses: 'Enter valid expenses' } : {},
    formatReview: (v) => formatINR(parseFloat(v.monthlyExpenses || '0')),
  },
  {
    question: 'Inflation Rate',
    description: 'Expected annual inflation over your retirement horizon.',
    fields: ['inflationRate'], fieldLabels: ['Inflation Rate'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.inflationRate} onChange={(val) => onChange('inflationRate', val)} suffix="% per year" placeholder="6" min={0} max={20} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.inflationRate}% per year`,
  },
  {
    question: 'Post-Retirement Return',
    description: 'Expected annual return on your corpus after retirement.',
    fields: ['postReturn'], fieldLabels: ['Post-Retirement Return'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.postReturn} onChange={(val) => onChange('postReturn', val)} suffix="% per year" placeholder="7" min={0} max={20} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.postReturn}% per year`,
  },
  {
    question: 'Current Savings / Corpus',
    description: 'Total investments you already have today.',
    fields: ['currentSavings'], fieldLabels: ['Current Savings'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.currentSavings} onChange={(val) => onChange('currentSavings', val)} prefix="₹" placeholder="0" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.currentSavings || '0')),
  },
];

export function RetirementCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calculateRetirement(panel.values) : null;

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#437a22]/10 flex items-center justify-center"><Sunset className="w-5 h-5 text-[#437a22]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Retirement Corpus</h2><p className="text-xs text-[#7a7974]">How much do you need to retire comfortably?</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-1">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-2">Results</p>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Corpus Needed at Retirement</p>
                <p className="text-4xl font-bold text-[#28251d]">{formatINR(result.corpusNeeded)}</p>
              </div>
              {[
                { label: 'Monthly SIP Required', value: result.monthlySipRequired > 0 ? formatINR(result.monthlySipRequired) : '—', color: 'text-[#437a22]' },
                { label: 'Years to Retirement', value: `${result.yearsToRetirement} years` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#f7f6f2] last:border-0">
                  <span className="text-sm text-[#7a7974]">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color ?? 'text-[#28251d]'}`}>{row.value}</span>
                </div>
              ))}
              <p className="text-[11px] text-[#7a7974] pt-1">Assumes 12% pre-retirement SIP return. Corpus sustains until age 85.</p>
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Corpus Depletion Post-Retirement</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={result.depletionData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                  <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                  <Tooltip content={<LineTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                  {result.depletionAge && <ReferenceLine x={result.depletionAge} stroke="#a12c7b" strokeDasharray="4 2" label={{ value: 'Depleted', position: 'top', fontSize: 10, fill: '#a12c7b' }} />}
                  <Line type="monotone" dataKey="corpus" name="Remaining Corpus" stroke="#437a22" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#437a22' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
            <AddPlanAsGoalButton prefill={{
              name: 'Retirement',
              type: 'retirement',
              targetAmount: result.corpusNeeded,
              targetDate: monthsFromNow(result.yearsToRetirement * 12),
              savedAmount: parseFloat(panel.values.currentSavings || '0'),
              monthlyContribution: result.monthlySipRequired,
              linkedCalculator: '/calculators/retirement',
              linkedCalculatorName: 'Retirement Calculator',
            }} />
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Sunset className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Plan your retirement corpus</p><p className="text-xs text-[#7a7974] mt-1">6 quick questions to find out how much you need</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calculateRetirement(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
