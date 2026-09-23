import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Calculator,
  History,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button, Input, Select, Badge, EmptyState } from '../../../components/ui';
import { formatINR } from '../../../components/ui/CurrencyDisplay';
import { GOAL_TYPES, getCalculatorForGoalType } from '../../../constants/goalTypes';
import {
  Goal,
  GoalStatus,
  formatTargetDate,
  monthlyNeeded,
  monthsUntil,
  useGoals,
} from './goalsData';

// ── Types ──────────────────────────────────────────────────────

const STATUS_BADGE: Record<GoalStatus, { label: string; variant: 'green' | 'yellow' | 'red' }> = {
  'on-track': { label: 'On Track', variant: 'green'  },
  'at-risk':  { label: 'At Risk',  variant: 'yellow' },
  'behind':   { label: 'Behind',   variant: 'red'    },
};

const goalTypeOptions = GOAL_TYPES.map((g) => ({ value: g.id, label: `${g.emoji} ${g.label}` }));

// ── Circular Progress Ring ─────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const radius = 72;
  const stroke = 10;
  const norm = radius - stroke / 2;
  const circumference = 2 * Math.PI * norm;
  const clamped = Math.min(Math.max(pct, 0), 100);
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        {/* Track */}
        <circle
          cx={radius}
          cy={radius}
          r={norm}
          fill="none"
          stroke="#f0ede6"
          strokeWidth={stroke}
        />
        {/* Fill */}
        <circle
          cx={radius}
          cy={radius}
          r={norm}
          fill="none"
          stroke="#01696f"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      {/* Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#28251d]">{clamped}%</span>
        <span className="text-xs text-[#7a7974]">complete</span>
      </div>
    </div>
  );
}

// ── Timeline Bar ───────────────────────────────────────────────

function TimelineBar({ goal }: { goal: Goal }) {
  const totalMonths = monthsUntil(goal.targetDate) +
    Math.round((goal.savedAmount / (goal.monthlyContribution || 1)));
  const elapsed = totalMonths > 0
    ? Math.round((goal.savedAmount / goal.targetAmount) * 100)
    : 0;
  const clamped = Math.min(elapsed, 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-[#7a7974]">
        <span>Today</span>
        <span>{formatTargetDate(goal.targetDate)}</span>
      </div>
      <div className="relative h-3 bg-[#f0ede6] rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[#01696f] rounded-full transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
        {/* Today marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-[#b45309]"
          style={{ left: `${clamped}%` }}
        />
      </div>
      <p className="text-xs text-[#7a7974] text-center">
        {monthsUntil(goal.targetDate)} months remaining
      </p>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────

function EditGoalModal({
  goal,
  onSave,
  onClose,
}: {
  goal: Goal;
  onSave: (updated: Goal) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(goal.name);
  const [type, setType] = useState(goal.type);
  const [targetAmount, setTargetAmount] = useState(String(goal.targetAmount));
  const [targetDate, setTargetDate] = useState(goal.targetDate);
  const [savedAmount, setSavedAmount] = useState(String(goal.savedAmount));
  const [monthlyContribution, setMonthlyContribution] = useState(String(goal.monthlyContribution));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Goal name is required';
    if (!targetAmount || Number(targetAmount) <= 0) errs.targetAmount = 'Enter a valid amount';
    if (!targetDate) errs.targetDate = 'Target date is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const gt = GOAL_TYPES.find((g) => g.id === type);
    onSave({
      ...goal,
      name: name.trim(),
      emoji: gt?.emoji ?? goal.emoji,
      type,
      targetAmount: Number(targetAmount),
      savedAmount: Number(savedAmount) || 0,
      monthlyContribution: Number(monthlyContribution) || 0,
      targetDate,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-md relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
          <h3 className="text-base font-semibold text-[#28251d]">Edit Goal</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Input label="Goal Name" value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }} error={errors.name} />
          <Select label="Goal Type" options={goalTypeOptions} value={type} onChange={(e) => setType(e.target.value)} />
          <Input label="Target Amount (₹)" type="number" value={targetAmount} onChange={(e) => { setTargetAmount(e.target.value); setErrors((p) => ({ ...p, targetAmount: '' })); }} error={errors.targetAmount} />
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
          <Input label="Current Savings (₹)" type="number" value={savedAmount} onChange={(e) => setSavedAmount(e.target.value)} />
          <Input label="Monthly Contribution (₹)" type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────

function DeleteConfirm({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-[8px] shadow-card-md w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-[#a12c7b]/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#a12c7b]" />
          </div>
          <div className="flex-1">
            <p className="text-base font-bold text-[#28251d]">Delete goal?</p>
            <p className="text-sm text-[#7a7974] mt-1">
              <strong>"{name}"</strong> will be permanently deleted.
            </p>
          </div>
          <button onClick={onCancel} className="text-[#7a7974] hover:text-[#28251d]"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="md" className="flex-1" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── Stat Box ──────────────────────────────────────────────────

function StatBox({ label, value, color = 'default' }: { label: string; value: string; color?: 'green' | 'red' | 'default' }) {
  const textColor = color === 'green' ? 'text-[#437a22]' : color === 'red' ? 'text-[#a12c7b]' : 'text-[#28251d]';
  return (
    <div className="bg-[#f7f6f2] rounded-[8px] p-4 text-center">
      <p className="text-xs text-[#7a7974] mb-1">{label}</p>
      <p className={`text-base font-bold ${textColor}`}>{value}</p>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export function GoalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { goals, updateGoal, deleteGoal } = useGoals();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const goal = goals.find((g) => g.id === id);

  if (!goal) {
    return (
      <div className="bg-white rounded-[8px] shadow-card p-10 text-center">
        <p className="text-sm text-[#7a7974]">Goal not found.</p>
        <Link to="/goals" className="mt-4 inline-block text-sm font-medium text-[#01696f] hover:underline">
          Back to Goals
        </Link>
      </div>
    );
  }

  const pct = goal.targetAmount > 0 ? Math.round((goal.savedAmount / goal.targetAmount) * 100) : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const needed = monthlyNeeded(goal);
  const { label: statusLabel, variant: statusVariant } = STATUS_BADGE[goal.status];
  const calcLink = getCalculatorForGoalType(goal.type);

  const handleEdit = (updated: Goal) => {
    updateGoal(updated.id, updated);
    setEditOpen(false);
  };

  const handleDelete = () => {
    deleteGoal(goal.id);
    navigate('/goals');
  };

  return (
    <>
      <div className="space-y-5">
        {/* Back link + header */}
        <div className="flex items-center gap-3">
          <Link
            to="/goals"
            className="w-8 h-8 flex items-center justify-center rounded-[6px] border border-[#e9e7e1] text-[#7a7974] hover:text-[#28251d] hover:border-[#d4d2cc] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl select-none">{goal.emoji}</span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-[#28251d] truncate">{goal.name}</h1>
              <p className="text-xs text-[#7a7974]">Target: {formatTargetDate(goal.targetDate)}</p>
            </div>
          </div>
          <Badge variant={statusVariant} className="ml-auto flex-shrink-0">{statusLabel}</Badge>
        </div>

        {/* Progress ring + stats */}
        <div className="bg-white rounded-[8px] shadow-card p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <ProgressRing pct={pct} />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3 w-full">
              <StatBox label="Target" value={formatINR(goal.targetAmount)} />
              <StatBox label="Saved" value={formatINR(goal.savedAmount)} color="green" />
              <StatBox label="Remaining" value={formatINR(remaining)} color="red" />
              <StatBox label="Monthly Needed" value={needed > 0 ? formatINR(needed) : '—'} />
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-[8px] shadow-card p-5">
          <p className="text-sm font-semibold text-[#28251d] mb-4">Timeline</p>
          <TimelineBar goal={goal} />
        </div>

        {/* Linked Calculator */}
        <div className="bg-white rounded-[8px] shadow-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#28251d]">Linked Calculator</p>
              <p className="text-xs text-[#7a7974] mt-0.5">Review or improve this plan</p>
            </div>
            <Link
              to={goal.linkedCalculator ?? calcLink.route}
              className="flex items-center gap-1.5 h-9 px-4 rounded-[6px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-medium transition-colors"
            >
              <Calculator className="w-4 h-4" />
              Open Calculator
            </Link>
          </div>
          <p className="text-xs text-[#7a7974] mt-3">{goal.linkedCalculatorName ?? calcLink.name}</p>
        </div>

        {/* Contribution history */}
        <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#f0ede6] flex items-center gap-2">
            <History className="w-4 h-4 text-[#7a7974]" />
            <p className="text-sm font-semibold text-[#28251d]">Contribution History</p>
          </div>
          <EmptyState
            title="No contributions tracked yet"
            description="When you log contributions to this goal they will appear here."
            className="py-10"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="secondary" size="md" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="w-4 h-4" />
            Edit Goal
          </Button>
          <Button variant="danger" size="md" className="gap-1.5" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="w-4 h-4" />
            Delete Goal
          </Button>
        </div>
      </div>

      {editOpen && (
        <EditGoalModal goal={goal} onSave={handleEdit} onClose={() => setEditOpen(false)} />
      )}

      {deleteOpen && (
        <DeleteConfirm
          name={goal.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteOpen(false)}
        />
      )}
    </>
  );
}
