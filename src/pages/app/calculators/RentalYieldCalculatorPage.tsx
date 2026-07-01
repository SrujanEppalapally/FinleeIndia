import { useState, useEffect } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
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

interface RentalResult {
  grossYieldPct: number;
  netYieldPct: number;
  annualRentalIncome: number;
  totalRentalIncome: number;
  propertyValueEnd: number;
  irrPct: number;
  betterThanFd: boolean;
  chartData: { year: number; cumulativeRental: number; propertyValue: number }[];
}

function calcRental(
  price: string, monthlyRent: string, rentIncrease: string,
  maintenance: string, propertyTax: string, appreciation: string,
  holdingYears: string, taxSlab: string,
): RentalResult | null {
  const pr = parseFloat(price);
  const rent = parseFloat(monthlyRent);
  const ri = parseFloat(rentIncrease) / 100;
  const maint = parseFloat(maintenance || '0');
  const ptax = parseFloat(propertyTax || '0');
  const appr = parseFloat(appreciation) / 100;
  const years = parseInt(holdingYears, 10);
  const slab = parseFloat(taxSlab) / 100;
  if (!pr || !rent || !years) return null;

  const annualRent0 = rent * 12;
  const grossYieldPct = (annualRent0 / pr) * 100;

  // Net annual rent (first year): rent * (1-tax) - maintenance - property tax
  const netAnnualRent0 = annualRent0 * (1 - slab) - maint - ptax;
  const netYieldPct = (netAnnualRent0 / pr) * 100;

  let cumulativeRental = 0;
  const chartData: { year: number; cumulativeRental: number; propertyValue: number }[] = [];
  let totalRentalIncome = 0;

  for (let y = 1; y <= years; y++) {
    const rentThisYear = annualRent0 * Math.pow(1 + ri, y - 1);
    const netRentThisYear = rentThisYear * (1 - slab) - maint - ptax;
    totalRentalIncome += Math.max(0, netRentThisYear);
    cumulativeRental += Math.max(0, netRentThisYear);
    const propVal = pr * Math.pow(1 + appr, y);
    chartData.push({ year: y, cumulativeRental: Math.round(cumulativeRental), propertyValue: Math.round(propVal) });
  }

  const propertyValueEnd = pr * Math.pow(1 + appr, years);

  // Simple IRR approximation: total return / initial investment / years
  const totalReturn = totalRentalIncome + (propertyValueEnd - pr);
  const irrPct = (totalReturn / pr / years) * 100;

  return {
    grossYieldPct: Math.round(grossYieldPct * 100) / 100,
    netYieldPct: Math.round(netYieldPct * 100) / 100,
    annualRentalIncome: Math.round(annualRent0),
    totalRentalIncome: Math.round(totalRentalIncome),
    propertyValueEnd: Math.round(propertyValueEnd),
    irrPct: Math.round(irrPct * 100) / 100,
    betterThanFd: irrPct > 7,
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

export function RentalYieldCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const [f, setF] = useState({ price: '6000000', monthlyRent: '25000', rentIncrease: '5', maintenance: '30000', propertyTax: '12000', appreciation: '6', holdingYears: '10', taxSlab: '30' });
  const [result, setResult] = useState<RentalResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calcRental(f.price, f.monthlyRent, f.rentIncrease, f.maintenance, f.propertyTax, f.appreciation, f.holdingYears, f.taxSlab)); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: '' })); };

  const go = () => {
    const errs: Record<string, string> = {};
    if (!f.price || Number(f.price) <= 0) errs.price = 'Required';
    if (!f.monthlyRent || Number(f.monthlyRent) <= 0) errs.monthlyRent = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setResult(calcRental(f.price, f.monthlyRent, f.rentIncrease, f.maintenance, f.propertyTax, f.appreciation, f.holdingYears, f.taxSlab));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#437a22]/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-[#437a22]" /></div>
        <div><h2 className="text-base font-semibold text-[#28251d]">Rental Yield Calculator</h2><p className="text-xs text-[#7a7974]">Gross vs net yield and total return on your property</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
          <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
          <Input label="Property Purchase Price (₹)" type="number" placeholder="6000000" value={f.price} onChange={set('price')} error={errors.price} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Monthly Rent (₹)" type="number" placeholder="25000" value={f.monthlyRent} onChange={set('monthlyRent')} error={errors.monthlyRent} />
            <Input label="Annual Rent Increase (%)" type="number" placeholder="5" value={f.rentIncrease} onChange={set('rentIncrease')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Annual Maintenance (₹)" type="number" placeholder="30000" value={f.maintenance} onChange={set('maintenance')} />
            <Input label="Property Tax / yr (₹)" type="number" placeholder="12000" value={f.propertyTax} onChange={set('propertyTax')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Appreciation (%/yr)" type="number" placeholder="6" value={f.appreciation} onChange={set('appreciation')} />
            <Input label="Holding Period (yrs)" type="number" placeholder="10" value={f.holdingYears} onChange={set('holdingYears')} />
          </div>
          <Input label="Income Tax Slab (%)" type="number" placeholder="30" value={f.taxSlab} onChange={set('taxSlab')} />
          <Button variant="primary" size="md" className="w-full mt-2" onClick={go}>Calculate</Button>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {result ? (
            <>
              <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${result.betterThanFd ? 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' : 'bg-[#a12c7b]/10 text-[#a12c7b] border-[#a12c7b]/20'}`}>
                    {result.betterThanFd ? '✅ Better than FD (7%)' : '❌ Worse than FD (7%)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#f7f6f2] rounded-[6px] p-4 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">Gross Rental Yield</p>
                    <p className="text-2xl font-bold text-[#437a22]">{result.grossYieldPct}%</p>
                  </div>
                  <div className="bg-[#f7f6f2] rounded-[6px] p-4 text-center">
                    <p className="text-[11px] text-[#7a7974] mb-1">Net Rental Yield</p>
                    <p className="text-2xl font-bold text-[#01696f]">{result.netYieldPct}%</p>
                  </div>
                </div>

                <div className="space-y-0 divide-y divide-[#f0ede6]">
                  {[
                    { label: 'Annual Rental Income', value: formatINR(result.annualRentalIncome) },
                    { label: `Total Rental Income (${f.holdingYears} yrs, after tax)`, value: formatINR(result.totalRentalIncome) },
                    { label: 'Property Value at End', value: formatINR(result.propertyValueEnd), color: 'text-[#437a22]' },
                    { label: 'Estimated IRR %', value: `${result.irrPct}%` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between py-2.5">
                      <span className="text-sm text-[#7a7974]">{row.label}</span>
                      <span className={`text-sm font-semibold ${row.color ?? 'text-[#28251d]'}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[8px] shadow-card p-5">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Cumulative Rental vs Property Value</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={result.chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={44} />
                    <Tooltip content={<ChartTip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={7} />
                    <Line type="monotone" dataKey="cumulativeRental" name="Cumulative Rental" stroke="#01696f" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#01696f' }} />
                    <Line type="monotone" dataKey="propertyValue" name="Property Value" stroke="#437a22" strokeWidth={2} strokeDasharray="5 3" dot={false} activeDot={{ r: 3, fill: '#437a22' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
              <Building2 className="w-10 h-10 text-[#d4d2cc] mb-3" />
              <p className="text-sm font-medium text-[#28251d]">Enter property details and click Calculate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
