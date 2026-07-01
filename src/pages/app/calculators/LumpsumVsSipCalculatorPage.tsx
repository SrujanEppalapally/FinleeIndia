import { useState, useEffect } from 'react';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
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

interface LvSResult {
  lumpsumFinal: number;
  sipFinal: number;
  lumpsumInvested: number;
  sipInvested: number;
  winner: 'lumpsum' | 'sip';
  diff: number;
  chartData: { year: number; lumpsum: number; sip: number }[];
}

function calcLvS(amount: string, returnRate: string, years: string): LvSResult | null {
  const L = parseFloat(amount);
  const r = parseFloat(returnRate) / 100;
  const yrs = parseInt(years, 10);
  if (!L || !r || !yrs) return null;

  // SIP equivalent: same total investment spread monthly
  const sipMonthly = L / (yrs * 12);
  const mr = r / 12;
  const n = yrs * 12;

  const lumpsumFinal = L * Math.pow(1 + r, yrs);
  const sipFinal = sipMonthly * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr);

  const chartData: { year: number; lumpsum: number; sip: number }[] = [];
  for (let y = 1; y <= yrs; y++) {
    const lVal = L * Math.pow(1 + r, y);
    const sMonths = y * 12;
    const sVal = sipMonthly * ((Math.pow(1 + mr, sMonths) - 1) / mr) * (1 + mr);
    chartData.push({ year: y, lumpsum: Math.round(lVal), sip: Math.round(sVal) });
  }

  const winner = lumpsumFinal >= sipFinal ? 'lumpsum' : 'sip';
  const diff = Math.abs(lumpsumFinal - sipFinal);

  return {
    lumpsumFinal: Math.round(lumpsumFinal),
    sipFinal: Math.round(sipFinal),
    lumpsumInvested: L,
    sipInvested: L,
    winner,
    diff: Math.round(diff),
    chartData,
  };
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card p-3 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">Year {label}</p>
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

export function LumpsumVsSipCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const [amount, setAmount] = useState('500000');
  const [returnRate, setReturnRate] = useState('12');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<LvSResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calcLvS(amount, returnRate, years)); }, []);

  const go = () => {
    const errs: Record<string, string> = {};
    if (!amount || Number(amount) <= 0) errs.amount = 'Enter a valid amount';
    if (!returnRate || Number(returnRate) <= 0) errs.returnRate = 'Required';
    if (!years || Number(years) <= 0 || Number(years) > 40) errs.years = 'Enter 1–40 years';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calcLvS(amount, returnRate, years));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#01696f]/10 flex items-center justify-center"><BarChart2 className="w-5 h-5 text-[#01696f]" /></div>
        <div><h2 className="text-base font-semibold text-[#28251d]">Lumpsum vs SIP</h2><p className="text-xs text-[#7a7974]">Which strategy grows your money faster?</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input label="Total Investment Amount (₹)" type="number" placeholder="500000" value={amount} onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }} error={errors.amount} />
          <Input label="Expected Annual Return (%)" type="number" placeholder="12" value={returnRate} onChange={(e) => { setReturnRate(e.target.value); setErrors((p) => ({ ...p, returnRate: '' })); }} error={errors.returnRate} />
          <Input label="Duration (Years)" type="number" placeholder="10" value={years} onChange={(e) => { setYears(e.target.value); setErrors((p) => ({ ...p, years: '' })); }} error={errors.years} />
          <div className="bg-[#f7f6f2] rounded-[6px] p-3 text-xs text-[#7a7974]">
            SIP equivalent: same total investment spread over {years || '?'} years monthly. Both invest the same total amount.
          </div>
          <Button variant="primary" size="md" className="w-full" onClick={go}>Compare</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Winner banner */}
              <div className={`rounded-[8px] p-4 flex items-center gap-3 border ${result.winner === 'lumpsum' ? 'bg-[#01696f]/8 border-[#01696f]/20' : 'bg-[#437a22]/8 border-[#437a22]/20'}`}>
                <span className="text-2xl">🏆</span>
                <div>
                  <p className={`text-sm font-bold ${result.winner === 'lumpsum' ? 'text-[#01696f]' : 'text-[#437a22]'}`}>
                    {result.winner === 'lumpsum' ? 'Lumpsum' : 'SIP'} wins by {formatINR(result.diff)}
                  </p>
                  {result.winner === 'sip' && (
                    <p className="text-xs text-[#7a7974] mt-0.5">Lumpsum needs market timing. SIP removes that risk.</p>
                  )}
                </div>
              </div>

              {/* Comparison cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Lumpsum', final: result.lumpsumFinal, invested: result.lumpsumInvested, isWinner: result.winner === 'lumpsum', color: '#01696f' },
                  { label: `SIP (${formatINR(Math.round(result.lumpsumInvested / (Number(years) * 12)))}/mo)`, final: result.sipFinal, invested: result.sipInvested, isWinner: result.winner === 'sip', color: '#437a22' },
                ].map((c) => (
                  <div key={c.label} className={`bg-white rounded-[8px] shadow-card p-4 ${c.isWinner ? 'ring-2 ring-[#437a22]/25' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">{c.label}</p>
                      {c.isWinner && <span className="text-[10px] font-semibold text-white bg-[#437a22] px-2 py-0.5 rounded-full">Winner</span>}
                    </div>
                    <p className="text-xl font-bold" style={{ color: c.color }}>{formatINR(c.final)}</p>
                    <p className="text-[11px] text-[#7a7974] mt-0.5">Final Value</p>
                    <div className="mt-2 pt-2 border-t border-[#f0ede6]">
                      <p className="text-xs text-[#7a7974]">Returns: <span className="font-medium text-[#28251d]">{formatINR(c.final - c.invested)}</span></p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Growth Comparison</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                    <Line type="monotone" dataKey="lumpsum" name="Lumpsum" stroke="#01696f" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
                    <Line type="monotone" dataKey="sip" name="SIP" stroke="#437a22" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 3, fill: '#437a22' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <BarChart2 className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter details and click Compare</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
