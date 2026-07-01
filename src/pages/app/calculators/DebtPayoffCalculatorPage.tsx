import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
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

type Strategy = 'avalanche' | 'snowball';

interface Debt {
  id: string;
  name: string;
  balance: string;
  rate: string;
  minPayment: string;
}

interface MonthData {
  month: number;
  [key: string]: number;
}

interface DebtResult {
  payoffDate: string;
  totalInterestPaid: number;
  interestSaved: number;
  months: number;
  chartData: MonthData[];
  debtNames: string[];
}

function calcPayoff(debts: Debt[], extraPayment: string, strategy: Strategy): DebtResult | null {
  const parsed = debts.map((d) => ({
    id: d.id,
    name: d.name || 'Debt',
    balance: parseFloat(d.balance),
    rate: parseFloat(d.rate) / 100 / 12,
    minPayment: parseFloat(d.minPayment),
  })).filter((d) => d.balance > 0 && d.minPayment > 0);
  if (!parsed.length) return null;

  const extra = parseFloat(extraPayment || '0');

  // Clone state
  let balances = parsed.map((d) => ({ ...d }));
  const chartData: MonthData[] = [];
  let totalInterest = 0;
  const MAX_MONTHS = 600;

  // Sort order by strategy
  const sort = () => {
    if (strategy === 'avalanche') balances.sort((a, b) => b.rate - a.rate);
    else balances.sort((a, b) => a.balance - b.balance);
  };

  for (let m = 1; m <= MAX_MONTHS; m++) {
    if (balances.every((b) => b.balance <= 0)) break;
    sort();

    let extraLeft = extra;
    const row: MonthData = { month: m };

    for (const d of balances) {
      if (d.balance <= 0) { row[d.id] = 0; continue; }
      const interest = d.balance * d.rate;
      totalInterest += interest;
      const payment = Math.min(d.balance + interest, d.minPayment + (extraLeft > 0 ? extraLeft : 0));
      extraLeft = 0;
      d.balance = Math.max(0, d.balance + interest - payment);
      row[d.id] = Math.round(d.balance);
    }
    chartData.push(row);
  }

  const months = chartData.length;
  const payoffMonth = new Date();
  payoffMonth.setMonth(payoffMonth.getMonth() + months);
  const payoffDate = payoffMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Interest with minimum payments only (for savings calc)
  let minInterest = 0;
  const minBalances = parsed.map((d) => ({ ...d }));
  for (let m = 0; m < MAX_MONTHS; m++) {
    if (minBalances.every((d) => d.balance <= 0)) break;
    for (const d of minBalances) {
      if (d.balance <= 0) continue;
      const interest = d.balance * d.rate;
      minInterest += interest;
      d.balance = Math.max(0, d.balance + interest - d.minPayment);
    }
  }

  return {
    payoffDate,
    totalInterestPaid: Math.round(totalInterest),
    interestSaved: Math.round(Math.max(0, minInterest - totalInterest)),
    months,
    chartData: chartData.filter((_, i) => i % Math.max(1, Math.floor(months / 24)) === 0),
    debtNames: parsed.map((d) => ({ id: d.id, name: d.name })).map((d) => d.id),
  };
}

const DEBT_COLORS = ['#a12c7b', '#b45309', '#0e7490', '#437a22'];

function ChartTip({ active, payload, label, names }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string | number; names: Record<string, string> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card p-3 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">Month {label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#7a7974]">{names[p.dataKey] ?? p.dataKey}:</span>
          <span className="font-medium text-[#28251d]">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function DebtPayoffCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();

  const [debts, setDebts] = useState<Debt[]>([
    { id: 'd1', name: 'Credit Card', balance: '150000', rate: '36', minPayment: '5000' },
    { id: 'd2', name: 'Car Loan', balance: '500000', rate: '10', minPayment: '10000' },
    { id: 'd3', name: 'Personal Loan', balance: '200000', rate: '18', minPayment: '6000' },
  ]);
  const [extra, setExtra] = useState('5000');
  const [strategy, setStrategy] = useState<Strategy>('avalanche');
  const [result, setResult] = useState<DebtResult | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calcPayoff(debts, extra, strategy)); }, []);

  const updateDebt = (id: string, field: keyof Debt, value: string) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  };

  const addDebt = () => {
    if (debts.length >= 3) return;
    setDebts((prev) => [...prev, { id: `d${Date.now()}`, name: '', balance: '', rate: '', minPayment: '' }]);
  };

  const removeDebt = (id: string) => setDebts((prev) => prev.filter((d) => d.id !== id));

  const go = () => setResult(calcPayoff(debts, extra, strategy));

  const debtNameMap = Object.fromEntries(debts.map((d) => [d.id, d.name || 'Debt']));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#a12c7b]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#a12c7b]" /></div>
        <div><h2 className="text-base font-semibold text-[#28251d]">Debt Payoff Calculator</h2><p className="text-xs text-[#7a7974]">Avalanche or Snowball — eliminate debt faster</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Debts (up to 3)</p>

          {debts.map((d, i) => (
            <div key={d.id} className="space-y-2 p-3 bg-[#f7f6f2] rounded-[6px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#7a7974]">Debt {i + 1}</span>
                {debts.length > 1 && (
                  <button onClick={() => removeDebt(d.id)} className="text-[#a12c7b] hover:text-[#8a2468]"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
              <Input placeholder="Name (e.g. Credit Card)" value={d.name} onChange={(e) => updateDebt(d.id, 'name', e.target.value)} />
              <div className="grid grid-cols-3 gap-2">
                <Input type="number" placeholder="Balance ₹" value={d.balance} onChange={(e) => updateDebt(d.id, 'balance', e.target.value)} />
                <Input type="number" placeholder="Rate %" value={d.rate} onChange={(e) => updateDebt(d.id, 'rate', e.target.value)} />
                <Input type="number" placeholder="Min ₹/mo" value={d.minPayment} onChange={(e) => updateDebt(d.id, 'minPayment', e.target.value)} />
              </div>
            </div>
          ))}

          {debts.length < 3 && (
            <button onClick={addDebt} className="flex items-center gap-1.5 text-sm text-[#01696f] hover:text-[#0c4e54] font-medium transition-colors">
              <Plus className="w-4 h-4" /> Add Debt
            </button>
          )}

          <Input label="Extra Monthly Payment (₹)" type="number" placeholder="5000" value={extra} onChange={(e) => setExtra(e.target.value)} />

          <div className="space-y-2">
            <p className="text-sm font-medium text-[#28251d]">Strategy</p>
            <div className="flex rounded-[6px] border border-[#d4d2cc] overflow-hidden">
              {(['avalanche', 'snowball'] as Strategy[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={['flex-1 py-2 text-sm font-medium transition-colors', strategy === s ? 'bg-[#01696f] text-white' : 'bg-white text-[#7a7974] hover:bg-[#f7f6f2]'].join(' ')}
                >
                  {s === 'avalanche' ? 'Avalanche' : 'Snowball'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#7a7974]">
              {strategy === 'avalanche' ? 'Highest interest first — saves most money' : 'Lowest balance first — quick wins for motivation'}
            </p>
          </div>

          <Button variant="primary" size="md" className="w-full" onClick={go}>Calculate Payoff</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f7f6f2] rounded-[6px] p-4 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">Debt-Free By</p>
                    <p className="text-base font-bold text-[#437a22]">{result.payoffDate}</p>
                  </div>
                  <div className="bg-[#f7f6f2] rounded-[6px] p-4 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">Payoff Duration</p>
                    <p className="text-base font-bold text-[#28251d]">{result.months} months</p>
                  </div>
                  <div className="bg-[#f7f6f2] rounded-[6px] p-4 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">Total Interest Paid</p>
                    <p className="text-base font-bold text-[#a12c7b]">{formatINR(result.totalInterestPaid)}</p>
                  </div>
                  <div className="bg-[#437a22]/8 rounded-[6px] p-4 text-center">
                    <p className="text-[11px] text-[#437a22] mb-1">Interest Saved</p>
                    <p className="text-base font-bold text-[#437a22]">{formatINR(result.interestSaved)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Remaining Balance Over Time</p>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <defs>
                      {debts.map((d, i) => (
                        <linearGradient key={d.id} id={`grad_${d.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={DEBT_COLORS[i % DEBT_COLORS.length]} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={DEBT_COLORS[i % DEBT_COLORS.length]} stopOpacity={0.03} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                    <Tooltip content={<ChartTip names={debtNameMap} />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                    {debts.map((d, i) => (
                      <Area key={d.id} type="monotone" dataKey={d.id} name={d.name || `Debt ${i + 1}`} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={1.5} fill={`url(#grad_${d.id})`} dot={false} activeDot={{ r: 3 }} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Collapsible schedule preview */}
              <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
                <button onClick={() => setScheduleOpen((v) => !v)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#f7f6f2] transition-colors">
                  <span className="text-sm font-semibold text-[#28251d]">Payoff Schedule</span>
                  {scheduleOpen ? <ChevronUp className="w-4 h-4 text-[#7a7974]" /> : <ChevronDown className="w-4 h-4 text-[#7a7974]" />}
                </button>
                {scheduleOpen && (
                  <div className="border-t border-[#f0ede6] overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#f7f6f2]">
                          <th className="text-left px-4 py-2 text-[#7a7974] font-semibold">Month</th>
                          {debts.map((d) => <th key={d.id} className="text-right px-4 py-2 text-[#7a7974] font-semibold">{d.name || 'Debt'}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f7f6f2]">
                        {result.chartData.slice(0, 24).map((row) => (
                          <tr key={row.month} className="hover:bg-[#f7f6f2]">
                            <td className="px-4 py-1.5 text-[#28251d]">{row.month}</td>
                            {debts.map((d) => (
                              <td key={d.id} className="px-4 py-1.5 text-right text-[#7a7974]">{formatINR(row[d.id] ?? 0)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <CreditCard className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter your debts and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
