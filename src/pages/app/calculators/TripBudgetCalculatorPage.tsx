import { useState, useEffect } from 'react';
import { ArrowLeft, Plane, Share2, Target, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Select } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { useToast } from '../../../contexts/ToastContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { GOAL_TYPES } from '../../../constants/goalTypes';

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

function calcTrip(
  travellers: string, days: string, flightPP: string, hotelPerNight: string,
  foodPP: string, visa: string, shopping: string, bufferPct: string,
): TripResult | null {
  const t = parseInt(travellers, 10);
  const d = parseInt(days, 10);
  const fl = parseFloat(flightPP || '0');
  const ht = parseFloat(hotelPerNight || '0');
  const fo = parseFloat(foodPP || '0');
  const vi = parseFloat(visa || '0');
  const sh = parseFloat(shopping || '0');
  const buf = parseFloat(bufferPct || '10') / 100;
  if (!t || !d) return null;

  const flights = fl * t;
  const hotel = ht * d;
  const food = fo * d * t;
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
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Goal Name"
            placeholder="e.g. Trip to Thailand"
            value={name}
            onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
            error={errors.name}
          />
          <Select
            label="Goal Type"
            options={goalTypeOptions}
            value={type}
            onChange={(e) => setType(e.target.value)}
          />
          <Input
            label="Target Amount (₹)"
            type="number"
            placeholder="e.g. 100000"
            value={targetAmount}
            onChange={(e) => { setTargetAmount(e.target.value); setErrors((p) => ({ ...p, targetAmount: '' })); }}
            error={errors.targetAmount}
          />
          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium text-[#28251d]">Target Date</label>
            <input
              type="month"
              value={targetDate}
              onChange={(e) => { setTargetDate(e.target.value); setErrors((p) => ({ ...p, targetDate: '' })); }}
              className={[
                'w-full h-10 rounded-[6px] border bg-white text-[#28251d] text-sm px-3',
                'transition-colors focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
                errors.targetDate ? 'border-[#a12c7b]' : 'border-[#d4d2cc] hover:border-[#7a7974]',
              ].join(' ')}
            />
            {errors.targetDate && <p className="text-xs text-[#a12c7b]">{errors.targetDate}</p>}
          </div>
          <Input
            label="Current Savings (₹)"
            type="number"
            placeholder="0"
            value={savedAmount}
            onChange={(e) => setSavedAmount(e.target.value)}
          />
          <Input
            label="Monthly Contribution (₹)"
            type="number"
            placeholder="0"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(e.target.value)}
          />
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Goal</Button>
        </div>
      </div>
    </div>
  );
}

export function TripBudgetCalculatorPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const { showToast } = useToast();
  const [f, setF] = useState({
    destination: 'Thailand', travellers: '2', days: '7',
    flightPP: '25000', hotelPerNight: '5000', foodPP: '2000',
    visa: '8000', shopping: '15000', bufferPct: '10',
  });
  const [monthsUntil, setMonthsUntil] = useState('12');
  const [result, setResult] = useState<TripResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalSaved, setGoalSaved] = useState(false);

  useEffect(() => {
    setActions(<button onClick={() => navigate('/calculators')} className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"><ArrowLeft className="w-4 h-4" /><span className="hidden sm:inline">All Calculators</span></button>);
    return () => setActions(null);
  }, [setActions, navigate]);

  useEffect(() => { setResult(calcTrip(f.travellers, f.days, f.flightPP, f.hotelPerNight, f.foodPP, f.visa, f.shopping, f.bufferPct)); }, []);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => { setF((p) => ({ ...p, [k]: e.target.value })); setErrors((p) => ({ ...p, [k]: '' })); };

  const go = () => {
    const errs: Record<string, string> = {};
    if (!f.travellers || Number(f.travellers) <= 0) errs.travellers = 'Required';
    if (!f.days || Number(f.days) <= 0) errs.days = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setGoalSaved(false);
    setResult(calcTrip(f.travellers, f.days, f.flightPP, f.hotelPerNight, f.foodPP, f.visa, f.shopping, f.bufferPct));
  };

  const monthlySaving = result && monthsUntil && Number(monthsUntil) > 0
    ? Math.ceil(result.totalCost / Number(monthsUntil))
    : null;

  const handleShare = async () => {
    if (!result) return;
    const dest = f.destination || 'Unknown';
    const buffer = result.pieData.find((d) => d.name === 'Buffer')?.value ?? 0;
    const flights = result.pieData.find((d) => d.name === 'Flights')?.value ?? 0;
    const hotel = result.pieData.find((d) => d.name === 'Hotel')?.value ?? 0;
    const food = result.pieData.find((d) => d.name === 'Food & Activities')?.value ?? 0;
    const visa = result.pieData.find((d) => d.name === 'Visa / Insurance')?.value ?? 0;
    const shopping = result.pieData.find((d) => d.name === 'Shopping')?.value ?? 0;
    const savingLine = monthlySaving && monthsUntil
      ? `\n📅 Save ${formatINR(monthlySaving)}/month for ${monthsUntil} months`
      : '';

    const text = [
      `🏖️ Trip to ${dest}`,
      `👥 ${f.travellers} traveller${Number(f.travellers) !== 1 ? 's' : ''} | ${f.days} days`,
      `✈️ Flights: ${formatINR(flights)} | 🏨 Hotel: ${formatINR(hotel)}`,
      `🍽️ Food & Activities: ${formatINR(food)}`,
      `🧾 Visa/Insurance: ${formatINR(visa)} | 🛍️ Shopping: ${formatINR(shopping)}`,
      `⚡ Buffer: ${formatINR(buffer)}`,
      `💰 Total: ${formatINR(result.totalCost)} (${formatINR(result.perPersonCost)} per person)`,
      savingLine.trim(),
      `— Planned with Finley`,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      showToast('Summary copied to clipboard ✓');
    }
  };

  const handleGoalSave = () => {
    setGoalOpen(false);
    setGoalSaved(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0e7490]/10 flex items-center justify-center"><Plane className="w-5 h-5 text-[#0e7490]" /></div>
          <div><h2 className="text-base font-semibold text-[#28251d]">Trip Budget Planner</h2><p className="text-xs text-[#7a7974]">Plan your holiday cost and monthly savings</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-2 bg-white rounded-[8px] shadow-card p-5 space-y-4">
            <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Inputs</p>
            <Input label="Destination" type="text" placeholder="e.g. Thailand" value={f.destination} onChange={set('destination')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Travellers" type="number" placeholder="2" value={f.travellers} onChange={set('travellers')} error={errors.travellers} />
              <Input label="Trip Duration (days)" type="number" placeholder="7" value={f.days} onChange={set('days')} error={errors.days} />
            </div>
            <Input label="Flight Cost per Person (₹)" type="number" placeholder="25000" value={f.flightPP} onChange={set('flightPP')} />
            <Input label="Hotel per Night (₹)" type="number" placeholder="5000" value={f.hotelPerNight} onChange={set('hotelPerNight')} />
            <Input label="Daily Food + Activities per Person (₹)" type="number" placeholder="2000" value={f.foodPP} onChange={set('foodPP')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Visa + Insurance (₹)" type="number" placeholder="8000" value={f.visa} onChange={set('visa')} />
              <Input label="Shopping (₹)" type="number" placeholder="15000" value={f.shopping} onChange={set('shopping')} />
            </div>
            <Input label="Buffer % for Unexpected" type="number" placeholder="10" value={f.bufferPct} onChange={set('bufferPct')} />
            <Button variant="primary" size="md" className="w-full mt-2" onClick={go}>Calculate</Button>
          </div>

          <div className="lg:col-span-3 space-y-4">
            {result ? (
              <>
                <div className="bg-white rounded-[8px] shadow-card p-5 space-y-4">
                  <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">
                    {f.destination ? `Results — ${f.destination}` : 'Results'}
                  </p>
                  <div className="py-4 border-y border-[#f0ede6]">
                    <p className="text-xs text-[#7a7974] font-medium mb-1">Total Trip Cost</p>
                    <p className="text-3xl font-bold text-[#28251d]">{formatINR(result.totalCost)}</p>
                    <p className="text-xs text-[#7a7974] mt-1">Per person: {formatINR(result.perPersonCost)}</p>
                  </div>

                  {/* Monthly saving calculator */}
                  <div className="bg-[#f7f6f2] rounded-[8px] p-4 space-y-3">
                    <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Monthly Saving Plan</p>
                    <Input
                      label="Months until trip"
                      type="number"
                      placeholder="12"
                      value={monthsUntil}
                      onChange={(e) => setMonthsUntil(e.target.value)}
                    />
                    {monthlySaving !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#7a7974]">Save monthly</span>
                        <span className="text-base font-bold text-[#01696f]">{formatINR(monthlySaving)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="gap-1.5 flex-1" onClick={handleShare}>
                      <Share2 className="w-4 h-4" />
                      Share Breakdown
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      className="gap-1.5 flex-1"
                      onClick={() => { setGoalSaved(false); setGoalOpen(true); }}
                    >
                      <Target className="w-4 h-4" />
                      Add as Goal
                    </Button>
                  </div>

                  {/* Goal saved confirmation banner */}
                  {goalSaved && (
                    <div className="flex items-center justify-between bg-[#437a22]/10 border border-[#437a22]/20 rounded-[6px] px-4 py-2.5">
                      <span className="text-sm font-medium text-[#437a22]">Goal added successfully</span>
                      <Link
                        to="/goals"
                        className="text-sm font-semibold text-[#01696f] hover:underline"
                      >
                        View in Goals →
                      </Link>
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
              </>
            ) : (
              <div className="bg-white rounded-[8px] shadow-card p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <Plane className="w-10 h-10 text-[#d4d2cc] mb-3" />
                <p className="text-sm font-medium text-[#28251d]">Enter trip details and click Calculate</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {goalOpen && result && (
        <AddGoalModal
          defaultName={`Trip to ${f.destination || 'Unknown'}`}
          defaultType="travel"
          defaultTarget={String(result.totalCost)}
          defaultMonthly={monthlySaving ? String(monthlySaving) : ''}
          onSave={handleGoalSave}
          onClose={() => setGoalOpen(false)}
        />
      )}
    </>
  );
}
