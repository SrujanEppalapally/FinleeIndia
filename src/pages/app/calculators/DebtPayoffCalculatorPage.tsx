import { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Plus, Trash2, ChevronDown, ChevronUp, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CalcPanel, StepInput, OptionCards, useCalcPanel } from './CalcPanel';
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
  debtNames: Record<string, string>;
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
  let balances = parsed.map((d) => ({ ...d }));
  const chartData: MonthData[] = [];
  let totalInterest = 0;
  const MAX_MONTHS = 600;
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
  const debtNames = Object.fromEntries(parsed.map((d) => [d.id, d.name]));
  return { payoffDate, totalInterestPaid: Math.round(totalInterest), interestSaved: Math.round(Math.max(0, minInterest - totalInterest)), months, chartData: chartData.filter((_, i) => i % Math.max(1, Math.floor(months / 24)) === 0), debtNames };
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

const DEFAULT_DEBTS: Debt[] = [
  { id: 'd1', name: 'Credit Card', balance: '150000', rate: '36', minPayment: '5000' },
  { id: 'd2', name: 'Car Loan', balance: '500000', rate: '10', minPayment: '10000' },
  { id: 'd3', name: 'Personal Loan', balance: '200000', rate: '18', minPayment: '6000' },
];
const DEFAULTS = { extra: '5000', strategy: 'avalanche' };

function DebtEntryWidget({ debts, onChange, onAdd, onRemove }: {
  debts: Debt[];
  onChange: (id: string, field: keyof Debt, value: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {debts.map((d, i) => (
        <div key={d.id} className="space-y-2 p-3 bg-[#f7f6f2] rounded-[6px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#7a7974]">Debt {i + 1}</span>
            {debts.length > 1 && <button onClick={() => onRemove(d.id)} className="text-[#a12c7b] hover:text-[#8a2468]"><Trash2 className="w-3.5 h-3.5" /></button>}
          </div>
          <input
            type="text"
            placeholder="Name (e.g. Credit Card)"
            value={d.name}
            onChange={(e) => onChange(d.id, 'name', e.target.value)}
            className="w-full h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-[#28251d] text-sm px-3 outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]"
          />
          <div className="grid grid-cols-3 gap-2">
            {[
              { field: 'balance' as keyof Debt, placeholder: 'Balance ₹' },
              { field: 'rate' as keyof Debt, placeholder: 'Rate %' },
              { field: 'minPayment' as keyof Debt, placeholder: 'Min ₹/mo' },
            ].map(({ field, placeholder }) => (
              <input
                key={field}
                type="number"
                placeholder={placeholder}
                value={d[field]}
                onChange={(e) => onChange(d.id, field, e.target.value)}
                className="w-full h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-[#28251d] text-sm px-2 outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            ))}
          </div>
        </div>
      ))}
      {debts.length < 3 && (
        <button onClick={onAdd} className="flex items-center gap-1.5 text-sm text-[#01696f] hover:text-[#0c4e54] font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add another debt
        </button>
      )}
    </div>
  );
}

export function DebtPayoffCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const [debts, setDebts] = useState<Debt[]>(DEFAULT_DEBTS);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const result = panel.hasResult ? calcPayoff(debts, panel.values.extra, panel.values.strategy as Strategy) : null;

  const updateDebt = (id: string, field: keyof Debt, value: string) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, [field]: value } : d));
  };
  const addDebt = () => {
    if (debts.length >= 3) return;
    setDebts((prev) => [...prev, { id: `d${Date.now()}`, name: '', balance: '', rate: '', minPayment: '' }]);
  };
  const removeDebt = (id: string) => setDebts((prev) => prev.filter((d) => d.id !== id));

  const STEPS: StepDef[] = [
    {
      question: 'Your Debts',
      description: 'Enter up to 3 debts with balance, rate, and minimum payment.',
      fields: ['debts'], fieldLabels: ['Debts'],
      renderInput: () => (
        <DebtEntryWidget debts={debts} onChange={updateDebt} onAdd={addDebt} onRemove={removeDebt} />
      ),
      validate: () => {
        const hasValid = debts.some((d) => parseFloat(d.balance) > 0 && parseFloat(d.minPayment) > 0);
        if (!hasValid) return { debts: 'Enter at least one valid debt' };
        return {};
      },
      formatReview: () => `${debts.filter((d) => parseFloat(d.balance) > 0).length} debt(s) entered`,
    },
    {
      question: 'Extra Monthly Payment',
      description: 'Any additional amount beyond minimum payments you can put towards debt.',
      fields: ['extra'], fieldLabels: ['Extra Payment'],
      renderInput: ({ values: v, onChange }) => <StepInput value={v.extra} onChange={(val) => onChange('extra', val)} prefix="₹" suffix="per month" placeholder="5000" min={0} autoFocus />,
      validate: () => ({}),
      formatReview: (v) => v.extra && Number(v.extra) > 0 ? `${formatINR(parseFloat(v.extra))}/month extra` : 'No extra payment',
    },
    {
      question: 'Payoff Strategy',
      description: 'Choose how to prioritise which debt to attack first.',
      fields: ['strategy'], fieldLabels: ['Strategy'],
      renderInput: ({ values: v, onChange }) => (
        <OptionCards<Strategy>
          options={[
            { value: 'avalanche', label: 'Avalanche', description: 'Highest interest rate first — saves the most total interest' },
            { value: 'snowball', label: 'Snowball', description: 'Lowest balance first — quick wins keep you motivated' },
          ]}
          value={v.strategy as Strategy}
          onChange={(val) => onChange('strategy', val)}
        />
      ),
      validate: () => ({}),
      formatReview: (v) => v.strategy === 'avalanche' ? 'Avalanche (highest interest first)' : 'Snowball (lowest balance first)',
    },
  ];

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#a12c7b]/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-[#a12c7b]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Debt Payoff Calculator</h2><p className="text-xs text-[#7a7974]">Avalanche or Snowball — eliminate debt faster</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
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
                  <Tooltip content={<ChartTip names={result.debtNames} />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                  {debts.map((d, i) => (
                    <Area key={d.id} type="monotone" dataKey={d.id} name={d.name || `Debt ${i + 1}`} stroke={DEBT_COLORS[i % DEBT_COLORS.length]} strokeWidth={1.5} fill={`url(#grad_${d.id})`} dot={false} activeDot={{ r: 3 }} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
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
                          {debts.map((d) => <td key={d.id} className="px-4 py-1.5 text-right text-[#7a7974]">{formatINR(row[d.id] ?? 0)}</td>)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => { panel.reset(DEFAULTS); setDebts(DEFAULT_DEBTS); }} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <CreditCard className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Eliminate your debts faster</p><p className="text-xs text-[#7a7974] mt-1">3 quick steps to see your payoff timeline</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calcPayoff(debts, panel.values.extra, panel.values.strategy as Strategy))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
