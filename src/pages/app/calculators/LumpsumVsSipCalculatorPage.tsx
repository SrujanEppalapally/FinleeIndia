import { useEffect } from 'react';
import { ArrowLeft, BarChart2, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

interface LvSResult {
  lumpsumFinal: number; sipFinal: number;
  lumpsumInvested: number; sipInvested: number;
  winner: 'lumpsum' | 'sip'; diff: number;
  chartData: { year: number; lumpsum: number; sip: number }[];
}

function calc(v: Record<string, string>): LvSResult | null {
  const L = parseFloat(v.amount), r = parseFloat(v.returnRate) / 100, yrs = parseInt(v.years, 10);
  if (!L || !r || !yrs) return null;
  const sipMonthly = L / (yrs * 12), mr = r / 12, n = yrs * 12;
  const lumpsumFinal = L * Math.pow(1 + r, yrs);
  const sipFinal = sipMonthly * ((Math.pow(1 + mr, n) - 1) / mr) * (1 + mr);
  const chartData: { year: number; lumpsum: number; sip: number }[] = [];
  for (let y = 1; y <= yrs; y++) {
    const sMonths = y * 12;
    chartData.push({ year: y, lumpsum: Math.round(L * Math.pow(1 + r, y)), sip: Math.round(sipMonthly * ((Math.pow(1 + mr, sMonths) - 1) / mr) * (1 + mr)) });
  }
  const winner = lumpsumFinal >= sipFinal ? 'lumpsum' : 'sip';
  return { lumpsumFinal: Math.round(lumpsumFinal), sipFinal: Math.round(sipFinal), lumpsumInvested: L, sipInvested: L, winner, diff: Math.round(Math.abs(lumpsumFinal - sipFinal)), chartData };
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

const DEFAULTS = { amount: '500000', returnRate: '12', years: '10' };

const STEPS: StepDef[] = [
  {
    question: 'Total Investment Amount',
    description: 'The total amount you want to invest — we compare investing it all at once vs spreading monthly.',
    fields: ['amount'], fieldLabels: ['Investment Amount'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.amount} onChange={(val) => onChange('amount', val)} prefix="₹" placeholder="500000" min={1} error={errors.amount} autoFocus />,
    validate: (v) => (!v.amount || Number(v.amount) <= 0) ? { amount: 'Enter investment amount' } : {},
    formatReview: (v) => formatINR(parseFloat(v.amount || '0')),
  },
  {
    question: 'Expected Annual Return',
    description: 'The annual return rate you expect from your investment.',
    fields: ['returnRate'], fieldLabels: ['Return Rate'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.returnRate} onChange={(val) => onChange('returnRate', val)} suffix="% per year" placeholder="12" min={1} max={30} error={errors.returnRate} autoFocus />,
    validate: (v) => (!v.returnRate || Number(v.returnRate) <= 0) ? { returnRate: 'Enter return rate' } : {},
    formatReview: (v) => `${v.returnRate}% per year`,
  },
  {
    question: 'Investment Duration',
    description: 'How many years do you want to stay invested?',
    fields: ['years'], fieldLabels: ['Duration'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.years} onChange={(val) => onChange('years', val)} suffix="years" placeholder="10" min={1} max={40} error={errors.years} autoFocus />,
    validate: (v) => (!v.years || Number(v.years) <= 0 || Number(v.years) > 40) ? { years: 'Enter 1–40 years' } : {},
    formatReview: (v) => `${v.years} years`,
  },
];

export function LumpsumVsSipCalculatorPage() {
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
          <div className="w-9 h-9 rounded-full bg-[#01696f]/10 flex items-center justify-center"><BarChart2 className="w-5 h-5 text-[#01696f]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Lumpsum vs SIP</h2><p className="text-xs text-[#7a7974]">Which strategy grows your money faster?</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className={`rounded-[8px] p-4 flex items-center gap-3 border ${result.winner === 'lumpsum' ? 'bg-[#01696f]/8 border-[#01696f]/20' : 'bg-[#437a22]/8 border-[#437a22]/20'}`}>
              <span className="text-2xl font-bold">{result.winner === 'lumpsum' ? 'L' : 'S'}</span>
              <div>
                <p className={`text-sm font-bold ${result.winner === 'lumpsum' ? 'text-[#01696f]' : 'text-[#437a22]'}`}>{result.winner === 'lumpsum' ? 'Lumpsum' : 'SIP'} wins by {formatINR(result.diff)}</p>
                {result.winner === 'sip' && <p className="text-xs text-[#7a7974] mt-0.5">Lumpsum needs market timing. SIP removes that risk.</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Lumpsum', final: result.lumpsumFinal, invested: result.lumpsumInvested, isWinner: result.winner === 'lumpsum', color: '#01696f' },
                { label: `SIP (${formatINR(Math.round(result.lumpsumInvested / (Number(panel.values.years) * 12)))}/mo)`, final: result.sipFinal, invested: result.sipInvested, isWinner: result.winner === 'sip', color: '#437a22' },
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
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <BarChart2 className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Compare Lumpsum vs SIP</p><p className="text-xs text-[#7a7974] mt-1">3 quick questions to see which wins</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
