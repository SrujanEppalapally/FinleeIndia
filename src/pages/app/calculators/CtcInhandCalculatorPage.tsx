import { useState, useEffect } from 'react';
import { ArrowLeft, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Select } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';

// ── Helpers ────────────────────────────────────────────────────

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}

function formatRs(n: number): string {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

// ── Tax calculation helpers ────────────────────────────────────

function calcOldRegimeTax(taxableIncome: number): number {
  let tax = 0;
  if (taxableIncome <= 250000) return 0;
  if (taxableIncome <= 500000) { tax = (taxableIncome - 250000) * 0.05; }
  else if (taxableIncome <= 1000000) { tax = 12500 + (taxableIncome - 500000) * 0.2; }
  else { tax = 112500 + (taxableIncome - 1000000) * 0.3; }
  // 87A rebate
  if (taxableIncome <= 500000) tax = 0;
  return tax + tax * 0.04; // +4% cess
}

function calcNewRegimeTax(taxableIncome: number): number {
  let tax = 0;
  const slabs = [
    [300000, 0],
    [700000, 0.05],
    [1000000, 0.1],
    [1200000, 0.15],
    [1500000, 0.2],
    [Infinity, 0.3],
  ] as [number, number][];
  let prev = 0;
  for (const [limit, rate] of slabs) {
    if (taxableIncome <= prev) break;
    const chunk = Math.min(taxableIncome, limit) - prev;
    tax += chunk * rate;
    prev = limit;
  }
  // 87A rebate for new regime up to 7L
  if (taxableIncome <= 700000) tax = 0;
  return tax + tax * 0.04;
}

// ── Main calculation ───────────────────────────────────────────

interface CtcResult {
  annualCtc: number;
  annualBasic: number;
  monthlyBasic: number;
  monthlyHra: number;
  monthlyPf: number;
  monthlyGross: number;
  monthlyProfTax: number;
  monthlyTax: number;
  monthlyInHand: number;
  hraExemption: number;
  regime: 'old' | 'new';
}

function calculateCtc(
  ctc: string,
  basicPct: string,
  hraPct: string,
  pfPct: string,
  city: string,
  profTax: string,
  regime: 'old' | 'new'
): CtcResult | null {
  const annualCtc = parseFloat(ctc);
  if (!annualCtc || annualCtc <= 0) return null;

  const basicFraction = parseFloat(basicPct) / 100;
  const hraFraction = parseFloat(hraPct) / 100;
  const pfFraction = parseFloat(pfPct) / 100;
  const profTaxMonthly = parseFloat(profTax);

  const annualBasic = annualCtc * basicFraction;
  const monthlyBasic = annualBasic / 12;
  const monthlyHra = monthlyBasic * hraFraction;
  const monthlyPf = monthlyBasic * pfFraction;
  const monthlyGross = annualCtc / 12;

  // HRA exemption (old regime): min of actual HRA, 50%/40% of basic, rent paid - 10% basic
  // We calculate the theoretical max HRA exemption assuming rent = HRA
  const rentFraction = city === 'metro' ? 0.5 : 0.4;
  const hraExemption = Math.min(
    monthlyHra,
    monthlyBasic * rentFraction,
    monthlyHra // rent paid - 10% basic (assume rent = HRA paid)
  );

  // Annual taxable income
  const annualPf = monthlyPf * 12;
  const annualStdDed = regime === 'old' ? 50000 : 75000;
  const annualHraExemption = regime === 'old' ? hraExemption * 12 : 0;

  const grossIncome = annualCtc - annualPf;
  const taxableIncome = Math.max(0, grossIncome - annualStdDed - annualHraExemption);
  const annualTax = regime === 'old' ? calcOldRegimeTax(taxableIncome) : calcNewRegimeTax(taxableIncome);
  const monthlyTax = annualTax / 12;
  const monthlyInHand = monthlyGross - monthlyPf - profTaxMonthly - monthlyTax;

  return {
    annualCtc,
    annualBasic,
    monthlyBasic,
    monthlyHra,
    monthlyPf,
    monthlyGross,
    monthlyProfTax: profTaxMonthly,
    monthlyTax,
    monthlyInHand,
    hraExemption,
    regime,
  };
}

// ── Main Page ──────────────────────────────────────────────────

export function CtcInhandCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();

  const [ctc, setCtc] = useState('1200000');
  const [basicPct, setBasicPct] = useState('40');
  const [hraPct, setHraPct] = useState('50');
  const [pfPct, setPfPct] = useState('12');
  const [city, setCity] = useState('metro');
  const [profTax, setProfTax] = useState('200');
  const [regime, setRegime] = useState<'old' | 'new'>('new');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CtcResult | null>(null);

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
    setResult(calculateCtc(ctc, basicPct, hraPct, pfPct, city, profTax, regime));
  }, []);

  const handleCalculate = () => {
    const errs: Record<string, string> = {};
    if (!ctc || Number(ctc) <= 0) errs.ctc = 'Enter a valid CTC';
    if (!basicPct || Number(basicPct) < 20 || Number(basicPct) > 80) errs.basicPct = 'Enter 20–80%';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calculateCtc(ctc, basicPct, hraPct, pfPct, city, profTax, regime));
  };

  const deductions = result ? [
    { label: 'Employee PF (12% of Basic)', value: result.monthlyPf, color: 'text-[#a12c7b]' },
    { label: 'Professional Tax', value: result.monthlyProfTax, color: 'text-[#a12c7b]' },
    { label: 'Income Tax (monthly)', value: result.monthlyTax, color: 'text-[#a12c7b]' },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#0e7490]/10 flex items-center justify-center">
          <IndianRupee className="w-5 h-5 text-[#0e7490]" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-[#28251d]">CTC → In-Hand</h2>
          <p className="text-xs text-[#7a7974]">Calculate your actual monthly take-home salary</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Inputs */}
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input label="Annual CTC (₹)" type="number" placeholder="1200000" value={ctc}
            onChange={(e) => { setCtc(e.target.value); setErrors((p) => ({ ...p, ctc: '' })); }}
            error={errors.ctc} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Basic % of CTC" type="number" placeholder="40" value={basicPct}
              onChange={(e) => { setBasicPct(e.target.value); setErrors((p) => ({ ...p, basicPct: '' })); }}
              error={errors.basicPct} />
            <Input label="HRA % of Basic" type="number" placeholder="50" value={hraPct}
              onChange={(e) => setHraPct(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="PF % of Basic" type="number" placeholder="12" value={pfPct}
              onChange={(e) => setPfPct(e.target.value)} />
            <Input label="Professional Tax (₹/mo)" type="number" placeholder="200" value={profTax}
              onChange={(e) => setProfTax(e.target.value)} />
          </div>
          <Select
            label="City Type"
            options={[
              { value: 'metro', label: 'Metro (Mumbai/Delhi/Kolkata/Chennai)' },
              { value: 'non-metro', label: 'Non-Metro' },
            ]}
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          {/* Regime toggle */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-[#28251d]">Income Tax Regime</p>
            <div className="flex rounded-[6px] border border-[#d4d2cc] overflow-hidden">
              {(['old', 'new'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={[
                    'flex-1 py-2 text-sm font-medium transition-colors',
                    regime === r
                      ? 'bg-[#01696f] text-white'
                      : 'bg-white text-[#7a7974] hover:bg-[#f7f6f2]',
                  ].join(' ')}
                >
                  {r === 'old' ? 'Old Regime' : 'New Regime'}
                </button>
              ))}
            </div>
          </div>

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

                <div className="py-4 border-y border-[#f0ede6]">
                  <p className="text-xs text-[#7a7974] font-medium mb-1">Monthly In-Hand Salary</p>
                  <p className="text-3xl font-bold text-[#437a22]">{formatRs(result.monthlyInHand)}</p>
                  <p className="text-xs text-[#7a7974] mt-1">Annual: {formatINR(result.monthlyInHand * 12)}</p>
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly Gross</p>
                    <p className="text-sm font-bold text-[#28251d]">{formatRs(result.monthlyGross)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">Monthly Basic</p>
                    <p className="text-sm font-bold text-[#28251d]">{formatRs(result.monthlyBasic)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#7a7974] font-medium mb-0.5">HRA</p>
                    <p className="text-sm font-bold text-[#28251d]">{formatRs(result.monthlyHra)}</p>
                  </div>
                </div>
              </div>

              {/* Deductions table */}
              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-3">
                  Monthly Deductions Breakdown
                </p>
                <div className="space-y-0 divide-y divide-[#f0ede6]">
                  <div className="flex justify-between py-2.5">
                    <span className="text-sm text-[#28251d]">Monthly Gross</span>
                    <span className="text-sm font-semibold text-[#28251d]">{formatRs(result.monthlyGross)}</span>
                  </div>
                  {deductions.map((d) => (
                    <div key={d.label} className="flex justify-between py-2.5">
                      <span className="text-sm text-[#7a7974]">- {d.label}</span>
                      <span className={`text-sm font-medium ${d.color}`}>{formatRs(d.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-3 bg-[#f7f6f2] -mx-5 px-5 mt-1">
                    <span className="text-sm font-bold text-[#28251d]">Monthly In-Hand</span>
                    <span className="text-sm font-bold text-[#437a22]">{formatRs(result.monthlyInHand)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#7a7974] mt-3">
                  {result.regime === 'old' ? 'Old Regime' : 'New Regime'} · Standard deduction ₹{result.regime === 'old' ? '50,000' : '75,000'}/yr applied
                </p>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <IndianRupee className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter your CTC details and click Calculate</p>
              <p className="text-xs text-[#7a7974] mt-1">Your salary breakdown will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
