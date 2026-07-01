import { useEffect } from 'react';
import { ArrowLeft, Car, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalcPanel, StepInput, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}

interface VehicleResult {
  monthlyEmi: number;
  totalMonthlyCost: number;
  salaryPct: number;
  totalCostOwnership: number;
  verdict: 'affordable' | 'manageable' | 'expensive';
  pieData: { name: string; value: number }[];
}

function calc(v: Record<string, string>): VehicleResult | null {
  const sal = parseFloat(v.salary), pr = parseFloat(v.price), dp = parseFloat(v.downPct) / 100;
  const r = parseFloat(v.rate) / 12 / 100, n = parseFloat(v.tenure) * 12;
  const fu = parseFloat(v.fuel || '0'), ins = parseFloat(v.insurance || '0');
  if (!sal || !pr || isNaN(r) || !n) return null;
  const loan = pr * (1 - dp);
  const emi = (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalMonthlyCost = emi + fu + ins;
  const salaryPct = (totalMonthlyCost / sal) * 100;
  const totalCostOwnership = emi * n + fu * n + ins * n + pr * dp;
  const verdict: VehicleResult['verdict'] = salaryPct < 15 ? 'affordable' : salaryPct <= 25 ? 'manageable' : 'expensive';
  const remaining = Math.max(0, sal - totalMonthlyCost);
  return {
    monthlyEmi: Math.round(emi),
    totalMonthlyCost: Math.round(totalMonthlyCost),
    salaryPct: Math.round(salaryPct * 10) / 10,
    totalCostOwnership: Math.round(totalCostOwnership),
    verdict,
    pieData: [
      { name: 'EMI', value: Math.round(emi) },
      { name: 'Fuel', value: Math.round(fu) },
      { name: 'Insurance & Maint.', value: Math.round(ins) },
      { name: 'Remaining Salary', value: Math.round(remaining) },
    ].filter((d) => d.value > 0),
  };
}

const VERDICT_CFG = {
  affordable: { label: 'Affordable', cls: 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' },
  manageable: { label: 'Manageable', cls: 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20' },
  expensive:  { label: 'Too Expensive', cls: 'bg-[#a12c7b]/10 text-[#a12c7b] border-[#a12c7b]/20' },
};
const COLORS = ['#b45309', '#01696f', '#437a22', '#d4d2cc'];

function PieTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d]">{payload[0].name}</p>
      <p className="text-[#7a7974]">{formatINR(payload[0].value)}</p>
    </div>
  );
}

const DEFAULTS = { salary: '80000', price: '800000', downPct: '20', rate: '9', tenure: '5', fuel: '4000', insurance: '3000' };

const STEPS: StepDef[] = [
  {
    question: 'Monthly Take-Home Salary',
    description: 'Your net monthly income after all deductions.',
    fields: ['salary'], fieldLabels: ['Monthly Salary'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.salary} onChange={(val) => onChange('salary', val)} prefix="₹" placeholder="80000" min={1} error={errors.salary} autoFocus />,
    validate: (v) => (!v.salary || Number(v.salary) <= 0) ? { salary: 'Enter your monthly salary' } : {},
    formatReview: (v) => formatINR(parseFloat(v.salary || '0')),
  },
  {
    question: 'On-Road Vehicle Price',
    description: 'Total cost of the vehicle including registration and insurance.',
    fields: ['price'], fieldLabels: ['Vehicle Price'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.price} onChange={(val) => onChange('price', val)} prefix="₹" placeholder="800000" min={1} error={errors.price} autoFocus />,
    validate: (v) => (!v.price || Number(v.price) <= 0) ? { price: 'Enter the vehicle price' } : {},
    formatReview: (v) => formatINR(parseFloat(v.price || '0')),
  },
  {
    question: 'Down Payment',
    description: 'Percentage of vehicle price you will pay upfront.',
    fields: ['downPct'], fieldLabels: ['Down Payment'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.downPct} onChange={(val) => onChange('downPct', val)} suffix="% of price" placeholder="20" min={0} max={100} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.downPct}%`,
  },
  {
    question: 'Loan Interest Rate',
    description: 'Annual interest rate on your vehicle loan.',
    fields: ['rate'], fieldLabels: ['Loan Rate'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.rate} onChange={(val) => onChange('rate', val)} suffix="% per year" placeholder="9" min={1} max={30} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.rate}%`,
  },
  {
    question: 'Loan Tenure',
    description: 'Number of years to repay the vehicle loan.',
    fields: ['tenure'], fieldLabels: ['Loan Tenure'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.tenure} onChange={(val) => onChange('tenure', val)} suffix="years" placeholder="5" min={1} max={10} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.tenure} years`,
  },
  {
    question: 'Monthly Fuel Cost',
    description: 'Estimated monthly fuel expenses for the vehicle.',
    fields: ['fuel'], fieldLabels: ['Fuel Cost'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.fuel} onChange={(val) => onChange('fuel', val)} prefix="₹" placeholder="4000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.fuel || '0')),
  },
  {
    question: 'Insurance & Maintenance',
    description: 'Monthly insurance premium and maintenance costs combined.',
    fields: ['insurance'], fieldLabels: ['Insurance & Maint.'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.insurance} onChange={(val) => onChange('insurance', val)} prefix="₹" placeholder="3000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.insurance || '0')),
  },
];

export function DreamVehicleCalculatorPage() {
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
          <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center"><Car className="w-5 h-5 text-[#b45309]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Dream Vehicle Eligibility</h2><p className="text-xs text-[#7a7974]">Can your salary afford this vehicle?</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-1">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${VERDICT_CFG[result.verdict].cls}`}>{VERDICT_CFG[result.verdict].label}</span>
              </div>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">% of Salary Going to Vehicle</p>
                <p className={`text-4xl font-bold ${result.salaryPct < 15 ? 'text-[#437a22]' : result.salaryPct <= 25 ? 'text-[#b45309]' : 'text-[#a12c7b]'}`}>{result.salaryPct}%</p>
              </div>
              {[
                { label: 'Monthly EMI', value: formatINR(result.monthlyEmi) },
                { label: 'Total Monthly Cost', value: formatINR(result.totalMonthlyCost), color: 'text-[#b45309]' },
                { label: 'Total Ownership Cost', value: formatINR(result.totalCostOwnership) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-[#f7f6f2] last:border-0">
                  <span className="text-sm text-[#7a7974]">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color ?? 'text-[#28251d]'}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Salary Breakdown</p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={result.pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" stroke="none">
                    {result.pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974' }} iconType="circle" iconSize={7} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Car className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Check your vehicle affordability</p><p className="text-xs text-[#7a7974] mt-1">7 quick questions to see EMI and salary breakdown</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
