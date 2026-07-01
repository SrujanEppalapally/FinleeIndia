import { useEffect } from 'react';
import { ArrowLeft, Plane, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalcPanel, StepInput, StepTextInput, useCalcPanel } from './CalcPanel';
import type { StepDef } from './CalcPanel';

function formatINR(n: number): string {
  const a = Math.abs(n);
  if (a >= 1_00_00_000) return `₹${(a / 1_00_00_000).toFixed(2)} Cr`;
  if (a >= 1_00_000) return `₹${(a / 1_00_000).toFixed(2)} L`;
  if (a >= 1_000) return `₹${(a / 1_000).toFixed(1)} K`;
  return `₹${a.toLocaleString('en-IN')}`;
}

interface TripResult {
  totalCost: number;
  perPersonCost: number;
  pieData: { name: string; value: number }[];
}

function calc(v: Record<string, string>): TripResult | null {
  const t = parseInt(v.travellers, 10), d = parseInt(v.days, 10);
  const fl = parseFloat(v.flightPP || '0'), ht = parseFloat(v.hotelPerNight || '0');
  const fo = parseFloat(v.foodPP || '0'), vi = parseFloat(v.visa || '0');
  const sh = parseFloat(v.shopping || '0'), buf = parseFloat(v.bufferPct || '10') / 100;
  if (!t || !d) return null;
  const flights = fl * t, hotel = ht * d, food = fo * d * t;
  const buffer = (flights + hotel + food + vi + sh) * buf;
  const totalCost = Math.round(flights + hotel + food + vi + sh + buffer);
  const perPersonCost = Math.round(totalCost / t);
  return {
    totalCost, perPersonCost,
    pieData: [
      { name: 'Flights', value: Math.round(flights) },
      { name: 'Hotel', value: Math.round(hotel) },
      { name: 'Food & Activities', value: Math.round(food) },
      { name: 'Visa / Insurance', value: Math.round(vi) },
      { name: 'Shopping', value: Math.round(sh) },
      { name: 'Buffer', value: Math.round(buffer) },
    ].filter((d) => d.value > 0),
  };
}

const COLORS = ['#01696f', '#0e7490', '#437a22', '#b45309', '#a12c7b', '#7a7974'];

function PieTip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d]">{payload[0].name}</p>
      <p className="text-[#7a7974]">{formatINR(payload[0].value)}</p>
    </div>
  );
}

const DEFAULTS = {
  destination: 'Thailand', travellers: '2', days: '7',
  flightPP: '25000', hotelPerNight: '5000', foodPP: '2000',
  visa: '8000', shopping: '15000', bufferPct: '10',
};

const STEPS: StepDef[] = [
  {
    question: 'Destination',
    description: 'Where are you planning to travel?',
    fields: ['destination'], fieldLabels: ['Destination'],
    renderInput: ({ values: v, onChange }) => <StepTextInput value={v.destination} onChange={(val) => onChange('destination', val)} placeholder="e.g. Thailand" />,
    validate: () => ({}),
    formatReview: (v) => v.destination || 'Unknown',
  },
  {
    question: 'Number of Travellers',
    description: 'How many people are going on this trip?',
    fields: ['travellers'], fieldLabels: ['Travellers'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.travellers} onChange={(val) => onChange('travellers', val)} suffix="people" placeholder="2" min={1} max={20} error={errors.travellers} autoFocus />,
    validate: (v) => (!v.travellers || Number(v.travellers) <= 0) ? { travellers: 'Enter number of travellers' } : {},
    formatReview: (v) => `${v.travellers} people`,
  },
  {
    question: 'Trip Duration',
    description: 'How many days will you be travelling?',
    fields: ['days'], fieldLabels: ['Duration'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.days} onChange={(val) => onChange('days', val)} suffix="days" placeholder="7" min={1} max={365} error={errors.days} autoFocus />,
    validate: (v) => (!v.days || Number(v.days) <= 0) ? { days: 'Enter number of days' } : {},
    formatReview: (v) => `${v.days} days`,
  },
  {
    question: 'Flight Cost per Person',
    description: 'Round-trip flight cost per traveller.',
    fields: ['flightPP'], fieldLabels: ['Flight per Person'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.flightPP} onChange={(val) => onChange('flightPP', val)} prefix="₹" placeholder="25000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.flightPP || '0')),
  },
  {
    question: 'Hotel Cost per Night',
    description: 'Total hotel cost per night for the group.',
    fields: ['hotelPerNight'], fieldLabels: ['Hotel per Night'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.hotelPerNight} onChange={(val) => onChange('hotelPerNight', val)} prefix="₹" placeholder="5000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${formatINR(parseFloat(v.hotelPerNight || '0'))}/night`,
  },
  {
    question: 'Daily Food & Activities per Person',
    description: 'Average daily spend on food and activities per traveller.',
    fields: ['foodPP'], fieldLabels: ['Food per Person/Day'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.foodPP} onChange={(val) => onChange('foodPP', val)} prefix="₹" placeholder="2000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${formatINR(parseFloat(v.foodPP || '0'))}/day`,
  },
  {
    question: 'Visa & Travel Insurance',
    description: 'Total visa fees and travel insurance for all travellers.',
    fields: ['visa'], fieldLabels: ['Visa & Insurance'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.visa} onChange={(val) => onChange('visa', val)} prefix="₹" placeholder="8000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.visa || '0')),
  },
  {
    question: 'Shopping Budget',
    description: 'Total shopping budget for the entire trip.',
    fields: ['shopping'], fieldLabels: ['Shopping'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.shopping} onChange={(val) => onChange('shopping', val)} prefix="₹" placeholder="15000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.shopping || '0')),
  },
  {
    question: 'Buffer for Unexpected Expenses',
    description: 'Extra percentage added for unforeseen costs.',
    fields: ['bufferPct'], fieldLabels: ['Buffer'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.bufferPct} onChange={(val) => onChange('bufferPct', val)} suffix="% buffer" placeholder="10" min={0} max={50} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.bufferPct}%`,
  },
];

export function TripBudgetCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calc(panel.values) : null;
  const monthlySaving = result && panel.values.months && Number(panel.values.months) > 0
    ? Math.ceil(result.totalCost / Number(panel.values.months))
    : null;

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0e7490]/10 flex items-center justify-center"><Plane className="w-5 h-5 text-[#0e7490]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Trip Budget Planner</h2><p className="text-xs text-[#7a7974]">Plan your holiday cost and monthly savings</p></div>
        </div>
        {result ? (
          <div className="space-y-4" style={{ opacity: panel.showResult ? 1 : 0, transform: panel.showResult ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 250ms ease, transform 250ms ease' }}>
            <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">
                {panel.values.destination ? `Results — ${panel.values.destination}` : 'Results'}
              </p>
              <div className="py-4 border-y border-[#f0ede6]">
                <p className="text-xs text-[#7a7974] font-medium mb-1">Total Trip Cost</p>
                <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.totalCost)}</p>
                <p className="text-xs text-[#7a7974] mt-1">Per person: {formatINR(result.perPersonCost)}</p>
              </div>
              <div className="bg-[#f7f6f2] rounded-[8px] p-4 space-y-3">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Monthly Saving Plan</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    placeholder="12"
                    value={panel.values.months ?? '12'}
                    onChange={(e) => panel.onChange('months', e.target.value)}
                    className="w-24 h-9 rounded-[6px] border border-[#d4d2cc] px-3 text-sm text-[#28251d] focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]"
                  />
                  <span className="text-sm text-[#7a7974]">months until trip</span>
                </div>
                {monthlySaving !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a7974]">Save monthly</span>
                    <span className="text-base font-bold text-[#01696f]">{formatINR(monthlySaving)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white rounded-[8px] shadow-card p-5">
              <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide mb-4">Cost Breakdown</p>
              <ResponsiveContainer width="100%" height={230}>
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
            <Plane className="w-12 h-12 text-[#d4d2cc]" />
            <div><p className="text-sm font-medium text-[#28251d]">Plan your dream trip</p><p className="text-xs text-[#7a7974] mt-1">9 quick questions to estimate total cost</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calc(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
    </>
  );
}
