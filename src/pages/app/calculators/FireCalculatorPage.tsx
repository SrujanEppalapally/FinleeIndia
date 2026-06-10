import { useState, useEffect } from 'react';
import { ArrowLeft, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from 'recharts';

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

type FireType = 'lean' | 'regular' | 'fat';

interface FireResult {
  fireNumber: number;
  fireAge: number;
  yearsToFire: number;
  sipNeeded: number;
  fireType: FireType;
  chartData: { age: number; corpus: number; fireTarget: number }[];
}

function calcFire(
  currentAge: string, monthlyExp: string, inflation: string,
  returnRate: string, swr: string, currentSavings: string, monthlySip: string,
): FireResult | null {
  const age = parseInt(currentAge, 10);
  const exp = parseFloat(monthlyExp);
  const inf = parseFloat(inflation) / 100;
  const ret = parseFloat(returnRate) / 100;
  const swrRate = parseFloat(swr) / 100;
  const savings = parseFloat(currentSavings || '0');
  const sip = parseFloat(monthlySip || '0');
  if (!age || !exp || !ret || !swrRate) return null;

  const annualExpNow = exp * 12;
  const r = ret / 12;
  const MAX_YEARS = 50;

  // Simulate corpus growth year by year until FIRE number is reached
  let corpus = savings;
  let fireAge: number | null = null;
  const chartData: { age: number; corpus: number; fireTarget: number }[] = [];

  for (let y = 0; y <= MAX_YEARS; y++) {
    const curAge = age + y;
    // Annual expenses at this point (inflated from today)
    const annualExpAtAge = annualExpNow * Math.pow(1 + inf, y);
    const fireNumber = annualExpAtAge / swrRate;

    chartData.push({ age: curAge, corpus: Math.round(corpus), fireTarget: Math.round(fireNumber) });

    if (corpus >= fireNumber && fireAge === null) {
      fireAge = curAge;
    }

    // Grow corpus: SIP contributions + return
    const monthlyReturn = corpus * r + sip;
    corpus = corpus * Math.pow(1 + r, 12) + sip * ((Math.pow(1 + r, 12) - 1) / r);
  }

  const finalFireAge = fireAge ?? age + MAX_YEARS;
  const yearsToFire = finalFireAge - age;

  // FIRE number at retirement (expenses inflated by yearsToFire)
  const annualExpAtRetirement = annualExpNow * Math.pow(1 + inf, yearsToFire);
  const fireNumber = annualExpAtRetirement / swrRate;

  // SIP needed if no current SIP
  const sn = yearsToFire * 12;
  const fvSavings = savings * Math.pow(1 + r, sn);
  const corpusFromSip = Math.max(0, fireNumber - fvSavings);
  const sipNeeded = corpusFromSip > 0
    ? Math.round((corpusFromSip * r) / (Math.pow(1 + r, sn) - 1) / (1 + r))
    : 0;

  const fireType: FireType = fireNumber < 2_00_00_000 ? 'lean' : fireNumber < 5_00_00_000 ? 'regular' : 'fat';

  return { fireNumber: Math.round(fireNumber), fireAge: finalFireAge, yearsToFire, sipNeeded, fireType, chartData };
}

const FIRE_TYPE_CFG = {
  lean:    { label: 'Lean FIRE (<₹2 Cr)',    cls: 'bg-[#0e7490]/10 text-[#0e7490] border-[#0e7490]/20' },
  regular: { label: 'Regular FIRE (₹2–5 Cr)', cls: 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' },
  fat:     { label: 'Fat FIRE (>₹5 Cr)',     cls: 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20' },
};

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

export function FireCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const [f, setF] = useState({ currentAge: '28', monthlyExp: '50000', inflation: '6', returnRate: '10', swr: '4', currentSavings: '0', monthlySip: '15000' });
  const [result, setResult] = useState<FireResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calcFire(f.currentAge, f.monthlyExp, f.inflation, f.returnRate, f.swr, f.currentSavings, f.monthlySip)); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: '' })); };

  const go = () => {
    const errs: Record<string, string> = {};
    if (!f.currentAge || Number(f.currentAge) < 18) errs.currentAge = 'Enter age 18+';
    if (!f.monthlyExp || Number(f.monthlyExp) <= 0) errs.monthlyExp = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calcFire(f.currentAge, f.monthlyExp, f.inflation, f.returnRate, f.swr, f.currentSavings, f.monthlySip));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center"><Flame className="w-5 h-5 text-[#b45309]" /></div>
        <div><h2 className="text-base font-semibold text-[#28251d]">FIRE Calculator</h2><p className="text-xs text-[#7a7974]">Financial Independence, Retire Early</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Current Age" type="number" placeholder="28" value={f.currentAge} onChange={set('currentAge')} error={errors.currentAge} />
            <Input label="Monthly Expenses (₹)" type="number" placeholder="50000" value={f.monthlyExp} onChange={set('monthlyExp')} error={errors.monthlyExp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Inflation (%)" type="number" placeholder="6" value={f.inflation} onChange={set('inflation')} />
            <Input label="Portfolio Return (%)" type="number" placeholder="10" value={f.returnRate} onChange={set('returnRate')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Safe Withdrawal Rate (%)" type="number" placeholder="4" value={f.swr} onChange={set('swr')} />
            <Input label="Current Savings (₹)" type="number" placeholder="0" value={f.currentSavings} onChange={set('currentSavings')} />
          </div>
          <Input label="Monthly SIP Investing (₹)" type="number" placeholder="15000" value={f.monthlySip} onChange={set('monthlySip')} />
          <Button variant="primary" size="md" className="w-full mt-2" onClick={go}>Calculate</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${FIRE_TYPE_CFG[result.fireType].cls}`}>
                    {FIRE_TYPE_CFG[result.fireType].label}
                  </span>
                </div>
                {/* FIRE number big */}
                <div className="py-4 border-y border-[#f0ede6]">
                  <p className="text-xs text-[#7a7974] font-medium mb-1">FIRE Number (Corpus Needed)</p>
                  <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.fireNumber)}</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">FIRE Age</p>
                    <p className="text-xl font-bold text-[#01696f]">{result.fireAge}</p>
                  </div>
                  <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">Years to FIRE</p>
                    <p className="text-xl font-bold text-[#28251d]">{result.yearsToFire}</p>
                  </div>
                  <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">SIP Needed</p>
                    <p className="text-base font-bold text-[#437a22]">{formatINR(result.sipNeeded)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Corpus Growth to FIRE</p>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Age', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                    <ReferenceLine x={result.fireAge} stroke="#437a22" strokeDasharray="5 3" label={{ value: "You're FREE here 🎉", position: 'top', fontSize: 10, fill: '#437a22' }} />
                    <Line type="monotone" dataKey="corpus" name="Your Corpus" stroke="#01696f" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
                    <Line type="monotone" dataKey="fireTarget" name="FIRE Target" stroke="#b45309" strokeWidth={1.5} strokeDasharray="4 2" dot={false} activeDot={{ r: 3, fill: '#b45309' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Flame className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter details and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
