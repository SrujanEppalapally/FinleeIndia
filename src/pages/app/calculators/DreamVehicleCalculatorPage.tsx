import { useState, useEffect } from 'react';
import { ArrowLeft, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

function calcVehicle(salary: string, price: string, downPct: string, rate: string, tenure: string, fuel: string, insurance: string): VehicleResult | null {
  const sal = parseFloat(salary);
  const pr = parseFloat(price);
  const dp = parseFloat(downPct) / 100;
  const r = parseFloat(rate) / 12 / 100;
  const n = parseFloat(tenure) * 12;
  const fu = parseFloat(fuel);
  const ins = parseFloat(insurance);
  if (!sal || !pr || isNaN(r) || !n || isNaN(fu) || isNaN(ins)) return null;

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
    ],
  };
}

const COLORS = ['#b45309', '#01696f', '#437a22', '#d4d2cc'];
const VERDICT_CFG = {
  affordable: { label: 'Affordable', icon: '✅', cls: 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' },
  manageable: { label: 'Manageable', icon: '⚠️', cls: 'bg-[#b45309]/10 text-[#b45309] border-[#b45309]/20' },
  expensive:  { label: 'Too Expensive', icon: '❌', cls: 'bg-[#a12c7b]/10 text-[#a12c7b] border-[#a12c7b]/20' },
};

function PieTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d]">{payload[0].name}</p>
      <p className="text-[#7a7974]">{formatINR(payload[0].value)}</p>
    </div>
  );
}

export function DreamVehicleCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const [f, setF] = useState({ salary: '80000', price: '800000', downPct: '20', rate: '9', tenure: '5', fuel: '4000', insurance: '3000' });
  const [result, setResult] = useState<VehicleResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calcVehicle(f.salary, f.price, f.downPct, f.rate, f.tenure, f.fuel, f.insurance)); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: '' })); };

  const go = () => {
    const errs: Record<string, string> = {};
    if (!f.salary || Number(f.salary) <= 0) errs.salary = 'Required';
    if (!f.price || Number(f.price) <= 0) errs.price = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calcVehicle(f.salary, f.price, f.downPct, f.rate, f.tenure, f.fuel, f.insurance));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center"><Car className="w-5 h-5 text-[#b45309]" /></div>
        <div><h2 className="text-base font-semibold text-[#28251d]">Dream Vehicle Eligibility</h2><p className="text-xs text-[#7a7974]">Can your salary afford this vehicle?</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input label="Monthly Take-Home Salary (₹)" type="number" placeholder="80000" value={f.salary} onChange={set('salary')} error={errors.salary} />
          <Input label="On-Road Vehicle Price (₹)" type="number" placeholder="800000" value={f.price} onChange={set('price')} error={errors.price} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Down Payment (%)" type="number" placeholder="20" value={f.downPct} onChange={set('downPct')} />
            <Input label="Loan Rate (%)" type="number" placeholder="9" value={f.rate} onChange={set('rate')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Loan Tenure (yrs)" type="number" placeholder="5" value={f.tenure} onChange={set('tenure')} />
            <Input label="Monthly Fuel (₹)" type="number" placeholder="4000" value={f.fuel} onChange={set('fuel')} />
          </div>
          <Input label="Insurance + Maintenance (₹/mo)" type="number" placeholder="3000" value={f.insurance} onChange={set('insurance')} />
          <Button variant="primary" size="md" className="w-full mt-2" onClick={go}>Calculate</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${VERDICT_CFG[result.verdict].cls}`}>
                    {VERDICT_CFG[result.verdict].icon} {VERDICT_CFG[result.verdict].label}
                  </span>
                </div>

                {/* Large % */}
                <div className="py-4 border-y border-[#f0ede6]">
                  <p className="text-xs text-[#7a7974] font-medium mb-1">% of Salary Going to Vehicle</p>
                  <p className={`text-4xl font-bold ${result.salaryPct < 15 ? 'text-[#437a22]' : result.salaryPct <= 25 ? 'text-[#b45309]' : 'text-[#a12c7b]'}`}>
                    {result.salaryPct}%
                  </p>
                </div>

                <div className="flex gap-4 pt-1">
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly EMI</p>
                    <p className="text-base font-bold text-[#28251d]">{formatINR(result.monthlyEmi)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Total Monthly Cost</p>
                    <p className="text-base font-bold text-[#b45309]">{formatINR(result.totalMonthlyCost)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Total Ownership Cost</p>
                    <p className="text-base font-bold text-[#28251d]">{formatINR(result.totalCostOwnership)}</p>
                  </div>
                </div>
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
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Car className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter details and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
