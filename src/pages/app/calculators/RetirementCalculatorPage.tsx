import { useState, useEffect } from 'react';
import { ArrowLeft, Sunset } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}

function formatYAxisINR(v: number): string {
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

function calculateRetirement(
  currentAge: string,
  retirementAge: string,
  monthlyExpenses: string,
  inflationRate: string,
  postReturnRate: string,
  currentSavings: string
): RetirementResult | null {
  const ca = parseInt(currentAge, 10);
  const ra = parseInt(retirementAge, 10);
  const me = parseFloat(monthlyExpenses);
  const inf = parseFloat(inflationRate) / 100;
  const ret = parseFloat(postReturnRate) / 100;
  const cs = parseFloat(currentSavings || '0');

  if (!ca || !ra || !me || ra <= ca) return null;

  const yearsToRetirement = ra - ca;

  // Expenses at retirement in today's ₹ inflated
  const monthlyExpAtRetirement = me * Math.pow(1 + inf, yearsToRetirement);
  const annualExpAtRetirement = monthlyExpAtRetirement * 12;

  // Corpus needed using present value of perpetuity (sustain to age 85)
  const retirementYears = 85 - ra;
  const realRate = (1 + ret) / (1 + inf) - 1;
  let corpusNeeded: number;
  if (realRate <= 0) {
    corpusNeeded = annualExpAtRetirement * retirementYears;
  } else {
    corpusNeeded = annualExpAtRetirement * ((1 - Math.pow(1 + realRate, -retirementYears)) / realRate);
  }
  corpusNeeded = Math.round(corpusNeeded);

  // SIP required to reach corpus (minus current savings grown)
  const r = 0.12 / 12; // assume 12% pre-retirement return for SIP
  const n = yearsToRetirement * 12;
  const futureValueOfSavings = cs * Math.pow(1 + 0.12 / 12, n);
  const corpusFromSip = Math.max(0, corpusNeeded - futureValueOfSavings);
  const monthlySipRequired = corpusFromSip > 0
    ? Math.round((corpusFromSip * r) / (Math.pow(1 + r, n) - 1) / (1 + r))
    : 0;

  // Corpus depletion post-retirement (year by year)
  const depletionData: Array<{ age: number; corpus: number }> = [];
  let corpus = corpusNeeded;
  let depletionAge: number | null = null;
  for (let y = 0; y <= retirementYears; y++) {
    const age = ra + y;
    depletionData.push({ age, corpus: Math.max(0, Math.round(corpus)) });
    if (corpus <= 0 && depletionAge === null) depletionAge = age;
    // Grow corpus at post-retirement rate, withdraw monthly expenses (inflated)
    const expThisYear = monthlyExpAtRetirement * Math.pow(1 + inf, y) * 12;
    corpus = corpus * (1 + ret) - expThisYear;
  }

  return { corpusNeeded, monthlySipRequired, yearsToRetirement, depletionData, depletionAge };
}

// ── Custom Tooltip ─────────────────────────────────────────────

function LineTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1">Age {label}</p>
      <p className="text-[#7a7974]">Corpus: <span className="font-medium text-[#28251d]">{formatINR(payload[0].value)}</span></p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function RetirementCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();

  const [currentAge, setCurrentAge] = useState('30');
  const [retirementAge, setRetirementAge] = useState('60');
  const [monthlyExpenses, setMonthlyExpenses] = useState('50000');
  const [inflationRate, setInflationRate] = useState('6');
  const [postReturn, setPostReturn] = useState('7');
  const [currentSavings, setCurrentSavings] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<RetirementResult | null>(null);

  useEffect(() => {
    setActions(
      <button
        onClick={() => navigate('/calculators')}
        className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">All Calculators</span>
      </button>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => {
    setResult(calculateRetirement(currentAge, retirementAge, monthlyExpenses, inflationRate, postReturn, currentSavings));
  }, []);

  const handleCalculate = () => {
    const errs: Record<string, string> = {};
    const ca = parseInt(currentAge, 10), ra = parseInt(retirementAge, 10);
    if (!currentAge || ca < 18 || ca > 80) errs.currentAge = 'Enter age 18–80';
    if (!retirementAge || ra <= ca) errs.retirementAge = 'Must be greater than current age';
    if (!monthlyExpenses || Number(monthlyExpenses) <= 0) errs.monthlyExpenses = 'Enter valid expenses';
    if (!inflationRate || Number(inflationRate) < 0) errs.inflationRate = 'Enter valid rate';
    if (!postReturn || Number(postReturn) < 0) errs.postReturn = 'Enter valid rate';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calculateRetirement(currentAge, retirementAge, monthlyExpenses, inflationRate, postReturn, currentSavings));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#437a22]/10 flex items-center justify-center">
          <Sunset className="w-5 h-5 text-[#437a22]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#28251d]">Retirement Corpus</h2>
          <p className="text-xs text-[#7a7974]">How much do you need to retire comfortably?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Current Age" type="number" placeholder="30" value={currentAge}
              onChange={(e) => { setCurrentAge(e.target.value); setErrors((p) => ({ ...p, currentAge: '' })); }}
              error={errors.currentAge} />
            <Input label="Retirement Age" type="number" placeholder="60" value={retirementAge}
              onChange={(e) => { setRetirementAge(e.target.value); setErrors((p) => ({ ...p, retirementAge: '' })); }}
              error={errors.retirementAge} />
          </div>
          <Input label="Monthly Expenses Today (₹)" type="number" placeholder="50000" value={monthlyExpenses}
            onChange={(e) => { setMonthlyExpenses(e.target.value); setErrors((p) => ({ ...p, monthlyExpenses: '' })); }}
            error={errors.monthlyExpenses} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Inflation Rate (%)" type="number" placeholder="6" value={inflationRate}
              onChange={(e) => { setInflationRate(e.target.value); setErrors((p) => ({ ...p, inflationRate: '' })); }}
              error={errors.inflationRate} />
            <Input label="Post-Retirement Return (%)" type="number" placeholder="7" value={postReturn}
              onChange={(e) => { setPostReturn(e.target.value); setErrors((p) => ({ ...p, postReturn: '' })); }}
              error={errors.postReturn} />
          </div>
          <Input label="Current Corpus / Savings Already Invested (₹)" type="number" placeholder="0" value={currentSavings}
            onChange={(e) => setCurrentSavings(e.target.value)} />
          <Button variant="primary" size="md" className="w-full mt-2" onClick={handleCalculate}>
            Calculate
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>

                <div className="py-4 border-y border-[#f0ede6]">
                  <p className="text-xs text-[#7a7974] font-medium mb-1">Corpus Needed at Retirement</p>
                  <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.corpusNeeded)}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly SIP Required</p>
                    <p className="text-base font-bold text-[#437a22]">
                      {result.monthlySipRequired > 0 ? formatINR(result.monthlySipRequired) : '—'}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Years to Retirement</p>
                    <p className="text-base font-bold text-[#28251d]">{result.yearsToRetirement} yrs</p>
                  </div>
                </div>

                <div className="text-xs text-[#7a7974] bg-[#f7f6f2] rounded-[6px] px-3 py-2">
                  Assumes 12% pre-retirement SIP return. Corpus sustains until age 85.
                </div>
              </div>

              {/* Depletion chart */}
              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">
                  Corpus Depletion Post-Retirement
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={result.depletionData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false}
                      label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false}
                      tickFormatter={formatYAxisINR} width={44} />
                    <Tooltip content={<LineTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                    {result.depletionAge && (
                      <ReferenceLine x={result.depletionAge} stroke="#a12c7b" strokeDasharray="4 2"
                        label={{ value: 'Depleted', position: 'top', fontSize: 10, fill: '#a12c7b' }} />
                    )}
                    <Line type="monotone" dataKey="corpus" name="Remaining Corpus" stroke="#437a22"
                      strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#437a22' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Sunset className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter your details and click Calculate</p>
              <p className="text-xs text-[#7a7974] mt-1">Your retirement corpus projection will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
