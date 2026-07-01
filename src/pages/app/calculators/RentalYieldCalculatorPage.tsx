import { useEffect } from 'react';
import { ArrowLeft, Building2, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

function calc(v: Record<string, string>): RentalResult | null {
  const pr = parseFloat(v.price), rent = parseFloat(v.monthlyRent);
  const ri = parseFloat(v.rentIncrease) / 100, maint = parseFloat(v.maintenance || '0');
  const ptax = parseFloat(v.propertyTax || '0'), appr = parseFloat(v.appreciation) / 100;
  const years = parseInt(v.holdingYears, 10), slab = parseFloat(v.taxSlab) / 100;
  if (!pr || !rent || !years) return null;
  const annualRent0 = rent * 12;
  const grossYieldPct = (annualRent0 / pr) * 100;
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

const TAX_SLAB_OPTIONS = [
  { value: '0', label: '0%', description: 'No tax' },
  { value: '5', label: '5%', description: 'Low' },
  { value: '20', label: '20%', description: 'Medium' },
  { value: '30', label: '30%', description: 'High' },
];

const DEFAULTS = { price: '6000000', monthlyRent: '25000', rentIncrease: '5', maintenance: '30000', propertyTax: '12000', appreciation: '6', holdingYears: '10', taxSlab: '30' };

const STEPS: StepDef[] = [
  {
    question: 'Property Purchase Price',
    description: 'The price you will pay to buy the property.',
    fields: ['price'], fieldLabels: ['Property Price'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.price} onChange={(val) => onChange('price', val)} prefix="₹" placeholder="6000000" min={1} error={errors.price} autoFocus />,
    validate: (v) => (!v.price || Number(v.price) <= 0) ? { price: 'Enter the property price' } : {},
    formatReview: (v) => formatINR(parseFloat(v.price || '0')),
  },
  {
    question: 'Monthly Rent',
    description: 'Current monthly rent the property can earn.',
    fields: ['monthlyRent'], fieldLabels: ['Monthly Rent'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.monthlyRent} onChange={(val) => onChange('monthlyRent', val)} prefix="₹" placeholder="25000" min={1} error={errors.monthlyRent} autoFocus />,
    validate: (v) => (!v.monthlyRent || Number(v.monthlyRent) <= 0) ? { monthlyRent: 'Enter monthly rent' } : {},
    formatReview: (v) => `${formatINR(parseFloat(v.monthlyRent || '0'))}/month`,
  },
  {
    question: 'Annual Rent Increase',
    description: 'Expected yearly increase in rental income.',
    fields: ['rentIncrease'], fieldLabels: ['Rent Increase'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.rentIncrease} onChange={(val) => onChange('rentIncrease', val)} suffix="% per year" placeholder="5" min={0} max={20} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.rentIncrease}% per year`,
  },
  {
    question: 'Annual Maintenance Cost',
    description: 'Total annual repairs and maintenance expenses.',
    fields: ['maintenance'], fieldLabels: ['Annual Maintenance'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.maintenance} onChange={(val) => onChange('maintenance', val)} prefix="₹" placeholder="30000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.maintenance || '0')),
  },
  {
    question: 'Annual Property Tax',
    description: 'Yearly property tax paid to local authorities.',
    fields: ['propertyTax'], fieldLabels: ['Property Tax'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.propertyTax} onChange={(val) => onChange('propertyTax', val)} prefix="₹" placeholder="12000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.propertyTax || '0')),
  },
  {
    question: 'Property Appreciation Rate',
    description: 'Expected annual appreciation in property value.',
    fields: ['appreciation'], fieldLabels: ['Appreciation'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.appreciation} onChange={(val) => onChange('appreciation', val)} suffix="% per year" placeholder="6" min={0} max={20} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.appreciation}% per year`,
  },
  {
    question: 'Holding Period',
    description: 'How many years do you plan to hold the property?',
    fields: ['holdingYears'], fieldLabels: ['Holding Period'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.holdingYears} onChange={(val) => onChange('holdingYears', val)} suffix="years" placeholder="10" min={1} max={30} error={errors.holdingYears} autoFocus />,
    validate: (v) => (!v.holdingYears || Number(v.holdingYears) <= 0) ? { holdingYears: 'Enter holding period' } : {},
    formatReview: (v) => `${v.holdingYears} years`,
  },
  {
    question: 'Income Tax Slab',
    description: 'Your income tax bracket — rental income is taxed at your slab rate.',
    fields: ['taxSlab'], fieldLabels: ['Tax Slab'],
    renderInput: ({ values: v, onChange }) => <OptionCards<string> options={TAX_SLAB_OPTIONS} value={v.taxSlab} onChange={(val) => onChange('taxSlab', val)} />,
    validate: () => ({}),
    formatReview: (v) => `${v.taxSlab}% slab`,
  },
];

export function RentalYieldCalculatorPage() {
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
          <div className="w-9 h-9 rounded-full bg-[#437a22]/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-[#437a22]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Rental Yield Calculator</h2><p className="text-xs text-[#7a7974]">Gross vs net yield and total return on your property</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Results</p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${result.betterThanFd ? 'bg-[#437a22]/10 text-[#437a22] border-[#437a22]/20' : 'bg-[#a12c7b]/10 text-[#a12c7b] border-[#a12c7b]/20'}`}>
                  {result.betterThanFd ? 'Better than FD (7%)' : 'Worse than FD (7%)'}
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
              {[
                { label: 'Annual Rental Income', value: formatINR(result.annualRentalIncome) },
                { label: `Total Rental Income (${panel.values.holdingYears} yrs, after tax)`, value: formatINR(result.totalRentalIncome) },
                { label: 'Property Value at End', value: formatINR(result.propertyValueEnd), color: 'text-[#437a22]' },
                { label: 'Estimated IRR', value: `${result.irrPct}%` },
              ].map((row) => (
                <div key={row.label} className="flex justify-between py-2 border-b border-[#f7f6f2] last:border-0">
                  <span className="text-sm text-[#7a7974]">{row.label}</span>
                  <span className={`text-sm font-semibold ${row.color ?? 'text-[#28251d]'}`}>{row.value}</span>
                </div>
              ))}
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
            <div className="flex gap-3">
              <button onClick={panel.openPanel} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#01696f] text-[#01696f] text-sm font-medium hover:bg-[#01696f]/8 transition-colors"><RefreshCw className="w-3.5 h-3.5" /> Recalculate</button>
              <button onClick={() => panel.reset(DEFAULTS)} className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] border border-[#d4d2cc] text-[#7a7974] text-sm font-medium hover:bg-[#f0ede6] transition-colors"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[260px] space-y-4">
            <Building2 className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Analyse your rental investment</p><p className="text-xs text-[#7a7974] mt-1">8 questions to see gross, net yield and IRR</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
