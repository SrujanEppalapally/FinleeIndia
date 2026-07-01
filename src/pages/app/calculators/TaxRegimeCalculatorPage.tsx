import { useEffect } from 'react';
import { ArrowLeft, Scale, CheckCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

function calcOldTax(ti: number): number {
  let tax = 0;
  if (ti <= 250000) return 0;
  if (ti <= 500000) tax = (ti - 250000) * 0.05;
  else if (ti <= 1000000) tax = 12500 + (ti - 500000) * 0.2;
  else tax = 112500 + (ti - 1000000) * 0.3;
  if (ti <= 500000) tax = 0;
  return Math.round(tax + tax * 0.04);
}
function calcNewTax(ti: number): number {
  let tax = 0;
  const slabs = [[300000, 0], [700000, 0.05], [1000000, 0.1], [1200000, 0.15], [1500000, 0.2], [Infinity, 0.3]] as [number, number][];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    if (ti <= prev) break;
    tax += (Math.min(ti, limit) - prev) * rate;
    prev = limit;
  }
  if (ti <= 700000) tax = 0;
  return Math.round(tax + tax * 0.04);
}

interface TaxResult {
  oldTaxableIncome: number; newTaxableIncome: number;
  oldTax: number; newTax: number;
  oldDeductions: number; newDeductions: number;
  winner: 'old' | 'new' | 'equal'; savings: number;
}

function calc(v: Record<string, string>): TaxResult | null {
  const income = parseFloat(v.ctc);
  if (!income || income <= 0) return null;
  const ded80C = Math.min(parseFloat(v.c80 || '0'), 150000);
  const ded80D = Math.min(parseFloat(v.c80d || '0'), 25000);
  const dedHomeLoan = parseFloat(v.homeLoan || '0');
  const dedHra = parseFloat(v.hraExemption || '0');
  const oldDeductions = 50000 + ded80C + ded80D + dedHomeLoan + dedHra;
  const newDeductions = 75000;
  const oldTaxableIncome = Math.max(0, income - oldDeductions);
  const newTaxableIncome = Math.max(0, income - newDeductions);
  const oldTax = calcOldTax(oldTaxableIncome), newTax = calcNewTax(newTaxableIncome);
  const diff = oldTax - newTax;
  const winner: TaxResult['winner'] = diff > 0 ? 'new' : diff < 0 ? 'old' : 'equal';
  return { oldTaxableIncome, newTaxableIncome, oldTax, newTax, oldDeductions, newDeductions, winner, savings: Math.abs(diff) };
}

function BarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1">{label}</p>
      <p className="text-[#7a7974]">Tax: <span className="font-medium text-[#28251d]">{formatINR(payload[0].value)}</span></p>
    </div>
  );
}

const DEFAULTS = { ctc: '1500000', c80: '150000', c80d: '25000', homeLoan: '200000', hraExemption: '120000' };

const STEPS: StepDef[] = [
  {
    question: 'Annual Income / CTC',
    description: 'Your total annual income or Cost to Company.',
    fields: ['ctc'], fieldLabels: ['Annual Income'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.ctc} onChange={(val) => onChange('ctc', val)} prefix="₹" placeholder="1500000" min={1} error={errors.ctc} autoFocus />,
    validate: (v) => (!v.ctc || Number(v.ctc) <= 0) ? { ctc: 'Enter your annual income' } : {},
    formatReview: (v) => formatINR(parseFloat(v.ctc || '0')),
  },
  {
    question: '80C Investments',
    description: 'PPF, ELSS, LIC, EPF etc. — maximum ₹1.5 lakh allowed.',
    fields: ['c80'], fieldLabels: ['80C Amount'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.c80} onChange={(val) => onChange('c80', val)} prefix="₹" placeholder="150000" min={0} max={150000} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.c80 || '0')),
  },
  {
    question: '80D Health Insurance',
    description: 'Health insurance premium paid — maximum ₹25,000 for self/family.',
    fields: ['c80d'], fieldLabels: ['80D Amount'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.c80d} onChange={(val) => onChange('c80d', val)} prefix="₹" placeholder="25000" min={0} max={25000} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.c80d || '0')),
  },
  {
    question: 'Home Loan Interest',
    description: 'Annual interest paid on home loan (Section 24b deduction).',
    fields: ['homeLoan'], fieldLabels: ['Home Loan Interest'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.homeLoan} onChange={(val) => onChange('homeLoan', val)} prefix="₹" placeholder="200000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.homeLoan || '0')),
  },
  {
    question: 'HRA Exemption',
    description: 'Annual HRA exemption you are eligible for based on rent paid.',
    fields: ['hraExemption'], fieldLabels: ['HRA Exemption'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.hraExemption} onChange={(val) => onChange('hraExemption', val)} prefix="₹" placeholder="120000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.hraExemption || '0')),
  },
];

export function TaxRegimeCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calc(panel.values) : null;
  const barData = result ? [{ regime: 'Old Regime', tax: result.oldTax }, { regime: 'New Regime', tax: result.newTax }] : [];

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#6b7280]/10 flex items-center justify-center"><Scale className="w-5 h-5 text-[#6b7280]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Old vs New Tax Regime</h2><p className="text-xs text-[#7a7974]">Which regime saves you more tax?</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            {result.winner !== 'equal' && (
              <div className="bg-[#437a22]/8 border border-[#437a22]/20 rounded-[8px] p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#437a22] flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#437a22]">{result.winner === 'new' ? 'New Regime' : 'Old Regime'} saves you more</p>
                  <p className="text-xs text-[#437a22] mt-0.5">Save <strong>{formatINR(result.savings)}</strong> per year</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Old Regime', tax: result.oldTax, taxableIncome: result.oldTaxableIncome, deductions: result.oldDeductions, isWinner: result.winner === 'old' },
                { label: 'New Regime', tax: result.newTax, taxableIncome: result.newTaxableIncome, deductions: result.newDeductions, isWinner: result.winner === 'new' },
              ].map((card) => (
                <div key={card.label} className={`bg-white rounded-[8px] shadow-card p-4 ${card.isWinner ? 'ring-2 ring-[#437a22]/30' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">{card.label}</p>
                    {card.isWinner && <span className="text-[10px] font-semibold text-white bg-[#437a22] px-2 py-0.5 rounded-full">Better</span>}
                  </div>
                  <p className={`text-xl font-bold ${card.isWinner ? 'text-[#437a22]' : 'text-[#28251d]'}`}>{formatINR(card.tax)}</p>
                  <p className="text-[11px] text-[#7a7974] mt-0.5">Annual Tax</p>
                  <div className="mt-3 pt-3 border-t border-[#f0ede6] space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-[#7a7974]">Deductions</span><span className="font-medium text-[#28251d]">{formatINR(card.deductions)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[#7a7974]">Taxable</span><span className="font-medium text-[#28251d]">{formatINR(card.taxableIncome)}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-[#7a7974]">Monthly</span><span className="font-medium text-[#28251d]">{formatINR(card.tax / 12)}</span></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Tax Comparison</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="40%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" vertical={false} />
                  <XAxis dataKey="regime" tick={{ fontSize: 12, fill: '#7a7974' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: '#f7f6f2' }} />
                  <Bar dataKey="tax" name="Tax" radius={[4, 4, 0, 0]}>
                    {barData.map((_entry, i) => {
                      const isWinnerBar = (result.winner === 'old' && i === 0) || (result.winner === 'new' && i === 1);
                      return <Cell key={i} fill={isWinnerBar ? '#437a22' : '#d4d2cc'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Scale className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Compare old vs new tax regime</p><p className="text-xs text-[#7a7974] mt-1">5 quick questions to find your best regime</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
