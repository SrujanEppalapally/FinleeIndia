import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Target, X, ChevronRight } from 'lucide-react';
import { Button, Input, Select, Badge } from '../../../components/ui';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { formatINR } from '../../../components/ui/CurrencyDisplay';
import { GOAL_TYPES } from '../../../constants/goalTypes';
import {
  MOCK_GOALS,
  Goal,
  GoalStatus,
  formatTargetDate,
  monthlyNeeded,
} from './goalsData';

// ── Types ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<GoalStatus, { label: string; variant: 'green' | 'yellow' | 'red' }> = {
  'on-track': { label: 'On Track',  variant: 'green'  },
  'at-risk':  { label: 'At Risk',   variant: 'yellow' },
  'behind':   { label: 'Behind',    variant: 'red'    },
};

const goalTypeOptions = GOAL_TYPES.map((g) => ({ value: g.id, label: `${g.emoji} ${g.label}` }));

// ── Add Goal Modal ─────────────────────────────────────────────

function AddGoalModal({ onSave, onClose }: { onSave: (g: Goal) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('house');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [savedAmount, setSavedAmount] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Goal name is required';
    if (!targetAmount || Number(targetAmount) <= 0) errs.targetAmount = 'Enter a valid target amount';
    if (!targetDate) errs.targetDate = 'Target date is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const gt = GOAL_TYPES.find((g) => g.id === type);
    onSave({
      id: String(Date.now()),
      name: name.trim(),
      emoji: gt?.emoji ?? '🎯',
      type,
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      targetDate,
      status: 'on-track',
    });
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
            placeholder="e.g. Dream House"
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
            placeholder="e.g. 6000000"
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

// ── Progress Bar ───────────────────────────────────────────────

function GoalProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(pct, 100);
  return (
    <div className="h-2 bg-[#f0ede6] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full bg-[#01696f] transition-all duration-500"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

// ── Goal Card ──────────────────────────────────────────────────

function GoalCard({ goal }: { goal: Goal }) {
  const pct = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
  const { label, variant } = STATUS_BADGE[goal.status];
  const needed = monthlyNeeded(goal);

  return (
    <div className="bg-white rounded-[8px] shadow-card p-5 flex flex-col gap-4 hover:shadow-card-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#01696f]/8 flex items-center justify-center text-xl flex-shrink-0 select-none">
            {goal.emoji}
          </div>
          <div>
            <p className="text-sm font-bold text-[#28251d]">{goal.name}</p>
            <p className="text-xs text-[#7a7974] mt-0.5">Target: {formatTargetDate(goal.targetDate)}</p>
          </div>
        </div>
        <Badge variant={variant}>{label}</Badge>
      </div>

      {/* Amounts */}
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-[11px] text-[#7a7974] mb-0.5">Saved</p>
          <p className="text-base font-bold text-[#28251d]">{formatINR(goal.savedAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[#7a7974] mb-0.5">Target</p>
          <p className="text-base font-semibold text-[#7a7974]">{formatINR(goal.targetAmount)}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-1.5">
        <GoalProgressBar pct={pct} />
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#01696f]">{pct}% complete</p>
          {needed > 0 && (
            <p className="text-xs text-[#7a7974]">{formatINR(needed)}/mo needed</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <Link
        to={`/goals/${goal.id}`}
        className="flex items-center justify-center gap-1.5 w-full h-9 rounded-[6px] border border-[#01696f] text-sm font-medium text-[#01696f] hover:bg-[#01696f]/8 transition-colors"
      >
        View Details
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function GoalsPage() {
  const { setActions } = useTopBarActions();
  const [goals, setGoals] = useState<Goal[]>(MOCK_GOALS);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setActions(
      <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Goal</span>
        <span className="sm:hidden">Add</span>
      </Button>
    );
    return () => setActions(null);
  }, [setActions]);

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved  = goals.reduce((s, g) => s + g.savedAmount, 0);
  const activeCount = goals.length;

  const handleAdd = (g: Goal) => {
    setGoals((prev) => [...prev, g]);
    setAddOpen(false);
  };

  return (
    <>
      <div className="space-y-5">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-xs text-[#7a7974] font-medium mb-1">Active Goals</p>
            <p className="text-2xl font-bold text-[#28251d]">{activeCount}</p>
          </div>
          <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-xs text-[#7a7974] font-medium mb-1">Total Target</p>
            <p className="text-base font-bold text-[#28251d] leading-tight mt-0.5">{formatINR(totalTarget)}</p>
          </div>
          <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-xs text-[#7a7974] font-medium mb-1">Total Saved</p>
            <p className="text-base font-bold text-[#437a22] leading-tight mt-0.5">{formatINR(totalSaved)}</p>
          </div>
        </div>

        {/* Goals grid */}
        {goals.length === 0 ? (
          <div className="bg-white rounded-[8px] shadow-card">
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-[#01696f]/8 flex items-center justify-center mb-4">
                <Target className="w-7 h-7 text-[#01696f]" />
              </div>
              <p className="text-base font-semibold text-[#28251d] mb-1">No goals yet</p>
              <p className="text-sm text-[#7a7974] max-w-xs mb-5">
                Set a financial goal and track your progress month by month.
              </p>
              <Button variant="primary" size="md" onClick={() => setAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Add Your First Goal
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        )}
      </div>

      {addOpen && (
        <AddGoalModal onSave={handleAdd} onClose={() => setAddOpen(false)} />
      )}
    </>
  );
}
