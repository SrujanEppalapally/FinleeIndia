import { useState, useEffect } from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ── Helpers ────────────────────────────────────────────────────

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}

interface EmiResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  principalPct: number;
  interestPct: number;
}

function calculateEmi(loan: string, rate: string, tenure: string): EmiResult | null {
  const P = parseFloat(loan);
  const annual = parseFloat(rate);
  const years = parseFloat(tenure);
  if (!P || !annual || !years || P <= 0 || annual <= 0 || years <= 0) return null;

  const r = annual / 12 / 100;
  const n = years * 12;
  const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalPayment = emi * n;
  const totalInterest = totalPayment - P;
  return {
    monthlyEmi: Math.round(emi),
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(totalPayment),
    principalPct: Math.round((P / totalPayment) * 100),
    interestPct: Math.round((totalInterest / totalPayment) * 100),
  };
}

// ── Custom Tooltip ─────────────────────────────────────────────

function PieTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d]">{payload[0].name}</p>
      <p className="text-[#7a7974] mt-0.5">{formatINR(payload[0].value)}</p>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function EmiCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();

  const [loan, setLoan] = useState('2000000');
  const [rate, setRate] = useState('8.5');
  const [tenure, setTenure] = useState('20');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<EmiResult | null>(null);

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

  useEffect(() => { setResult(calculateEmi(loan, rate, tenure)); }, []);

  const handleCalculate = () => {
    const errs: Record<string, string> = {};
    if (!loan || Number(loan) <= 0) errs.loan = 'Enter a valid loan amount';
    if (!rate || Number(rate) <= 0) errs.rate = 'Enter a valid interest rate';
    if (!tenure || Number(tenure) <= 0 || Number(tenure) > 40) errs.tenure = 'Enter 1–40 years';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calculateEmi(loan, rate, tenure));
  };

  const pieData = result ? [
    { name: 'Principal', value: parseFloat(loan) },
    { name: 'Interest', value: result.totalInterest },
  ] : [];

  const COLORS = ['#01696f', '#a12c7b'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#b45309]/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-[#b45309]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#28251d]">EMI Calculator</h2>
          <p className="text-xs text-[#7a7974]">Calculate your loan EMI and total interest</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input
            label="Loan Amount (₹)"
            type="number"
            placeholder="2000000"
            value={loan}
            onChange={(e) => { setLoan(e.target.value); setErrors((p) => ({ ...p, loan: '' })); }}
            error={errors.loan}
          />
          <Input
            label="Annual Interest Rate (%)"
            type="number"
            placeholder="8.5"
            value={rate}
            onChange={(e) => { setRate(e.target.value); setErrors((p) => ({ ...p, rate: '' })); }}
            error={errors.rate}
          />
          <Input
            label="Loan Tenure (Years)"
            type="number"
            placeholder="20"
            value={tenure}
            onChange={(e) => { setTenure(e.target.value); setErrors((p) => ({ ...p, tenure: '' })); }}
            error={errors.tenure}
          />
          <Button variant="primary" size="md" className="w-full mt-2" onClick={handleCalculate}>
            Calculate
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>

                {/* Monthly EMI — large */}
                <div className="py-4 border-y border-[#f0ede6]">
                  <p className="text-xs text-[#7a7974] font-medium mb-1">Monthly EMI</p>
                  <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.monthlyEmi)}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Total Interest Paid</p>
                    <p className="text-base font-bold text-[#a12c7b]">{formatINR(result.totalInterest)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Total Payment</p>
                    <p className="text-base font-bold text-[#28251d]">{formatINR(result.totalPayment)}</p>
                  </div>
                </div>
              </div>

              {/* Pie chart */}
              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">
                  Principal vs Interest
                </p>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip content={<PieTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: 11, color: '#7a7974' }}
                        iconType="circle"
                        iconSize={7}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-6 mt-2">
                  <div className="text-center">
                    <p className="text-xs text-[#7a7974]">Principal</p>
                    <p className="text-sm font-semibold text-[#01696f]">{result.principalPct}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[#7a7974]">Interest</p>
                    <p className="text-sm font-semibold text-[#a12c7b]">{result.interestPct}%</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Calculator className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter loan details and click Calculate</p>
              <p className="text-xs text-[#7a7974] mt-1">Your EMI breakdown will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
