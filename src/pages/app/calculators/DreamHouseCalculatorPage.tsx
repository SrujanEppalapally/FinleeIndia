import { useState, useEffect } from 'react';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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

interface HouseResult {
  futurePrice: number;
  downPayment: number;
  loanAmount: number;
  monthlyEmi: number;
  sipNeeded: number;
  chartData: { year: number; price: number }[];
  verdict: 'achievable' | 'stretch' | 'revisit';
}

function calc(
  currentPrice: string, appreciation: string, years: string,
  downPct: string, loanRate: string, loanTenure: string, currentAge: string,
): HouseResult | null {
  const cp = parseFloat(currentPrice);
  const apr = parseFloat(appreciation) / 100;
  const yrs = parseInt(years, 10);
  const dp = parseFloat(downPct) / 100;
  const lr = parseFloat(loanRate) / 12 / 100;
  const lt = parseInt(loanTenure, 10) * 12;
  const age = parseInt(currentAge, 10);
  if (!cp || !apr || !yrs || !dp || !lr || !lt || isNaN(age)) return null;

  const futurePrice = cp * Math.pow(1 + apr, yrs);
  const downPayment = futurePrice * dp;
  const loanAmount = futurePrice - downPayment;
  const monthlyEmi = (loanAmount * lr * Math.pow(1 + lr, lt)) / (Math.pow(1 + lr, lt) - 1);

  // SIP to build down payment: FV = SIP * [((1+r)^n - 1)/r] * (1+r)
  const sr = 0.12 / 12;
  const sn = yrs * 12;
  const sipNeeded = (downPayment * sr) / ((Math.pow(1 + sr, sn) - 1) * (1 + sr));

  const chartData = Array.from({ length: yrs + 1 }, (_, i) => ({
    year: (new Date().getFullYear()) + i,
    price: Math.round(cp * Math.pow(1 + apr, i)),
  }));

  const emiPct = monthlyEmi / 100000; // rough proxy with ₹1L salary assumption
  const verdict: HouseResult['verdict'] =
    dp >= 0.3 ? 'achievable' : dp >= 0.2 ? 'stretch' : 'revisit';

  return { futurePrice: Math.round(futurePrice), downPayment: Math.round(downPayment), loanAmount: Math.round(loanAmount), monthlyEmi: Math.round(monthlyEmi), sipNeeded: Math.round(sipNeeded), chartData, verdict };
}

function VerdictBadge({ v }: { v: HouseResult['verdict'] }) {
  const cfg = {
    achievable: { label: 'Achievable', cls: 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' },
    stretch: { label: 'Stretch', cls: 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20' },
    revisit: { label: 'Revisit Plan', cls: 'bg-[#a12c7b]/10 text-[#a12c7b] border-[#a12c7b]/20' },
  }[v];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1">{label}</p>
      <p className="text-[#7a7974]">Price: <span className="font-medium text-[#28251d]">{formatINR(payload[0].value)}</span></p>
    </div>
  );
}

function Row({ label, value, big, color }: { label: string; value: string; big?: boolean; color?: string }) {
  return (
    <div className={big ? 'py-4 border-y border-[#f0ede6] my-1' : 'flex justify-between items-center py-2 border-b border-[#f7f6f2] last:border-0'}>
      <p className={`${big ? 'text-xs text-[#7a7974] font-medium mb-1' : 'text-sm text-[#7a7974]'}`}>{label}</p>
      <p className={`font-bold ${big ? 'text-2xl text-[#28251d]' : 'text-sm'} ${color ?? 'text-[#28251d]'}`}>{value}</p>
    </div>
  );
}

export function DreamHouseCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const [f, setF] = useState({ currentPrice: '5000000', appreciation: '7', years: '8', downPct: '20', loanRate: '8.5', loanTenure: '20', currentAge: '30' });
  const [result, setResult] = useState<HouseResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calc(f.currentPrice, f.appreciation, f.years, f.downPct, f.loanRate, f.loanTenure, f.currentAge)); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: '' })); };

  const go = () => {
    const errs: Record<string, string> = {};
    if (!f.currentPrice || Number(f.currentPrice) <= 0) errs.currentPrice = 'Required';
    if (!f.years || Number(f.years) <= 0) errs.years = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calc(f.currentPrice, f.appreciation, f.years, f.downPct, f.loanRate, f.loanTenure, f.currentAge));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#0e7490]/10 flex items-center justify-center"><Home className="w-5 h-5 text-[#0e7490]" /></div>
        <div><h2 className="text-base font-semibold text-[#28251d]">Dream House Calculator</h2><p className="text-xs text-[#7a7974]">Future price, EMI, and SIP needed for your home</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input label="Current House Price (₹)" type="number" placeholder="5000000" value={f.currentPrice} onChange={set('currentPrice')} error={errors.currentPrice} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Appreciation (%/yr)" type="number" placeholder="7" value={f.appreciation} onChange={set('appreciation')} />
            <Input label="Years Until Purchase" type="number" placeholder="8" value={f.years} onChange={set('years')} error={errors.years} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Down Payment (%)" type="number" placeholder="20" value={f.downPct} onChange={set('downPct')} />
            <Input label="Your Current Age" type="number" placeholder="30" value={f.currentAge} onChange={set('currentAge')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Loan Rate (%)" type="number" placeholder="8.5" value={f.loanRate} onChange={set('loanRate')} />
            <Input label="Loan Tenure (yrs)" type="number" placeholder="20" value={f.loanTenure} onChange={set('loanTenure')} />
          </div>
          <Button variant="primary" size="md" className="w-full mt-2" onClick={go}>Calculate</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                  <VerdictBadge v={result.verdict} />
                </div>
                <div className="py-4 border-y border-[#f0ede6]">
                  <p className="text-xs text-[#7a7974] font-medium mb-1">Monthly EMI</p>
                  <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.monthlyEmi)}</p>
                </div>
                <Row label="Future House Price" value={formatINR(result.futurePrice)} />
                <Row label="Down Payment Needed" value={formatINR(result.downPayment)} color="text-[#b45309]" />
                <Row label="Loan Amount" value={formatINR(result.loanAmount)} />
                <Row label="Monthly SIP Needed Now (for down payment)" value={formatINR(result.sipNeeded)} color="text-[#437a22]" />
                <p className="text-[11px] text-[#7a7974] mt-2">SIP assumes 12% annual return. EMI calculated on loan at stated rate.</p>
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
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Home className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter details and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
