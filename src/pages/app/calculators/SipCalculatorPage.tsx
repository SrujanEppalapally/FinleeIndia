import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────

type StepUpType = 'percent' | 'fixed';

interface SipInputs {
  monthlyAmount: string;
  annualReturn: string;
  years: string;
  stepUpType: StepUpType;
  stepUpPct: string;
  stepUpFixed: string;
}

interface YearDataPoint {
  year: number;
  invested: number;
  total: number;
  returns: number;
  sipAmount: number;
}

interface SipResult {
  investedAmount: number;
  estimatedReturns: number;
  totalValue: number;
  wealthRatio: number;
  yearData: YearDataPoint[];
}

// ── Helpers ────────────────────────────────────────────────────

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)} Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)} L`;
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(1)} K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function formatYAxisINR(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_00_00_000) return `${(abs / 1_00_00_000).toFixed(1)}Cr`;
  if (abs >= 1_00_000) return `${(abs / 1_00_000).toFixed(1)}L`;
  if (abs >= 1_000) return `${(abs / 1_000).toFixed(0)}K`;
  return String(abs);
}

function calculateSip(inputs: SipInputs): SipResult | null {
  const P = parseFloat(inputs.monthlyAmount);
  const annualRate = parseFloat(inputs.annualReturn);
  const years = parseInt(inputs.years, 10);
  if (!P || !annualRate || !years || P <= 0 || annualRate <= 0 || years <= 0) return null;

  const r = annualRate / 12 / 100;
  const yearData: YearDataPoint[] = [];
  let totalInvested = 0;
  let corpus = 0;

  for (let y = 1; y <= years; y++) {
    let monthlyP: number;
    if (inputs.stepUpType === 'percent') {
      const pct = parseFloat(inputs.stepUpPct || '0');
      monthlyP = P * Math.pow(1 + pct / 100, y - 1);
    } else {
      const fixed = parseFloat(inputs.stepUpFixed || '0');
      monthlyP = P + fixed * (y - 1);
    }
    monthlyP = Math.max(monthlyP, 0);

    const n = 12;
    const fvThisYear = monthlyP * (((Math.pow(1 + r, n) - 1) / r) * (1 + r));
    corpus = corpus * Math.pow(1 + r, n) + fvThisYear;
    totalInvested += monthlyP * n;

    yearData.push({
      year: y,
      invested: Math.round(totalInvested),
      total: Math.round(corpus),
      returns: Math.round(corpus - totalInvested),
      sipAmount: Math.round(monthlyP),
    });
  }

  const totalValue = Math.round(corpus);
  const investedAmount = Math.round(totalInvested);
  return {
    investedAmount,
    estimatedReturns: totalValue - investedAmount,
    totalValue,
    wealthRatio: investedAmount > 0 ? totalValue / investedAmount : 0,
    yearData,
  };
}

// ── Custom Tooltip ─────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card p-3 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">Year {label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-[#7a7974]">{p.name}:</span>
          <span className="font-medium text-[#28251d]">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ResultValue({ label, value, large, color }: {
  label: string; value: number; large?: boolean; color?: string;
}) {
  return (
    <div className={`flex flex-col gap-0.5 ${large ? 'py-4 border-y border-[#f0ede6] my-1' : ''}`}>
      <p className="text-xs text-[#7a7974] font-medium">{label}</p>
      <p className={`font-bold ${large ? 'text-2xl text-[#28251d]' : 'text-base'} ${color ?? 'text-[#28251d]'}`}>
        {formatINR(value)}
      </p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function SipCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();

  const [inputs, setInputs] = useState<SipInputs>({
    monthlyAmount: '5000',
    annualReturn: '12',
    years: '10',
    stepUpType: 'percent',
    stepUpPct: '10',
    stepUpFixed: '500',
  });
  const [result, setResult] = useState<SipResult | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof SipInputs, string>>>({});

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

  useEffect(() => { setResult(calculateSip(inputs)); }, []);

  const set = (field: keyof SipInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputs((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleCalculate = () => {
    const errs: Partial<Record<keyof SipInputs, string>> = {};
    if (!inputs.monthlyAmount || Number(inputs.monthlyAmount) <= 0) errs.monthlyAmount = 'Enter a valid amount';
    if (!inputs.annualReturn || Number(inputs.annualReturn) <= 0) errs.annualReturn = 'Enter a valid rate';
    if (!inputs.years || Number(inputs.years) <= 0 || Number(inputs.years) > 50) errs.years = 'Enter 1–50 years';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calculateSip(inputs));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#01696f]/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-[#01696f]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#28251d]">Incremental SIP Calculator</h2>
          <p className="text-xs text-[#7a7974]">Step-up SIP growth with % or fixed annual increase</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>

          <Input label="Monthly SIP Amount (₹)" type="number" placeholder="5000" value={inputs.monthlyAmount} onChange={set('monthlyAmount')} error={errors.monthlyAmount} />
          <Input label="Expected Annual Return (%)" type="number" placeholder="12" value={inputs.annualReturn} onChange={set('annualReturn')} error={errors.annualReturn} />
          <Input label="Investment Duration (Years)" type="number" placeholder="10" value={inputs.years} onChange={set('years')} error={errors.years} />

          {/* Step-Up Type toggle */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-[#28251d]">Step-Up Type</p>
            <div className="flex rounded-[6px] border border-[#d4d2cc] overflow-hidden">
              {(['percent', 'fixed'] as StepUpType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setInputs((p) => ({ ...p, stepUpType: t }))}
                  className={[
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    inputs.stepUpType === t ? 'bg-[#01696f] text-white' : 'bg-white text-[#7a7974] hover:bg-[#f7f6f2]',
                  ].join(' ')}
                >
                  {t === 'percent' ? '% per year' : 'Fixed ₹/year'}
                </button>
              ))}
            </div>
          </div>

          {inputs.stepUpType === 'percent' ? (
            <div className="space-y-1">
              <Input label="Annual Step-Up (%)" type="number" placeholder="10" value={inputs.stepUpPct} onChange={set('stepUpPct')} error={errors.stepUpPct} />
              <p className="text-[11px] text-[#7a7974]">SIP increases by this % each year</p>
            </div>
          ) : (
            <div className="space-y-1">
              <Input label="Annual Increase Amount (₹)" type="number" placeholder="500" value={inputs.stepUpFixed} onChange={set('stepUpFixed')} error={errors.stepUpFixed} />
              <p className="text-[11px] text-[#7a7974]">SIP increases by this fixed amount each year</p>
            </div>
          )}

          <Button variant="primary" size="md" className="w-full mt-2" onClick={handleCalculate}>
            Calculate
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-3">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                <ResultValue label="Invested Amount" value={result.investedAmount} color="text-[#7a7974]" />
                <ResultValue label="Estimated Returns" value={result.estimatedReturns} color="text-[#437a22]" />
                <ResultValue label="Total Value" value={result.totalValue} large />
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1.5 bg-[#01696f]/8 rounded-full px-3 py-1.5">
                    <Star className="w-3.5 h-3.5 text-[#01696f]" />
                    <span className="text-xs font-semibold text-[#01696f]">
                      Your money grew {result.wealthRatio.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">
                  Corpus Growth &amp; SIP Amount by Year
                </p>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={result.yearData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="sipInvestedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="sipTotalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#01696f" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#01696f" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="sipAmtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b45309" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#b45309" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={formatYAxisINR} width={44} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                    <Area type="monotone" dataKey="invested" name="Invested" stroke="#9ca3af" strokeWidth={1.5} fill="url(#sipInvestedGrad)" dot={false} activeDot={{ r: 3, fill: '#9ca3af' }} />
                    <Area type="monotone" dataKey="total" name="Total Value" stroke="#01696f" strokeWidth={2} fill="url(#sipTotalGrad)" dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
                    <Area type="monotone" dataKey="sipAmount" name="Monthly SIP" stroke="#b45309" strokeWidth={1.5} strokeDasharray="4 2" fill="url(#sipAmtGrad)" dot={false} activeDot={{ r: 3, fill: '#b45309' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <TrendingUp className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter your details and click Calculate</p>
              <p className="text-xs text-[#7a7974] mt-1">Your projected SIP growth will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
