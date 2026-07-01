import { useEffect } from 'react';
import { ArrowLeft, Flame, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from 'recharts';
import { CalcPanel, StepInput, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

// ── Helpers ──────────────────────────────────────────────────

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

// ── Calculation ──────────────────────────────────────────────

interface FireResult {
  yearsToRetire: number;
  annualExpAtRetirement: number;
  fireNumber: number;
  projectedCorpus: number;
  investmentRequired: number;
  shortfall: number;
  onTrack: boolean;
  monthlyExtra: number;
  chartData: { age: number; corpus: number; fireNumber: number }[];
  fireAge: number;
}

const DEFAULTS = {
  age: '28', income: '1200000', salaryGrowth: '8',
  annualExp: '600000', currentInvestment: '0', fireAge: '45', returnRate: '10',
};

function calcFire(v: Record<string, string>): FireResult | null {
  const age = parseInt(v.age, 10);
  const fireAge = parseInt(v.fireAge, 10);
  const annualExp = parseFloat(v.annualExp);
  const currentInv = parseFloat(v.currentInvestment || '0');
  const ret = parseFloat(v.returnRate) / 100;
  if (!age || !fireAge || !annualExp || isNaN(ret)) return null;
  if (fireAge <= age) return null;

  const years = fireAge - age;
  const INFLATION = 0.06;

  const annualExpAtRetirement = annualExp * Math.pow(1 + INFLATION, years);
  const fireNumber = annualExpAtRetirement / 0.04;
  const projectedCorpus = currentInv * Math.pow(1 + ret, years);
  const investmentRequired = Math.max(0, fireNumber - projectedCorpus);
  const shortfall = Math.max(0, fireNumber - projectedCorpus);
  const onTrack = projectedCorpus >= fireNumber;

  // Monthly SIP needed for shortfall
  const r = ret / 12;
  const n = years * 12;
  const monthlyExtra = shortfall > 0 && r > 0
    ? Math.round((shortfall * r) / (Math.pow(1 + r, n) - 1) / (1 + r))
    : 0;

  // Chart: corpus growth year by year
  const chartData: { age: number; corpus: number; fireNumber: number }[] = [];
  let corpus = currentInv;
  for (let y = 0; y <= Math.min(years + 10, 50); y++) {
    const curAge = age + y;
    const expAtY = annualExp * Math.pow(1 + INFLATION, y);
    const fn = expAtY / 0.04;
    chartData.push({ age: curAge, corpus: Math.round(corpus), fireNumber: Math.round(fn) });
    corpus = corpus * Math.pow(1 + ret / 12, 12);
  }

  return { yearsToRetire: years, annualExpAtRetirement: Math.round(annualExpAtRetirement), fireNumber: Math.round(fireNumber), projectedCorpus: Math.round(projectedCorpus), investmentRequired: Math.round(investmentRequired), shortfall: Math.round(shortfall), onTrack, monthlyExtra, chartData, fireAge };
}

// ── Tooltip ──────────────────────────────────────────────────

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

// ── Steps definition ─────────────────────────────────────────

function buildSteps(values: Record<string, string>): StepDef[] {
  return [
    {
      question: 'How old are you?',
      description: 'Your current age helps us calculate your timeline to financial freedom.',
      fields: ['age'],
      fieldLabels: ['Current Age'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.age} onChange={(val) => onChange('age', val)} suffix="years" placeholder="28" min={18} max={70} error={errors.age} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        const n = parseInt(v.age, 10);
        if (!v.age || isNaN(n)) errs.age = 'Enter your age';
        else if (n < 18 || n > 70) errs.age = 'Age must be between 18 and 70';
        return errs;
      },
      formatReview: (v) => `${v.age} years`,
    },
    {
      question: 'What is your current annual income?',
      description: 'Your total yearly earnings before tax.',
      fields: ['income'],
      fieldLabels: ['Annual Income'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.income} onChange={(val) => onChange('income', val)} prefix="₹" placeholder="1200000" min={1} error={errors.income} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.income || parseFloat(v.income) < 1) errs.income = 'Enter your annual income';
        return errs;
      },
      formatReview: (v) => formatINR(parseFloat(v.income || '0')),
    },
    {
      question: 'How fast do you expect your salary to grow?',
      description: 'Average annual salary increment percentage.',
      fields: ['salaryGrowth'],
      fieldLabels: ['Salary Growth Rate'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.salaryGrowth} onChange={(val) => onChange('salaryGrowth', val)} suffix="% per year" placeholder="8" min={0} max={50} error={errors.salaryGrowth} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.salaryGrowth && v.salaryGrowth !== '0') errs.salaryGrowth = 'Enter a growth rate (0 if unknown)';
        return errs;
      },
      formatReview: (v) => `${v.salaryGrowth}% per year`,
    },
    {
      question: 'What are your current annual expenses?',
      description: 'Everything you spend in a year — rent, food, travel, EMIs, lifestyle.',
      fields: ['annualExp'],
      fieldLabels: ['Annual Expenses'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.annualExp} onChange={(val) => onChange('annualExp', val)} prefix="₹" placeholder="600000" min={1} error={errors.annualExp} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.annualExp || parseFloat(v.annualExp) < 1) errs.annualExp = 'Enter your annual expenses';
        return errs;
      },
      formatReview: (v) => formatINR(parseFloat(v.annualExp || '0')),
    },
    {
      question: 'How much have you already invested or saved?',
      description: 'Total current value of all investments, FDs, and savings combined.',
      fields: ['currentInvestment'],
      fieldLabels: ['Current Investments'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.currentInvestment} onChange={(val) => onChange('currentInvestment', val)} prefix="₹" placeholder="0" min={0} error={errors.currentInvestment} autoFocus />
      ),
      validate: () => ({}),
      formatReview: (v) => formatINR(parseFloat(v.currentInvestment || '0')),
    },
    {
      question: 'At what age do you want to achieve FIRE?',
      description: 'The age you want to stop working and live off your investments.',
      fields: ['fireAge'],
      fieldLabels: ['FIRE Age Goal'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.fireAge} onChange={(val) => onChange('fireAge', val)} suffix="years old" placeholder="45" min={parseInt(values.age || '18', 10) + 1} max={80} error={errors.fireAge} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        const n = parseInt(v.fireAge, 10);
        const curAge = parseInt(v.age, 10);
        if (!v.fireAge || isNaN(n)) errs.fireAge = 'Enter your FIRE age goal';
        else if (n <= curAge) errs.fireAge = `Must be greater than your current age (${curAge})`;
        else if (n > 80) errs.fireAge = 'Enter an age up to 80';
        return errs;
      },
      formatReview: (v) => `Age ${v.fireAge}`,
    },
    {
      question: 'What annual return do you expect on your investments?',
      description: 'Conservative estimate: 8–10% for diversified equity mutual funds.',
      fields: ['returnRate'],
      fieldLabels: ['Expected Return Rate'],
      renderInput: ({ values: v, onChange, errors }) => (
        <StepInput value={v.returnRate} onChange={(val) => onChange('returnRate', val)} suffix="% per year" placeholder="10" min={1} max={30} error={errors.returnRate} autoFocus />
      ),
      validate: (v) => {
        const errs: Record<string, string> = {};
        if (!v.returnRate || parseFloat(v.returnRate) <= 0) errs.returnRate = 'Enter expected return rate';
        return errs;
      },
      formatReview: (v) => `${v.returnRate}% per year`,
    },
  ];
}

// ── Results section ──────────────────────────────────────────

function Results({ result, showResult }: { result: FireResult; showResult: boolean }) {
  const intersectAge = result.chartData.find((d, i, arr) => {
    const next = arr[i + 1];
    return next && d.corpus < d.fireNumber && next.corpus >= next.fireNumber;
  })?.age ?? result.fireAge;

  return (
    <div
      className="space-y-4"
      style={{
        opacity: showResult ? 1 : 0,
        transform: showResult ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 250ms ease, transform 250ms ease',
      }}
    >
      {/* Status card */}
      <div className={`w-full rounded-[8px] p-5 border ${result.onTrack ? 'bg-[#437a22]/8 border-[#437a22]/25' : 'bg-[#a12c7b]/8 border-[#a12c7b]/25'}`}>
        <p className={`text-sm font-bold ${result.onTrack ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
          {result.onTrack
            ? `✅ You will reach FIRE by age ${result.fireAge}! Your investments alone will cover it.`
            : `❌ Shortfall of ${formatINR(result.shortfall)} at age ${result.fireAge}. You need to invest ${formatINR(result.monthlyExtra)}/month additionally.`}
        </p>
      </div>

      {/* KPI cards */}
      <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
        <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
        <div className="py-4 border-y border-[#f0ede6]">
          <p className="text-xs text-[#7a7974] font-medium mb-1">FIRE Number (Corpus Needed)</p>
          <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.fireNumber)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
            <p className="text-[11px] text-[#7a7974] mb-1">Years to Retire</p>
            <p className="text-xl font-bold text-[#01696f]">{result.yearsToRetire}</p>
          </div>
          <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
            <p className="text-[11px] text-[#7a7974] mb-1">Annual Expense at Retirement</p>
            <p className="text-base font-bold text-[#28251d]">{formatINR(result.annualExpAtRetirement)}</p>
          </div>
          <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
            <p className="text-[11px] text-[#7a7974] mb-1">Projected Corpus</p>
            <p className="text-base font-bold text-[#437a22]">{formatINR(result.projectedCorpus)}</p>
          </div>
          <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
            <p className="text-[11px] text-[#7a7974] mb-1">Investment Required</p>
            <p className="text-base font-bold text-[#b45309]">{formatINR(result.investmentRequired)}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-[8px] shadow-card p-5">
        <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Corpus Growth to FIRE</p>
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
            <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
            <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
            <Tooltip content={<ChartTip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
            <ReferenceLine x={intersectAge} stroke="#437a22" strokeDasharray="5 3" label={{ value: `FIRE at age ${intersectAge}`, position: 'top', fontSize: 10, fill: '#437a22' }} />
            <Line type="monotone" dataKey="corpus" name="Your Corpus" stroke="#01696f" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
            <Line type="monotone" dataKey="fireNumber" name="FIRE Number" stroke="#a12c7b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3, fill: '#a12c7b' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 3 Principles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { emoji: '💰', title: 'Save 50–70%', desc: 'Put more than half your income to work' },
          { emoji: '🧠', title: 'Spend Wisely', desc: 'Cut lifestyle inflation, not experiences' },
          { emoji: '📈', title: 'Invest Wisely', desc: 'Consistent, diversified, long-term wins' },
        ].map((p) => (
          <div key={p.title} className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-2xl mb-2">{p.emoji}</p>
            <p className="text-sm font-semibold text-[#28251d]">{p.title}</p>
            <p className="text-xs text-[#7a7974] mt-1">{p.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────

export function FireCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);

  const result = panel.hasResult ? calcFire(panel.values) : null;
  const steps = buildSteps(panel.values);

  useEffect(() => {
    setActions(
      <button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors">
        <ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span>
      </button>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  // Open panel on page load if no result yet
  useEffect(() => {
    if (!panel.hasResult) panel.openPanel();
  }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#b45309]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#28251d]">FIRE Calculator</h2>
            <p className="text-xs text-[#7a7974]">Financial Independence, Retire Early</p>
          </div>
        </div>

        {result ? (
          <>
            <Results result={result} showResult={panel.showResult} />
            <div className="flex gap-3">
              <button
                onClick={panel.openPanel}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Recalculate
              </button>
              <button
                onClick={() => panel.reset(DEFAULTS)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Flame className="w-12 h-12 text-[#d4d2cc]" />
            <div>
              <p className="text-sm font-medium text-[#28251d]">Plan your path to Financial Independence</p>
              <p className="text-xs text-[#7a7974] mt-1">Answer 7 quick questions to see your FIRE number</p>
            </div>
            <button
              onClick={panel.openPanel}
              className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors"
            >
              Start
            </button>
          </div>
        )}
      </div>

      <CalcPanel
        isOpen={panel.isOpen}
        onClose={panel.closePanel}
        onCalculate={() => panel.onCalculate(() => calcFire(panel.values))}
        steps={steps}
        values={panel.values}
        onChange={panel.onChange}
        errors={panel.errors}
        setErrors={panel.setErrors}
        currentStep={panel.currentStep}
        setCurrentStep={panel.setCurrentStep}
        returnToReview={panel.returnToReview}
        setReturnToReview={panel.setReturnToReview}
      />
    </>
  );
}
