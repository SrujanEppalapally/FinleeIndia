import { useState, useEffect } from 'react';
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

const MOCK_TRANSACTIONS: MockTransaction[] = [
  { merchant: 'Swiggy', amount: 450, date: '10 Jun', category: 'food' },
  { merchant: 'Zomato', amount: 620, date: '8 Jun', category: 'food' },
  { merchant: 'Swiggy', amount: 380, date: '5 Jun', category: 'food' },
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

function barColor(p: number): string {
  if (p > 100) return 'bg-[#a12c7b]';
  if (p >= 70) return 'bg-[#b45309]';
  return 'bg-[#437a22]';
}

function pctTextColor(p: number): string {
  if (p > 100) return 'text-[#a12c7b]';
  if (p >= 70) return 'text-[#b45309]';
  return 'text-[#437a22]';
}

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
  onSave,
  onClose,
}: {
  category: BudgetCategory | null;
  currentLimit: number;
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
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-[#7a7974]">Category</p>
            <p className="text-sm font-semibold text-[#28251d]">{category.name}</p>
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

// ── BudgetCategoryCard ─────────────────────────────────────────

function BudgetCategoryCard({
  budget,
  onEdit,
}: {
  budget: BudgetCategory;
  onEdit: (b: BudgetCategory) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const p = pct(budget.spent, budget.limit);
  const fillWidth = Math.min(p, 100);
  const isOver = p > 100;
  const isEmpty = budget.spent === 0;
  const IconComp = categoryIcon[budget.id] ?? TrendingDown;

  const txns = MOCK_TRANSACTIONS.filter((t) => t.category === budget.id).slice(0, 3);

  return (
    <div className={[
      'bg-white rounded-[8px] shadow-card transition-shadow',
      isOver ? 'ring-1 ring-[#a12c7b]/30' : '',
    ].join(' ')}>
      {/* Card header */}
      <button
        onClick={() => !isEmpty && setExpanded((e) => !e)}
        className="w-full text-left p-5"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={[
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
              isOver ? 'bg-[#a12c7b]/10' : 'bg-[#01696f]/10',
            ].join(' ')}>
              <IconComp className={`w-4 h-4 ${isOver ? 'text-[#a12c7b]' : 'text-[#01696f]'}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#28251d]">{budget.name}</p>
              {isOver && (
                <p className="text-xs text-[#a12c7b] font-medium mt-0.5">Over budget</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(budget); }}
              className="text-[#7a7974] hover:text-[#01696f] transition-colors p-1"
              title="Edit budget"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            {!isEmpty && (
              expanded
                ? <ChevronUp className="w-4 h-4 text-[#7a7974]" />
                : <ChevronDown className="w-4 h-4 text-[#7a7974]" />
            )}
          </div>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center py-4 text-center">
            <p className="text-xs text-[#7a7974]">No spending this month</p>
            <p className="text-xs text-[#7a7974] mt-0.5">Budget: {formatINR(budget.limit)}</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="h-2 bg-[#f0ede6] rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor(p)}`}
                style={{ width: `${fillWidth}%` }}
              />
            </div>
            {/* Labels */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#7a7974]">
                {formatINR(budget.spent)} <span className="text-[#d4d2cc]">/</span> {formatINR(budget.limit)}
              </p>
              <p className={`text-xs font-semibold ${pctTextColor(p)}`}>{p}%</p>
            </div>
          </>
        )}
      </button>

      {/* Expanded transactions */}
      {expanded && txns.length > 0 && (
        <div className="border-t border-[#f0ede6] px-5 py-3">
          <p className="text-[10px] font-semibold text-[#7a7974] uppercase tracking-wide mb-2">
            Recent transactions
          </p>
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

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const remaining = totalBudgeted - totalSpent;

  // TopBar: month nav + Edit Budgets
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMonthIdx((m) => Math.max(0, m - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#7a7974] hover:bg-[#f0ede6] hover:text-[#28251d] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-[#28251d] min-w-[100px] text-center">
            {MONTHS[monthIdx]} {year}
          </span>
          <button
            onClick={() => setMonthIdx((m) => Math.min(11, m + 1))}
            className="w-7 h-7 flex items-center justify-center rounded-[6px] text-[#7a7974] hover:bg-[#f0ede6] hover:text-[#28251d] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5"
          onClick={() => setEditTarget(budgets[0])}
        >
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit Budgets</span>
        </Button>
      </div>
    );
    return () => setActions(null);
  }, [setActions, monthIdx, year, budgets]);

  const handleSaveLimit = (id: string, limit: number) => {
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
    showToast('Budget updated');
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
    showToast('Budget updated');
  };

  return (
    <>
      <div className="space-y-5">
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

        {/* Budget cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => (
            <BudgetCategoryCard
              key={b.id}
              budget={b}
              onEdit={(budget) => { setEditTarget(budget); setEditLimit(budget.limit); }}
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
              <button onClick={() => setAddOpen(false)} className="text-[#7a7974] hover:text-[#28251d]">
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
