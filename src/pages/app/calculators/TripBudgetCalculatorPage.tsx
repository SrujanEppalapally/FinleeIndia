import { useState, useEffect } from 'react';
import { ArrowLeft, Plane, Share2, Target, X, RefreshCw, RotateCcw } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Select } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { useToast } from '../../../contexts/ToastContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GOAL_TYPES } from '../../../constants/goalTypes';
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

function calcTrip(v: Record<string, string>): TripResult | null {
  const t = parseInt(v.travellers, 10), d = parseInt(v.days, 10);
  if (!t || !d) return null;
  const fl = parseFloat(v.flightPP || '0'), ht = parseFloat(v.hotelPerNight || '0');
  const fo = parseFloat(v.foodPP || '0'), vi = parseFloat(v.visa || '0');
  const sh = parseFloat(v.shopping || '0'), buf = parseFloat(v.bufferPct || '10') / 100;
  const flights = fl * t, hotel = ht * d, food = fo * d * t;
  const buffer = (flights + hotel + food + vi + sh) * buf;
  const totalCost = Math.round(flights + hotel + food + vi + sh + buffer);
  const perPersonCost = Math.round(totalCost / t);
  return {
    totalCost,
    perPersonCost,
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

const goalTypeOptions = GOAL_TYPES.map((g) => ({ value: g.id, label: `${g.emoji} ${g.label}` }));

interface AddGoalModalProps {
  defaultName: string;
  defaultType: string;
  defaultTarget: string;
  defaultMonthly: string;
  onSave: () => void;
  onClose: () => void;
}

function AddGoalModal({ defaultName, defaultType, defaultTarget, defaultMonthly, onSave, onClose }: AddGoalModalProps) {
  const [name, setName] = useState(defaultName);
  const [type, setType] = useState(defaultType);
  const [targetAmount, setTargetAmount] = useState(defaultTarget);
  const [targetDate, setTargetDate] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState(defaultMonthly);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Goal name is required';
    if (!targetAmount || Number(targetAmount) <= 0) errs.targetAmount = 'Enter a valid target amount';
    if (!targetDate) errs.targetDate = 'Target date is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
          <h3 className="text-base font-semibold text-[#28251d]">Add Goal</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Input label="Goal Name" placeholder="e.g. Trip to Thailand" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }} error={errors.name} />
          <Select label="Goal Type" options={goalTypeOptions} value={type} onChange={(e) => setType(e.target.value)} />
          <Input label="Target Amount (₹)" type="number" placeholder="e.g. 100000" value={targetAmount} onChange={(e) => { setTargetAmount(e.target.value); setErrors((p) => ({ ...p, targetAmount: '' })); }} error={errors.targetAmount} />
          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-[#28251d]">Target Date</label>
            <input type="month" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); setErrors((p) => ({ ...p, targetDate: '' })); }} className={['w-full h-10 rounded-[6px] border bg-white text-[#28251d] text-sm px-3 transition-colors focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]', errors.targetDate ? 'border-[#a12c7b]' : 'border-[#d4d2cc] hover:border-[#7a7974]'].join(' ')} />
            {errors.targetDate && <p className="text-xs text-[#a12c7b]">{errors.targetDate}</p>}
          </div>
          <Input label="Current Savings (₹)" type="number" placeholder="0" value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} />
          <Input label="Monthly Contribution (₹)" type="number" placeholder="0" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Goal</Button>
        </div>
      </div>
    </div>
  );
}

const DEFAULTS = { destination: 'Thailand', travellers: '2', days: '7', flightPP: '25000', hotelPerNight: '5000', foodPP: '2000', visa: '8000', shopping: '15000', bufferPct: '10' };

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
    description: 'How many people are going on the trip?',
    fields: ['travellers'], fieldLabels: ['Travellers'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.travellers} onChange={(val) => onChange('travellers', val)} suffix="travellers" placeholder="2" min={1} max={20} error={errors.travellers} autoFocus />,
    validate: (v) => (!v.travellers || Number(v.travellers) <= 0) ? { travellers: 'Enter number of travellers' } : {},
    formatReview: (v) => `${v.travellers} travellers`,
  },
  {
    question: 'Trip Duration',
    description: 'How many days will the trip last?',
    fields: ['days'], fieldLabels: ['Trip Duration'],
    renderInput: ({ values: v, onChange, errors }) => <StepInput value={v.days} onChange={(val) => onChange('days', val)} suffix="days" placeholder="7" min={1} max={90} error={errors.days} autoFocus />,
    validate: (v) => (!v.days || Number(v.days) <= 0) ? { days: 'Enter trip duration' } : {},
    formatReview: (v) => `${v.days} days`,
  },
  {
    question: 'Flight Cost per Person',
    description: 'Return flight ticket cost per person.',
    fields: ['flightPP'], fieldLabels: ['Flight Cost'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.flightPP} onChange={(val) => onChange('flightPP', val)} prefix="₹" suffix="per person" placeholder="25000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${formatINR(parseFloat(v.flightPP || '0'))}/person`,
  },
  {
    question: 'Hotel Cost per Night',
    description: 'Total hotel cost per night for the group.',
    fields: ['hotelPerNight'], fieldLabels: ['Hotel Cost'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.hotelPerNight} onChange={(val) => onChange('hotelPerNight', val)} prefix="₹" suffix="per night" placeholder="5000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${formatINR(parseFloat(v.hotelPerNight || '0'))}/night`,
  },
  {
    question: 'Daily Food & Activities',
    description: 'Food and activity budget per person per day.',
    fields: ['foodPP'], fieldLabels: ['Food & Activities'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.foodPP} onChange={(val) => onChange('foodPP', val)} prefix="₹" suffix="per person/day" placeholder="2000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${formatINR(parseFloat(v.foodPP || '0'))}/person/day`,
  },
  {
    question: 'Visa & Insurance',
    description: 'Total visa fees and travel insurance for all travellers.',
    fields: ['visa'], fieldLabels: ['Visa & Insurance'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.visa} onChange={(val) => onChange('visa', val)} prefix="₹" placeholder="8000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.visa || '0')),
  },
  {
    question: 'Shopping Budget',
    description: 'Total shopping and souvenir budget for all travellers.',
    fields: ['shopping'], fieldLabels: ['Shopping'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.shopping} onChange={(val) => onChange('shopping', val)} prefix="₹" placeholder="15000" min={0} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => formatINR(parseFloat(v.shopping || '0')),
  },
  {
    question: 'Buffer Percentage',
    description: 'Extra percentage to cover unexpected expenses.',
    fields: ['bufferPct'], fieldLabels: ['Buffer %'],
    renderInput: ({ values: v, onChange }) => <StepInput value={v.bufferPct} onChange={(val) => onChange('bufferPct', val)} suffix="% buffer" placeholder="10" min={0} max={50} autoFocus />,
    validate: () => ({}),
    formatReview: (v) => `${v.bufferPct}% buffer`,
  },
];

export function TripBudgetCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const { showToast } = useToast();
  const panel = useCalcPanel(DEFAULTS);
  const result = panel.hasResult ? calcTrip(panel.values) : null;
  const [monthsUntil, setMonthsUntil] = useState('12');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  const monthlySaving = result && monthsUntil && Number(monthsUntil) > 0
    ? Math.ceil(result.totalCost / Number(monthsUntil))
    : null;

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { if (!panel.hasResult) panel.openPanel(); }, []);

  const handleShare = async () => {
    if (!result) return;
    const dest = panel.values.destination || 'Unknown';
    const buffer = result.pieData.find((d) => d.name === 'Buffer')?.value ?? 0;
    const flights = result.pieData.find((d) => d.name === 'Flights')?.value ?? 0;
    const hotel = result.pieData.find((d) => d.name === 'Hotel')?.value ?? 0;
    const food = result.pieData.find((d) => d.name === 'Food & Activities')?.value ?? 0;
    const visa = result.pieData.find((d) => d.name === 'Visa / Insurance')?.value ?? 0;
    const shopping = result.pieData.find((d) => d.name === 'Shopping')?.value ?? 0;
    const savingLine = monthlySaving && monthsUntil ? `\nSave ${formatINR(monthlySaving)}/month for ${monthsUntil} months` : '';
    const text = [`Trip to ${dest}`, `${panel.values.travellers} traveller${Number(panel.values.travellers) !== 1 ? 's' : ''} | ${panel.values.days} days`, `Flights: ${formatINR(flights)} | Hotel: ${formatINR(hotel)}`, `Food & Activities: ${formatINR(food)}`, `Visa/Insurance: ${formatINR(visa)} | Shopping: ${formatINR(shopping)}`, `Buffer: ${formatINR(buffer)}`, `Total: ${formatINR(result.totalCost)} (${formatINR(result.perPersonCost)} per person)`, savingLine.trim(), `— Planned with Finley`].filter(Boolean).join('\n');
    if (navigator.share) { await navigator.share({ text }); } else { await navigator.clipboard.writeText(text); showToast('Summary copied to clipboard'); }
  };

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
                <p className="text-4xl font-bold text-[#28251d]">{formatINR(result.totalCost)}</p>
                <p className="text-xs text-[#7a7974] mt-1">Per person: {formatINR(result.perPersonCost)}</p>
              </div>
              <div className="bg-[#f7f6f2] rounded-[8px] p-4 space-y-3">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Monthly Saving Plan</p>
                <Input label="Months until trip" type="number" placeholder="12" value={monthsUntil} onChange={(e) => setMonthsUntil(e.target.value)} />
                {monthlySaving !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a7974]">Save monthly</span>
                    <span className="text-base font-bold text-[#01696f]">{formatINR(monthlySaving)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="gap-1.5 flex-1" onClick={handleShare}><Share2 className="w-4 h-4" /> Share Breakdown</Button>
                <Button variant="primary" size="sm" className="gap-1.5 flex-1" onClick={() => { setGoalSaved(false); setGoalOpen(true); }}><Target className="w-4 h-4" /> Add as Goal</Button>
              </div>
              {goalSaved && (
                <div className="flex items-center justify-between bg-[#437a22]/10 border border-[#437a22]/20 rounded-[6px] px-4 py-2.5">
                  <span className="text-sm font-medium text-[#437a22]">Goal added successfully</span>
                  <Link to="/goals" className="text-sm font-semibold text-[#01696f] hover:underline">View in Goals →</Link>
                </div>
              )}
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
            <div><p className="text-sm font-medium text-[#28251d]">Plan your dream trip</p><p className="text-xs text-[#7a7974] mt-1">9 quick questions to see your total trip budget</p></div>
            <button onClick={panel.openPanel} className="h-10 px-6 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors">Start</button>
          </div>
        )}
      </div>
      <CalcPanel isOpen={panel.isOpen} onClose={panel.closePanel} onCalculate={() => panel.onCalculate(() => calcTrip(panel.values))} steps={STEPS} values={panel.values} onChange={panel.onChange} errors={panel.errors} setErrors={panel.setErrors} currentStep={panel.currentStep} setCurrentStep={panel.setCurrentStep} returnToReview={panel.returnToReview} setReturnToReview={panel.setReturnToReview} />
      {goalOpen && result && (
        <AddGoalModal
          defaultName={`Trip to ${panel.values.destination || 'Unknown'}`}
          defaultType="travel"
          defaultTarget={String(result.totalCost)}
          defaultMonthly={monthlySaving ? String(monthlySaving) : ''}
          onSave={() => { setGoalOpen(false); setGoalSaved(true); }}
          onClose={() => setGoalOpen(false)}
        />
      )}
    </>
  );
}
