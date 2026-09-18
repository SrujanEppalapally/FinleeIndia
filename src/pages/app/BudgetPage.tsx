import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  ChevronDown,
  ChevronUp,
  Plus,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Heart,
  BookOpen,
  Home,
  X,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';
import { Button, Input, Badge } from '../../components/ui';
import { useTopBarActions } from '../../contexts/TopBarActionsContext';
import { useToast } from '../../contexts/ToastContext';

// ── Types ──────────────────────────────────────────────────────

interface BudgetCategory {
  id: string;
  name: string;
  spent: number;
  limit: number;
}

interface MockTransaction {
  merchant: string;
  amount: number;
  date: string;
  category: string;
}

// ── Mock data ──────────────────────────────────────────────────

const INITIAL_BUDGETS: BudgetCategory[] = [
  { id: 'food', name: 'Food', spent: 8200, limit: 10000 },
  { id: 'transport', name: 'Transport', spent: 5100, limit: 5000 },
  { id: 'shopping', name: 'Shopping', spent: 12400, limit: 12000 },
  { id: 'utilities', name: 'Utilities', spent: 3800, limit: 5000 },
  { id: 'entertainment', name: 'Entertainment', spent: 4200, limit: 5000 },
  { id: 'health', name: 'Health', spent: 1200, limit: 3000 },
  { id: 'education', name: 'Education', spent: 0, limit: 2000 },
  { id: 'emi', name: 'EMI / Loans', spent: 28500, limit: 30000 },
];

// Per-month spent overrides (mock). Keys are month indices 0–11.
// Only June (5) has detailed mock data; other months use scaled estimates.
const MONTH_SPENT_SCALE: Record<number, number> = {
  3: 0.88, // April
  4: 0.94, // May
  5: 1.0,  // June (full mock data)
  6: 0.72, // July
  7: 0.65, // August
};

const MOCK_TRANSACTIONS: MockTransaction[] = [
  { merchant: 'Swiggy', amount: 450, date: '10 Jun', category: 'food' },
  { merchant: 'Zomato', amount: 620, date: '8 Jun', category: 'food' },
  { merchant: 'Swiggy', amount: 380, date: '5 Jun', category: 'food' },
  { merchant: 'BigBasket', amount: 1200, date: '4 Jun', category: 'food' },
  { merchant: 'Ola', amount: 280, date: '10 Jun', category: 'transport' },
  { merchant: 'Uber', amount: 520, date: '7 Jun', category: 'transport' },
  { merchant: 'Metro Card', amount: 200, date: '3 Jun', category: 'transport' },
  { merchant: 'Amazon', amount: 2340, date: '9 Jun', category: 'shopping' },
  { merchant: 'Flipkart', amount: 4599, date: '6 Jun', category: 'shopping' },
  { merchant: 'Myntra', amount: 1850, date: '2 Jun', category: 'shopping' },
  { merchant: 'BESCOM Bill', amount: 1840, date: '5 Jun', category: 'utilities' },
  { merchant: 'Airtel Recharge', amount: 499, date: '1 Jun', category: 'utilities' },
  { merchant: 'Gas Cylinder', amount: 950, date: '3 Jun', category: 'utilities' },
  { merchant: 'PVR Cinemas', amount: 750, date: '8 Jun', category: 'entertainment' },
  { merchant: 'Spotify', amount: 119, date: '1 Jun', category: 'entertainment' },
  { merchant: 'BookMyShow', amount: 640, date: '6 Jun', category: 'entertainment' },
  { merchant: 'Apollo Pharmacy', amount: 340, date: '7 Jun', category: 'health' },
  { merchant: 'Dr. Consultation', amount: 500, date: '4 Jun', category: 'health' },
  { merchant: 'Lab Tests', amount: 360, date: '2 Jun', category: 'health' },
  { merchant: 'Home Loan EMI', amount: 25000, date: '5 Jun', category: 'emi' },
  { merchant: 'Car Loan EMI', amount: 3500, date: '5 Jun', category: 'emi' },
];

// ── Helpers ────────────────────────────────────────────────────

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function pct(spent: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.round((spent / limit) * 100);
}

type UtilLevel = 'on-track' | 'approaching' | 'over';

function utilLevel(p: number): UtilLevel {
  if (p >= 100) return 'over';
  if (p >= 70) return 'approaching';
  return 'on-track';
}

const utilStyles: Record<UtilLevel, { bar: string; text: string; bg: string; ring: string; label: string }> = {
  'on-track': {
    bar: 'bg-[#437a22]',
    text: 'text-[#437a22]',
    bg: 'bg-[#437a22]/8',
    ring: '',
    label: 'On Track',
  },
  approaching: {
    bar: 'bg-[#b45309]',
    text: 'text-[#b45309]',
    bg: 'bg-[#b45309]/8',
    ring: '',
    label: 'Approaching Limit',
  },
  over: {
    bar: 'bg-[#a12c7b]',
    text: 'text-[#a12c7b]',
    bg: 'bg-[#a12c7b]/8',
    ring: 'ring-1 ring-[#a12c7b]/30',
    label: 'Over Budget',
  },
};

const categoryIcon: Record<string, React.ElementType> = {
  food: Utensils,
  transport: Car,
  shopping: ShoppingBag,
  utilities: Zap,
  entertainment: Film,
  health: Heart,
  education: BookOpen,
  emi: Home,
};

const categoryBadge: Record<string, 'green' | 'red' | 'yellow' | 'gray' | 'teal'> = {
  food: 'teal',
  transport: 'gray',
  shopping: 'red',
  utilities: 'yellow',
  entertainment: 'green',
  health: 'teal',
  education: 'gray',
  emi: 'red',
};

// ── Set Budget Modal ───────────────────────────────────────────

function SetBudgetModal({
  category,
  currentLimit,
  monthLabel,
  onSave,
  onClose,
}: {
  category: BudgetCategory | null;
  currentLimit: number;
  monthLabel: string;
  onSave: (id: string, limit: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(String(currentLimit || ''));
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(String(currentLimit || ''));
    setError('');
  }, [currentLimit, category]);

  if (!category) return null;

  const handleSave = () => {
    const n = Number(value);
    if (!value || n <= 0) { setError('Enter a valid amount'); return; }
    onSave(category.id, n);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-sm relative z-10">
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
          <h3 className="text-base font-semibold text-[#28251d]">Set Budget</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-[#7a7974]">Category</p>
            <p className="text-sm font-semibold text-[#28251d]">{category.name}</p>
            <p className="text-xs text-[#7a7974] mt-0.5">For {monthLabel}</p>
          </div>
          <Input
            label="Monthly Limit (₹)"
            type="number"
            placeholder="e.g. 10000"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(''); }}
            error={error}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

// ── Overflow Progress Bar ──────────────────────────────────────

function OverflowBar({ spent, limit }: { spent: number; limit: number }) {
  const p = pct(spent, limit);
  const level = utilLevel(p);
  const styles = utilStyles[level];
  const isOver = p > 100;
  const overPct = isOver ? Math.min(p - 100, 100) : 0;

  return (
    <div className="relative h-2.5 bg-[#f0ede6] rounded-full overflow-hidden">
      {/* Main fill — capped at 100% */}
      <div
        className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
        style={{ width: `${Math.min(p, 100)}%` }}
      />
      {/* Overflow hatched segment */}
      {isOver && (
        <div
          className="absolute top-0 right-0 h-full rounded-r-full overflow-hidden"
          style={{ width: `${overPct}%` }}
        >
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #a12c7b 0, #a12c7b 4px, #d45ca0 4px, #d45ca0 8px)',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── BudgetCategoryCard ─────────────────────────────────────────

function BudgetCategoryCard({
  budget,
  monthIdx,
  onEdit,
  onViewAllTransactions,
}: {
  budget: BudgetCategory;
  monthIdx: number;
  onEdit: (b: BudgetCategory) => void;
  onViewAllTransactions: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(budget.spent, budget.limit);
  const level = utilLevel(p);
  const styles = utilStyles[level];
  const isEmpty = budget.spent === 0;
  const IconComp = categoryIcon[budget.id] ?? TrendingDown;
  const overBy = budget.spent - budget.limit;
  const remaining = budget.limit - budget.spent;

  const txns = useMemo(
    () => MOCK_TRANSACTIONS.filter((t) => t.category === budget.id),
    [budget.id],
  );

  // Trend: current, previous, 3-month average (mock-derived from scale)
  const currentSpent = budget.spent;
  const prevScale = MONTH_SPENT_SCALE[monthIdx - 1] ?? 0.9;
  const prevSpent = Math.round(currentSpent * prevScale);
  const threeMoAvg = Math.round(
    (currentSpent + prevSpent + Math.round(currentSpent * (MONTH_SPENT_SCALE[monthIdx - 2] ?? 0.85))) / 3,
  );

  return (
    <div className={['bg-white rounded-[8px] shadow-card transition-shadow', styles.ring].join(' ')}>
      {/* Card header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full text-left p-5"
        aria-expanded={expanded}
        aria-label={`Expand ${budget.name} details`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={[
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
              level === 'over' ? 'bg-[#a12c7b]/10' : 'bg-[#01696f]/10',
            ].join(' ')}>
              <IconComp className={`w-4 h-4 ${level === 'over' ? 'text-[#a12c7b]' : 'text-[#01696f]'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#28251d]">{budget.name}</p>
              <p className={`text-xs font-medium mt-0.5 ${styles.text}`}>{styles.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
              className="text-[#7a7974] hover:text-[#01696f] transition-colors p-1"
              aria-label={`Edit ${budget.name} budget`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-[#7a7974]" />
              : <ChevronDown className="w-4 h-4 text-[#7a7974]" />}
          </div>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center py-4 text-center">
            <p className="text-xs text-[#7a7974]">No spending this month</p>
            <p className="text-xs text-[#7a7974] mt-0.5">Budget: {formatINR(budget.limit)}</p>
          </div>
        ) : (
          <>
            {/* Progress bar with overflow */}
            <OverflowBar spent={budget.spent} limit={budget.limit} />
            {/* Labels */}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-[#7a7974]">
                {formatINR(budget.spent)} <span className="text-[#d4d2cc]">/</span> {formatINR(budget.limit)}
              </p>
              <p className={`text-xs font-semibold ${styles.text}`}>{p}%</p>
            </div>
            {/* Over/remaining amount */}
            <div className="mt-1">
              {overBy > 0 ? (
                <p className={`text-xs font-medium ${styles.text}`}>
                  Over budget by {formatINR(overBy)}
                </p>
              ) : (
                <p className="text-xs font-medium text-[#437a22]">
                  {formatINR(remaining)} remaining
                </p>
              )}
            </div>
          </>
        )}
      </button>

      {/* Expanded drill-down */}
      {expanded && (
        <div className="border-t border-[#f0ede6] px-5 py-4 space-y-4">
          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-[#7a7974] uppercase tracking-wide">
                Transactions this month
              </p>
              <p className="text-[10px] font-semibold text-[#28251d]">
                Total: {formatINR(budget.spent)}
              </p>
            </div>
            {txns.length > 0 ? (
              <div className="space-y-2">
                {txns.map((t, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={categoryBadge[budget.id] ?? 'gray'} className="text-[10px]">
                        {t.date}
                      </Badge>
                      <span className="text-xs text-[#28251d]">{t.merchant}</span>
                    </div>
                    <span className="text-xs font-medium text-[#a12c7b]">-{formatINR(t.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-xs text-[#7a7974] mb-3">
                  No transactions recorded for this category this month.
                </p>
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add Transaction
                </Button>
              </div>
            )}
          </div>

          {/* Trend */}
          <div className="border-t border-[#f0ede6] pt-3">
            <p className="text-[10px] font-semibold text-[#7a7974] uppercase tracking-wide mb-2">
              Trend
            </p>
            {monthIdx > 0 ? (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-[#f7f6f2] rounded-[6px] py-2">
                  <p className="text-[10px] text-[#7a7974]">This Month</p>
                  <p className="text-xs font-semibold text-[#28251d] mt-0.5">{formatINR(currentSpent)}</p>
                </div>
                <div className="bg-[#f7f6f2] rounded-[6px] py-2">
                  <p className="text-[10px] text-[#7a7974]">Last Month</p>
                  <p className="text-xs font-semibold text-[#28251d] mt-0.5">{formatINR(prevSpent)}</p>
                </div>
                <div className="bg-[#f7f6f2] rounded-[6px] py-2">
                  <p className="text-[10px] text-[#7a7974]">3-Mo Avg</p>
                  <p className="text-xs font-semibold text-[#28251d] mt-0.5">{formatINR(threeMoAvg)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#7a7974] text-center py-2">
                Trend will appear after you have data for more months.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 border-t border-[#f0ede6] pt-3">
            <button
              onClick={() => onEdit(budget)}
              className="flex items-center gap-1.5 text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Budget
            </button>
            <button
              onClick={onViewAllTransactions}
              className="flex items-center gap-1 text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
            >
              View All Transactions <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────

export function BudgetPage() {
  const { setActions } = useTopBarActions();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState<BudgetCategory[]>(INITIAL_BUDGETS);
  const [monthIdx, setMonthIdx] = useState(5); // June = index 5
  const [year] = useState(2026);
  const [editTarget, setEditTarget] = useState<BudgetCategory | null>(null);
  const [editLimit, setEditLimit] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [newCatError, setNewCatError] = useState('');

  const monthLabel = `${MONTHS[monthIdx]} ${year}`;

  // Scale spent amounts per selected month (mock — June has full data)
  const displayBudgets = useMemo(() => {
    const scale = MONTH_SPENT_SCALE[monthIdx] ?? 1;
    if (monthIdx === 5) return budgets;
    return budgets.map((b) => ({
      ...b,
      spent: monthIdx < 3 ? 0 : Math.round(b.spent * scale),
    }));
  }, [budgets, monthIdx]);

  const totalBudgeted = displayBudgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = displayBudgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;
  const isOverTotal = remaining < 0;

  // TopBar: month nav + Edit Budgets
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonthIdx((m) => Math.max(0, m - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#7a7974] hover:bg-[#f0ede6] hover:text-[#28251d] transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-[#28251d] min-w-[100px] text-center">
            {MONTHS[monthIdx]} {year}
          </span>
          <button
            onClick={() => setMonthIdx((m) => Math.min(11, m + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#7a7974] hover:bg-[#f0ede6] hover:text-[#28251d] transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => { setEditTarget(displayBudgets[0]); setEditLimit(displayBudgets[0].limit); }}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit Budgets</span>
        </Button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, monthIdx, year, displayBudgets]);

  const handleSaveLimit = (id: string, limit: number) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
    showToast('Budget updated successfully');
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) { setNewCatError('Category name is required'); return; }
    if (!newCatLimit || Number(newCatLimit) <= 0) { setNewCatError('Enter a valid budget amount'); return; }
    const id = newCatName.trim().toLowerCase().replace(/\s+/g, '-');
    setBudgets((prev) => [
      ...prev,
      { id, name: newCatName.trim(), spent: 0, limit: Number(newCatLimit) },
    ]);
    setNewCatName(''); setNewCatLimit(''); setNewCatError(''); setAddOpen(false);
    showToast('Budget updated successfully');
  };

  return (
    <>
      <div className="space-y-5 pb-20 lg:pb-5">
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-xs text-[#7a7974] font-medium mb-1">Total Budgeted</p>
            <p className="text-base font-bold text-[#28251d]">{formatINR(totalBudgeted)}</p>
          </div>
          <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-xs text-[#7a7974] font-medium mb-1">Total Spent</p>
            <p className="text-base font-bold text-[#a12c7b]">{formatINR(totalSpent)}</p>
          </div>
          <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
            <p className="text-xs text-[#7a7974] font-medium mb-1">Remaining</p>
            <p className={`text-base font-bold ${remaining >= 0 ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
              {remaining >= 0 ? '' : '-'}{formatINR(Math.abs(remaining))}
            </p>
          </div>
        </div>

        {/* Over/under budget explanation */}
        <div className={`rounded-[8px] px-4 py-2.5 ${isOverTotal ? 'bg-[#a12c7b]/8' : 'bg-[#437a22]/8'}`}>
          <p className={`text-xs font-medium ${isOverTotal ? 'text-[#a12c7b]' : 'text-[#437a22]'}`}>
            {isOverTotal
              ? `You are over the total budget by ${formatINR(Math.abs(remaining))}.`
              : `${formatINR(remaining)} remaining across all categories.`}
          </p>
        </div>

        {/* Budget cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayBudgets.map((b) => (
            <BudgetCategoryCard
              key={b.id}
              budget={b}
              monthIdx={monthIdx}
              onEdit={(budget) => { setEditTarget(budget); setEditLimit(budget.limit); }}
              onViewAllTransactions={() => showToast('Opening all transactions…')}
            />
          ))}
        </div>

        {/* Add Category Budget button */}
        <div className="flex justify-center pt-2">
          <Button
            variant="secondary"
            size="md"
            className="gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Add Category Budget
          </Button>
        </div>
      </div>

      {/* Set Budget Modal */}
      <SetBudgetModal
        category={editTarget}
        currentLimit={editLimit}
        monthLabel={monthLabel}
        onSave={handleSaveLimit}
        onClose={() => setEditTarget(null)}
      />

      {/* Add Category Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
          <div className="fixed inset-0 bg-black/30" onClick={() => setAddOpen(false)} />
          <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-sm relative z-10">
            <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
              <h3 className="text-base font-semibold text-[#28251d]">Add Category Budget</h3>
              <button onClick={() => setAddOpen(false)} className="text-[#7a7974] hover:text-[#28251d]" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Input
                label="Category Name"
                placeholder="e.g. Travel"
                value={newCatName}
                onChange={(e) => { setNewCatName(e.target.value); setNewCatError(''); }}
                error={newCatError && !newCatLimit ? newCatError : undefined}
              />
              <Input
                label="Monthly Limit (₹)"
                type="number"
                placeholder="e.g. 5000"
                value={newCatLimit}
                onChange={(e) => { setNewCatLimit(e.target.value); setNewCatError(''); }}
                error={newCatError && newCatLimit ? newCatError : undefined}
              />
              {newCatError && <p className="text-xs text-[#a12c7b]">{newCatError}</p>}
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
              <Button variant="ghost" onClick={() => { setAddOpen(false); setNewCatError(''); }}>Cancel</Button>
              <Button variant="primary" onClick={handleAddCategory}>Add Budget</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
