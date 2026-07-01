import { useEffect } from 'react';
import { ArrowLeft, Sunset, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CalcPanel, StepInput, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

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

interface RetirementResult { corpusNeeded: number; monthlySipRequired: number; yearsToRetirement: number; depletionData: Array<{ age: number; corpus: number }>; depletionAge: number | null; }

function calculateRetirement(v: Record<string, string>): RetirementResult | null {
  const ca = parseInt(v.currentAge, 10), ra = parseInt(v.retirementAge, 10);
  const me = parseFloat(v.monthlyExpenses), inf = parseFloat(v.inflationRate) / 100;
  const ret = parseFloat(v.postReturn) / 100, cs = parseFloat(v.currentSavings || '0');
  if (!ca || !ra || !me || ra <= ca) return null;
  const ytr = ra - ca;
  const mear = me * Math.pow(1 + inf, ytr);
  const aear = mear * 12;
  const retYrs = 85 - ra;
  const realRate = (1 + ret) / (1 + inf) - 1;
  let corpusNeeded = realRate <= 0 ? aear * retYrs : aear * ((1 - Math.pow(1 + realRate, -retYrs)) / realRate);
  corpusNeeded = Math.round(corpusNeeded);
  const r = 0.12 / 12, n = ytr * 12;
  const fvs = cs * Math.pow(1 + 0.12 / 12, n);
  const fromSip = Math.max(0, corpusNeeded - fvs);
  const monthlySipRequired = fromSip > 0 ? Math.round((fromSip * r) / (Math.pow(1 + r, n) - 1) / (1 + r)) : 0;
  const depletionData: Array<{ age: number; corpus: number }> = [];
  let corpus = corpusNeeded, depletionAge: number | null = null;
  for (let y = 0; y <= retYrs; y++) {
    const age = ra + y;
    depletionData.push({ age, corpus: Math.max(0, Math.round(corpus)) });
    if (corpus <= 0 && depletionAge === null) depletionAge = age;
    corpus = corpus * (1 + ret) - mear * Math.pow(1 + inf, y) * 12;
  }
  return { corpusNeeded, monthlySipRequired, yearsToRetirement: ytr, depletionData, depletionAge };
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
    question: 'Current Age',
    description: 'Your age today — sets the baseline for retirement planning.',
    fields: ['currentAge'],
    fieldLabels: ['Current Age'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.currentAge} onChange={(val) => onChange('currentAge', val)} suffix="years" placeholder="30" min={18} max={80} error={errors.currentAge} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      const n = parseInt(v.currentAge, 10);
      if (!v.currentAge || n < 18 || n > 80) errs.currentAge = 'Enter age 18–80';
      return errs;
    },
    formatReview: (v) => `${v.currentAge} years`,
  },
  {
    question: 'Retirement Age',
    description: 'The age at which you plan to stop working.',
    fields: ['retirementAge'],
    fieldLabels: ['Retirement Age'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.retirementAge} onChange={(val) => onChange('retirementAge', val)} suffix="years" placeholder="60" min={parseInt(v.currentAge || '18', 10) + 1} max={80} error={errors.retirementAge} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      const ra = parseInt(v.retirementAge, 10), ca = parseInt(v.currentAge, 10);
      if (!v.retirementAge || ra <= ca) errs.retirementAge = 'Must be greater than current age';
      return errs;
    },
    formatReview: (v) => `Age ${v.retirementAge}`,
  },
  {
    question: 'Monthly Expenses Today',
    description: 'Your current monthly living costs — we will inflate these to retirement.',
    fields: ['monthlyExpenses'],
    fieldLabels: ['Monthly Expenses'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.monthlyExpenses} onChange={(val) => onChange('monthlyExpenses', val)} prefix="₹" placeholder="50000" min={1} error={errors.monthlyExpenses} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (!v.monthlyExpenses || Number(v.monthlyExpenses) <= 0) errs.monthlyExpenses = 'Enter valid expenses';
      return errs;
    },
    formatReview: (v) => formatINR(parseFloat(v.monthlyExpenses || '0')),
  },
  {
    question: 'Inflation Rate',
    description: 'Expected average annual inflation — 6% is the historical Indian average.',
    fields: ['inflationRate'],
    fieldLabels: ['Inflation Rate'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.inflationRate} onChange={(val) => onChange('inflationRate', val)} suffix="% per year" placeholder="6" min={0} max={20} error={errors.inflationRate} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (v.inflationRate === '' || Number(v.inflationRate) < 0) errs.inflationRate = 'Enter valid rate';
      return errs;
    },
    formatReview: (v) => `${v.inflationRate}%`,
  },
  {
    question: 'Post-Retirement Return',
    description: 'Expected annual portfolio return after you retire (conservative: 6–8%).',
    fields: ['postReturn'],
    fieldLabels: ['Post-Retirement Return'],
    renderInput: ({ values: v, onChange, errors }) => (
      <StepInput value={v.postReturn} onChange={(val) => onChange('postReturn', val)} suffix="% per year" placeholder="7" min={0} max={20} error={errors.postReturn} autoFocus />
    ),
    validate: (v) => {
      const errs: Record<string, string> = {};
      if (v.postReturn === '' || Number(v.postReturn) < 0) errs.postReturn = 'Enter valid rate';
      return errs;
    },
    formatReview: (v) => `${v.postReturn}%`,
  },
  {
    question: 'Current Corpus / Savings',
    description: 'Total investments and savings you have already accumulated.',
    fields: ['currentSavings'],
    fieldLabels: ['Current Savings'],
    renderInput: ({ values: v, onChange }) => (
      <StepInput value={v.currentSavings} onChange={(val) => onChange('currentSavings', val)} prefix="₹" placeholder="0" min={0} autoFocus />
    ),
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
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Corpus Needed at Retirement</p>
                <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.corpusNeeded)}</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly SIP Required</p><p className="text-base font-bold text-[#437a22]">{result.monthlySipRequired > 0 ? formatINR(result.monthlySipRequired) : '—'}</p></div>
                <div className="flex-1"><p className="text-xs text-[#7a7974] font-medium mb-0.5">Years to Retirement</p><p className="text-base font-bold text-[#28251d]">{result.yearsToRetirement} yrs</p></div>
              </div>
              <div className="text-xs text-[#7a7974] bg-[#f7f6f2] rounded-[6px] px-3 py-2">Assumes 12% pre-retirement SIP return. Corpus sustains until age 85.</div>
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
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Sunset className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Calculate your retirement corpus</p><p className="text-xs text-[#7a7974] mt-1">Answer 6 quick questions</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calculateRetirement(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
