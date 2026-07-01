import { useState, useEffect } from 'react';
import { ArrowLeft, Scale, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

function calcOldRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) tax = (taxableIncome - 250000) * 0.05;
  else if (taxableIncome <= 1000000) tax = 12500 + (taxableIncome - 500000) * 0.2;
  else tax = 112500 + (taxableIncome - 1000000) * 0.3;
  if (taxableIncome <= 500000) tax = 0;
  return Math.round(tax + tax * 0.04);
}

function calcNewRegimeTax(taxableIncome: number): number {
  let tax = 0;
  const slabs = [[300000, 0], [700000, 0.05], [1000000, 0.1], [1200000, 0.15], [1500000, 0.2], [Infinity, 0.3]] as [number, number][];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxableIncome <= prev) break;
    tax += (Math.min(taxableIncome, limit) - prev) * rate;
    prev = limit;
  }
  if (taxableIncome <= 700000) tax = 0;
  return Math.round(tax + tax * 0.04);
}

// ── Types ──────────────────────────────────────────────────────

interface TaxResult {
  oldTaxableIncome: number;
  newTaxableIncome: number;
  oldTax: number;
  newTax: number;
  oldDeductions: number;
  newDeductions: number;
  winner: 'old' | 'new' | 'equal';
  savings: number;
}

function calculateTax(
  ctc: string,
  c80: string,
  c80d: string,
  homeLoan: string,
  hraExemption: string
): TaxResult | null {
  const income = parseFloat(ctc);
  if (!income || income <= 0) return null;

  const ded80C = Math.min(parseFloat(c80 || '0'), 150000);
  const ded80D = Math.min(parseFloat(c80d || '0'), 25000);
  const dedHomeLoan = parseFloat(homeLoan || '0');
  const dedHra = parseFloat(hraExemption || '0');

  const OLD_STD = 50000;
  const NEW_STD = 75000;

  const oldDeductions = OLD_STD + ded80C + ded80D + dedHomeLoan + dedHra;
  const newDeductions = NEW_STD; // new regime: only standard deduction

  const oldTaxableIncome = Math.max(0, income - oldDeductions);
  const newTaxableIncome = Math.max(0, income - newDeductions);

  const oldTax = calcOldRegimeTax(oldTaxableIncome);
  const newTax = calcNewRegimeTax(newTaxableIncome);

  const diff = oldTax - newTax;
  const winner: 'old' | 'new' | 'equal' = diff > 0 ? 'new' : diff < 0 ? 'old' : 'equal';
  const savings = Math.abs(diff);

  return { oldTaxableIncome, newTaxableIncome, oldTax, newTax, oldDeductions, newDeductions, winner, savings };
}

// ── Custom Bar Tooltip ─────────────────────────────────────────

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-[#7a7974]">
          Tax: <span className="font-medium text-[#28251d]">{formatINR(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function TaxRegimeCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();

  const [ctc, setCtc] = useState('1500000');
  const [c80, setC80] = useState('150000');
  const [c80d, setC80d] = useState('25000');
  const [homeLoan, setHomeLoan] = useState('200000');
  const [hraExemption, setHraExemption] = useState('120000');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<TaxResult | null>(null);

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
    setResult(calculateTax(ctc, c80, c80d, homeLoan, hraExemption));
  }, []);

  const handleCalculate = () => {
    const errs: Record<string, string> = {};
    if (!ctc || Number(ctc) <= 0) errs.ctc = 'Enter a valid income';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calculateTax(ctc, c80, c80d, homeLoan, hraExemption));
  };

  const barData = result
    ? [
        { regime: 'Old Regime', tax: result.oldTax },
        { regime: 'New Regime', tax: result.newTax },
      ]
    : [];

  const WINNER_COLORS: Record<string, string> = { old: '#437a22', new: '#437a22' };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#6b7280]/10 flex items-center justify-center">
          <Scale className="w-5 h-5 text-[#6b7280]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#28251d]">Old vs New Tax Regime</h2>
          <p className="text-xs text-[#7a7974]">Which regime saves you more tax?</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input label="Annual Income / CTC (₹)" type="number" placeholder="1500000" value={ctc}
            onChange={(e) => { setCtc(e.target.value); setErrors((p) => ({ ...p, ctc: '' })); }}
            error={errors.ctc} />

          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide pt-1">Old Regime Deductions</p>
          </div>

          <Input label="80C Investments (₹, max ₹1.5L)" type="number" placeholder="150000" value={c80}
            onChange={(e) => setC80(e.target.value)} />
          <Input label="80D Health Insurance (₹, max ₹25K)" type="number" placeholder="25000" value={c80d}
            onChange={(e) => setC80d(e.target.value)} />
          <Input label="Home Loan Interest (₹)" type="number" placeholder="200000" value={homeLoan}
            onChange={(e) => setHomeLoan(e.target.value)} />
          <Input label="HRA Exemption (₹)" type="number" placeholder="120000" value={hraExemption}
            onChange={(e) => setHraExemption(e.target.value)} />

          <div className="text-xs text-[#7a7974] bg-[#f7f6f2] rounded-[6px] px-3 py-2">
            Standard deduction auto-applied: ₹50,000 (Old) · ₹75,000 (New)
          </div>

          <Button variant="primary" size="md" className="w-full" onClick={handleCalculate}>
            Compare Regimes
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              {/* Winner banner */}
              {result.winner !== 'equal' && (
                <div className="bg-[#437a22]/8 border border-[#437a22]/20 rounded-[8px] p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#437a22] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#437a22]">
                      {result.winner === 'new' ? 'New Regime' : 'Old Regime'} saves you more
                    </p>
                    <p className="text-xs text-[#437a22] mt-0.5">
                      Save <strong>{formatINR(result.savings)}</strong> per year with {result.winner === 'new' ? 'New Regime' : 'Old Regime'}
                    </p>
                  </div>
                </div>
              )}

              {/* Side-by-side comparison cards */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: 'Old Regime',
                    tax: result.oldTax,
                    taxableIncome: result.oldTaxableIncome,
                    deductions: result.oldDeductions,
                    isWinner: result.winner === 'old',
                    color: result.winner === 'old' ? 'text-[#437a22]' : 'text-[#28251d]',
                    ring: result.winner === 'old' ? 'ring-2 ring-[#437a22]/30' : '',
                  },
                  {
                    label: 'New Regime',
                    tax: result.newTax,
                    taxableIncome: result.newTaxableIncome,
                    deductions: result.newDeductions,
                    isWinner: result.winner === 'new',
                    color: result.winner === 'new' ? 'text-[#437a22]' : 'text-[#28251d]',
                    ring: result.winner === 'new' ? 'ring-2 ring-[#437a22]/30' : '',
                  },
                ].map((card) => (
                  <div key={card.label} className={`bg-white rounded-[8px] shadow-card p-4 ${card.ring}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">{card.label}</p>
                      {card.isWinner && (
                        <span className="text-[10px] font-semibold text-white bg-[#437a22] px-2 py-0.5 rounded-full">
                          Better
                        </span>
                      )}
                    </div>
                    <p className={`text-xl font-bold ${card.color}`}>{formatINR(card.tax)}</p>
                    <p className="text-[11px] text-[#7a7974] mt-0.5">Annual Tax</p>
                    <div className="mt-3 pt-3 border-t border-[#f0ede6] space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#7a7974]">Total Deductions</span>
                        <span className="font-medium text-[#28251d]">{formatINR(card.deductions)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#7a7974]">Taxable Income</span>
                        <span className="font-medium text-[#28251d]">{formatINR(card.taxableIncome)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[#7a7974]">Monthly Tax</span>
                        <span className="font-medium text-[#28251d]">{formatINR(card.tax / 12)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">
                  Tax Comparison
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="40%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
                    <XAxis dataKey="regime" tick={{ fontSize: 12, fill: '#7a7974' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false}
                      tickFormatter={formatYAxisINR} width={44} />
                    <Tooltip content={<BarTooltip />} cursor={{ fill: '#f7f6f2' }} />
                    <Bar dataKey="tax" name="Tax" radius={[4, 4, 0, 0]}>
                      {barData.map((_entry, i) => {
                        const isWinnerBar =
                          (result.winner === 'old' && i === 0) ||
                          (result.winner === 'new' && i === 1);
                        return <Cell key={i} fill={isWinnerBar ? WINNER_COLORS[result.winner] : '#d4d2cc'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Scale className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter your income and click Compare</p>
              <p className="text-xs text-[#7a7974] mt-1">See which tax regime saves you more</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
