import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Plus,
  Target,
  BarChart2,
  X,
  Settings,
  Repeat,
  Trash2,
  CalendarClock,
  ArrowRight,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { KPICard, Badge, Button, BudgetProgressBar, Skeleton, Input, Select } from '../../components/ui';
import { useToast } from '../../contexts/ToastContext';
import { useTopBarActions } from '../../contexts/TopBarActionsContext';
import { useTransactions, type Transaction } from '../../hooks/useTransactions';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// ── Constants ───────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function generateMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const options: { value: string; label: string }[] = [];
  for (let i = -11; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
    options.push({ value, label });
  }
  return options;
}

const MONTH_OPTIONS = generateMonthOptions();

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function isInSelectedMonth(transactionDate: string, selectedMonth: string): boolean {
  return transactionDate.slice(0, 7) === selectedMonth;
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#01696f',
  Transport: '#2a9da1',
  Shopping: '#a12c7b',
  Utilities: '#b45309',
  Entertainment: '#437a22',
  Other: '#7a7974',
  Healthcare: '#0e7490',
  Insurance: '#6b7280',
  EMI: '#a12c7b',
  Income: '#437a22',
  Subscriptions: '#01696f',
};

const INITIAL_BUDGET_ITEMS = [
  { category: 'Food', spent: 8200, limit: 10000 },
  { category: 'Transport', spent: 5100, limit: 7000 },
  { category: 'Shopping', spent: 12400, limit: 12000 },
  { category: 'Utilities', spent: 3800, limit: 5000 },
  { category: 'Entertainment', spent: 4200, limit: 5000 },
  { category: 'Other', spent: 8600, limit: 14000 },
];

type TxnType = 'income' | 'expense';

const INITIAL_NET_WORTH_ITEMS = [
  { id: 'a1', name: 'SBI Savings Account', value: 185000, type: 'asset' as const },
  { id: 'a2', name: 'HDFC FD', value: 300000, type: 'asset' as const },
  { id: 'a3', name: 'Zerodha Portfolio (Stocks)', value: 420000, type: 'asset' as const },
  { id: 'a4', name: 'Zerodha MF', value: 560000, type: 'asset' as const },
  { id: 'a5', name: 'EPF Balance', value: 380000, type: 'asset' as const },
  { id: 'a6', name: 'Gold (50g)', value: 375000, type: 'asset' as const },
  { id: 'l1', name: 'Home Loan Outstanding', value: 2850000, type: 'liability' as const },
  { id: 'l2', name: 'Car Loan Outstanding', value: 320000, type: 'liability' as const },
  { id: 'l3', name: 'Credit Card Outstanding', value: 0, type: 'liability' as const },
];

const categoryBadgeVariant: Record<string, 'green' | 'red' | 'yellow' | 'gray' | 'teal'> = {
  Food: 'teal',
  Transport: 'gray',
  Shopping: 'red',
  Utilities: 'yellow',
  Entertainment: 'green',
  Income: 'green',
  Other: 'gray',
  Subscriptions: 'teal',
  Healthcare: 'teal',
  Insurance: 'gray',
  EMI: 'red',
};

const TXN_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Utilities',
  'Entertainment', 'Healthcare', 'Insurance', 'EMI', 'Subscriptions', 'Income', 'Other',
];

const BUDGET_CATEGORIES = [
  'Food', 'Transport', 'Shopping', 'Utilities', 'Entertainment', 'Other',
];

interface Subscription {
  id: string;
  name: string;
  amount: number;
  renewalDate: string;
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub-1', name: 'Netflix',      amount: 499,   renewalDate: '2026-08-12' },
  { id: 'sub-2', name: 'Spotify',      amount: 119,   renewalDate: '2026-07-28' },
  { id: 'sub-3', name: 'ChatGPT Plus', amount: 1999,  renewalDate: '2026-08-05' },
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function formatRenewal(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `Renews on ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

// ── Helpers ────────────────────────────────────────────────────

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function computeNetWorth(items: typeof INITIAL_NET_WORTH_ITEMS): number {
  const assets = items.filter((i) => i.type === 'asset').reduce((s, i) => s + i.value, 0);
  const liabilities = items.filter((i) => i.type === 'liability').reduce((s, i) => s + i.value, 0);
  return assets - liabilities;
}

// ── Donut Tooltip ──────────────────────────────────────────────

function DonutTooltip({ active, payload, totalExpenses }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }>; totalExpenses: number }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : '0';
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[8px] shadow-card-md px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.payload.color }} />
        <span className="text-[#28251d] font-medium">{item.name}</span>
      </div>
      <p className="text-[#7a7974] mt-0.5 ml-[18px]">{formatINR(item.value)} · {pct}%</p>
    </div>
  );
}

// ── Savings Rate Card ──────────────────────────────────────────

function SavingsRateCard({ rate, surplus, loading }: { rate: number; surplus: number; loading: boolean }) {
  if (loading) {
    return <Skeleton variant="card" />;
  }
  const display = `${rate.toFixed(1)}%`;
  return (
    <div className="bg-white rounded-[8px] shadow-card p-5 flex flex-col gap-3 relative">
      <span className="absolute top-4 right-4 text-[#7a7974] w-5 h-5 flex items-center justify-center opacity-60">
        <PiggyBank className="w-5 h-5" />
      </span>
      <p className="text-sm text-[#7a7974] font-medium pr-8">Savings Rate</p>
      <span className="text-2xl font-bold text-[#28251d] leading-tight">{display}</span>
      <div className="flex items-center gap-1 text-xs font-medium text-[#7a7974]">
        <span>{formatINR(surplus)} surplus this month</span>
      </div>
    </div>
  );
}

// ── Goals at a Glance ──────────────────────────────────────────

type GoalStatus = 'on-track' | 'at-risk' | 'behind';

interface GoalSummary {
  id: string;
  emoji: string;
  name: string;
  saved: number;
  target: number;
  pct: number;
  status: GoalStatus;
  targetDate: string;
  monthlyContribution: number;
}

const GOAL_SUMMARIES: GoalSummary[] = [
  { id: '1', emoji: '🏠', name: 'Dream House', saved: 130000, target: 1000000, pct: 13, status: 'at-risk',  targetDate: 'Dec 2031', monthlyContribution: 8500 },
  { id: '2', emoji: '🚗', name: 'Dream Car',   saved: 135000, target: 500000, pct: 27, status: 'on-track', targetDate: 'Jun 2028', monthlyContribution: 6200 },
  { id: '3', emoji: '🏖️', name: 'Europe Trip', saved: 80000,  target: 200000, pct: 40, status: 'on-track', targetDate: 'Mar 2027', monthlyContribution: 4200 },
];

const GOAL_STATUS_BADGE: Record<GoalStatus, { label: string; classes: string }> = {
  'on-track': { label: 'On Track', classes: 'bg-[#437a22]/12 text-[#437a22]' },
  'at-risk':  { label: 'At Risk',  classes: 'bg-[#b45309]/12 text-[#b45309]' },
  'behind':   { label: 'Behind',   classes: 'bg-[#a12c7b]/12 text-[#a12c7b]' },
};

function GoalSummaryRow({ goal }: { goal: GoalSummary }) {
  const { label, classes } = GOAL_STATUS_BADGE[goal.status];
  return (
    <div className="py-3 px-5">
      <div className="flex items-center gap-3">
        <span className="text-lg select-none flex-shrink-0 w-7 text-center">{goal.emoji}</span>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#28251d] truncate">{goal.name}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${classes}`}>
              {label}
            </span>
          </div>
          <div className="h-1 bg-[#f0ede6] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#01696f] rounded-full transition-all duration-500"
              style={{ width: `${Math.min(goal.pct, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#7a7974]">
            <span>{formatINR(goal.saved)} / {formatINR(goal.target)}</span>
            <span className="font-semibold text-[#01696f]">{goal.pct}%</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#7a7974]">
            <span>Target: {goal.targetDate}</span>
            <span>Monthly: {formatINR(goal.monthlyContribution)}</span>
          </div>
        </div>
      </div>
      {goal.status === 'at-risk' && (
        <div className="mt-2 ml-10">
          <Link
            to={`/goals/${goal.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#b45309] hover:text-[#8a3f08] transition-colors"
          >
            Adjust plan <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────

function AddTransactionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (txn: Transaction) => void;
}) {
  const [type, setType] = useState<TxnType>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('2026-06-10');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categoryOptions = TXN_CATEGORIES.map((c) => ({ value: c, label: c }));

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!merchant.trim()) errs.merchant = 'Merchant is required';
    if (!amount || Number(amount) <= 0) errs.amount = 'Valid amount is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSave({
      type,
      merchant: merchant.trim(),
      amount: type === 'expense' ? -Number(amount) : Number(amount),
      category,
      date: date || 'Today',
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-lg relative z-10 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
          <h3 className="text-base font-semibold text-[#28251d]">Add Transaction</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['expense', 'income'] as TxnType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={[
                  'flex-1 py-2 rounded-[6px] text-sm font-medium transition-colors border',
                  type === t
                    ? t === 'income' ? 'bg-[#437a22]/10 border-[#437a22] text-[#437a22]' : 'bg-[#a12c7b]/10 border-[#a12c7b] text-[#a12c7b]'
                    : 'border-[#d4d2cc] text-[#7a7974] hover:border-[#7a7974]',
                ].join(' ')}
              >
                {t === 'income' ? 'Income' : 'Expense'}
              </button>
            ))}
          </div>
          <Input label="Amount (₹)" type="number" placeholder="0" value={amount} onChange={(e) => { setAmount(e.target.value); setErrors((p) => ({ ...p, amount: '' })); }} error={errors.amount} />
          <Input label="Merchant / Description" placeholder="e.g. Swiggy" value={merchant} onChange={(e) => { setMerchant(e.target.value); setErrors((p) => ({ ...p, merchant: '' })); }} error={errors.merchant} />
          <Select label="Category" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <Input label="Note (optional)" placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}

// ── Set Budget Modal ───────────────────────────────────────────

interface BudgetItem { category: string; spent: number; limit: number; }

function SetBudgetModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (category: string, limit: number) => void;
}) {
  const [category, setCategory] = useState(BUDGET_CATEGORIES[0]);
  const [limit, setLimit] = useState('');
  const [error, setError] = useState('');

  const categoryOptions = BUDGET_CATEGORIES.map((c) => ({ value: c, label: c }));

  const handleSave = () => {
    const n = Number(limit);
    if (!limit || n <= 0) { setError('Enter a valid amount'); return; }
    onSave(category, n);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-sm relative z-10">
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
          <h3 className="text-base font-semibold text-[#28251d]">Set Budget</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <Select label="Category" options={categoryOptions} value={category} onChange={(e) => { setCategory(e.target.value); setError(''); }} />
          <Input
            label="Monthly Limit (₹)"
            type="number"
            placeholder="e.g. 10000"
            value={limit}
            onChange={(e) => { setLimit(e.target.value); setError(''); }}
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

// ── Quick Net Worth Modal ──────────────────────────────────────

type NWItemType = 'asset' | 'liability';

interface NWItem {
  id: string;
  name: string;
  value: number;
  type: NWItemType;
}

function QuickNetWorthModal({
  initialItems,
  onClose,
  onSave,
}: {
  initialItems: NWItem[];
  onClose: () => void;
  onSave: (items: NWItem[]) => void;
}) {
  const [tab, setTab] = useState<NWItemType>('asset');
  const [items, setItems] = useState<NWItem[]>(initialItems.map((i) => ({ ...i })));
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newError, setNewError] = useState('');

  const visible = items.filter((i) => i.type === tab);

  const updateValue = (id: string, raw: string) => {
    const v = raw === '' ? 0 : Number(raw);
    if (isNaN(v)) return;
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, value: v } : i)));
  };

  const addNew = () => {
    if (!newName.trim()) { setNewError('Name is required'); return; }
    const v = Number(newValue);
    if (!newValue || v < 0) { setNewError('Enter a valid value'); return; }
    setItems((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name: newName.trim(), value: v, type: tab },
    ]);
    setNewName(''); setNewValue(''); setNewError('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-md relative z-10 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6] flex-shrink-0">
          <h3 className="text-base font-semibold text-[#28251d]">Quick Net Worth Update</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#f0ede6] flex-shrink-0">
          {(['asset', 'liability'] as NWItemType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setNewName(''); setNewValue(''); setNewError(''); }}
              className={[
                'flex-1 py-2.5 text-sm font-medium transition-colors border-b-2',
                tab === t
                  ? t === 'asset'
                    ? 'border-[#437a22] text-[#437a22]'
                    : 'border-[#a12c7b] text-[#a12c7b]'
                  : 'border-transparent text-[#7a7974] hover:text-[#28251d]',
              ].join(' ')}
            >
              {t === 'asset' ? 'Assets' : 'Liabilities'}
            </button>
          ))}
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-[#f0ede6]">
            {visible.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex-1 text-sm text-[#28251d] truncate min-w-0">{item.name}</span>
                <div className="flex-shrink-0 w-36">
                  <input
                    type="number"
                    value={item.value === 0 ? '' : item.value}
                    placeholder="0"
                    onChange={(e) => updateValue(item.id, e.target.value)}
                    className={[
                      'w-full h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-right px-3',
                      'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
                      'hover:border-[#7a7974] transition-colors',
                    ].join(' ')}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add new item row */}
          <div className="px-5 py-3 border-t border-[#f0ede6] space-y-2">
            <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Add new item</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name"
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setNewError(''); }}
                className="flex-1 h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-sm px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] hover:border-[#7a7974] transition-colors min-w-0"
              />
              <input
                type="number"
                placeholder="Value"
                value={newValue}
                onChange={(e) => { setNewValue(e.target.value); setNewError(''); }}
                className="w-28 h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-right px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] hover:border-[#7a7974] transition-colors flex-shrink-0"
              />
              <button
                onClick={addNew}
                className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-[6px] border border-[#01696f] text-[#01696f] hover:bg-[#01696f]/8 transition-colors"
                title="Add item"
                aria-label="Add item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {newError && <p className="text-xs text-[#a12c7b]">{newError}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6] flex-shrink-0">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={() => onSave(items)}>Save All</Button>
        </div>
      </div>
    </div>
  );
}

// ── Add Subscription Modal ─────────────────────────────────────

function AddSubscriptionModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (sub: Subscription) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Subscription name is required'); return; }
    const amt = Number(amount);
    if (!amount || amt <= 0) { setError('Enter a valid amount'); return; }
    if (!renewalDate) { setError('Renewal date is required'); return; }
    onSave({
      id: `sub-${Date.now()}`,
      name: name.trim(),
      amount: amt,
      renewalDate,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-sm relative z-10">
        <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
          <h3 className="text-base font-semibold text-[#28251d]">Add Subscription</h3>
          <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <Input
            label="Subscription Name"
            placeholder="e.g. Netflix"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            error={error && !name ? error : undefined}
            autoFocus
          />
          <Input
            label="Amount (₹)"
            type="number"
            placeholder="e.g. 499"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(''); }}
            error={error && !amount ? error : undefined}
          />
          <Input
            label="Renewal Date"
            type="date"
            value={renewalDate}
            onChange={(e) => { setRenewalDate(e.target.value); setError(''); }}
            error={error && !renewalDate ? error : undefined}
          />
          {error && !name && !amount && !renewalDate && (
            <p className="text-xs text-[#a12c7b]">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-[#f0ede6]">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Add Subscription</Button>
        </div>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────

export function DashboardPage() {
  const { showToast } = useToast();
  const { setActions } = useTopBarActions();
  const { data: allTxns, add: addTxnHook } = useTransactions();
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const dashboardMonth = searchParams.get('month') ?? currentMonth();
  const setDashboardMonth = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === currentMonth()) {
      next.delete('month');
    } else {
      next.set('month', value);
    }
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    setActions(
      <Link
        to="/settings/profile"
        className="lg:hidden flex items-center justify-center w-8 h-8 rounded-full text-[#7a7974] hover:text-[#28251d] hover:bg-[#f0ede6] transition-colors"
        aria-label="Settings"
      >
        <Settings className="w-4.5 h-4.5" />
      </Link>
    );
    return () => setActions(null);
  }, [setActions]);

  // Local state for dashboard data
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(INITIAL_BUDGET_ITEMS);
  const [nwItems, setNwItems] = useState<NWItem[]>(INITIAL_NET_WORTH_ITEMS);

  // Modal open states
  const [addTxnOpen, setAddTxnOpen] = useState(false);
  const [setBudgetOpen, setSetBudgetOpen] = useState(false);
  const [netWorthOpen, setNetWorthOpen] = useState(false);
  const [addSubOpen, setAddSubOpen] = useState(false);

  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Derive dashboard values from shared transaction data for the selected month
  const monthTxns = useMemo(
    () => allTxns.filter((t) => isInSelectedMonth(t.date, dashboardMonth)),
    [allTxns, dashboardMonth],
  );

  const monthlyIncome = useMemo(
    () => monthTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
    [monthTxns],
  );

  const monthlySpend = useMemo(
    () => monthTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0),
    [monthTxns],
  );

  // Dashboard verification:
  // income = sum of t.amount where t.type === 'income' and t.date starts with dashboardMonth
  // expenses = sum of Math.abs(t.amount) where t.type === 'expense' and t.date starts with dashboardMonth
  // surplus = income - expenses
  // savings rate = surplus / income * 100 (0 when income is 0)
  const monthlySurplus = monthlyIncome - monthlySpend;
  const savingsRate = monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0;

  const spendingByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTxns) {
      if (t.type !== 'expense') continue;
      map.set(t.category, (map.get(t.category) ?? 0) + Math.abs(t.amount));
    }
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] ?? '#7a7974' }))
      .sort((a, b) => b.value - a.value);
  }, [monthTxns]);

  const recentTxns = useMemo(
    () => [...allTxns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5),
    [allTxns],
  );

  // Subscription spending for selected month
  const subscriptionTotal = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  const nextRenewal = useMemo(() => {
    const upcoming = subscriptions
      .map((s) => ({ ...s, d: new Date(s.renewalDate) }))
      .filter((s) => !isNaN(s.d.getTime()))
      .sort((a, b) => a.d.getTime() - b.d.getTime());
    return upcoming[0] ?? null;
  }, [subscriptions]);

  const netWorth = computeNetWorth(nwItems);

  // Budget comparison for attention card
  const totalBudgetLimit = budgetItems.reduce((s, b) => s + b.limit, 0);
  const budgetDelta = monthlySpend - totalBudgetLimit;

  // Quick Action handlers
  const handleAddTransaction = (txn: Transaction) => {
    addTxnHook({ ...txn, id: String(Date.now()) });
    setAddTxnOpen(false);
    showToast('Transaction added ✓');
  };

  const handleSetBudget = (category: string, limit: number) => {
    setBudgetItems((prev) =>
      prev.map((b) => b.category === category ? { ...b, limit } : b)
    );
    setSetBudgetOpen(false);
    showToast('Budget updated ✓');
  };

  const handleSaveNetWorth = (items: NWItem[]) => {
    setNwItems(items);
    setNetWorthOpen(false);
    showToast('Net worth updated ✓');
  };

  const handleAddSubscription = (sub: Subscription) => {
    setSubscriptions((prev) => [sub, ...prev]);
    setAddSubOpen(false);
    showToast('Subscription added ✓');
  };

  const handleRemoveSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    showToast('Subscription removed');
  };

  return (
    <>
      <div className="space-y-6 pb-20 lg:pb-6">
        {/* Month selector */}
        <div className="flex items-center justify-between gap-3">
          <Select
            label="Month"
            options={MONTH_OPTIONS}
            value={dashboardMonth}
            onChange={(e) => setDashboardMonth(e.target.value)}
            className="max-w-[180px]"
          />
        </div>

        {/* 1. KPI Strip */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Net Worth" value={netWorth} delta={2.3} icon={<Wallet className="w-5 h-5" />} />
            <KPICard label="Monthly Income" value={monthlyIncome} delta={5.2} icon={<TrendingUp className="w-5 h-5" />} />
            <KPICard label="Monthly Spend" value={monthlySpend} delta={-5.1} icon={<CreditCard className="w-5 h-5" />} />
            <SavingsRateCard rate={savingsRate} surplus={monthlySurplus} loading={loading} />
          </div>
        )}

        {/* 2. Financial Attention Card */}
        {!loading && (
          <div className="bg-white rounded-[8px] shadow-card p-4 flex items-start gap-3">
            <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${budgetDelta > 0 ? 'bg-[#a12c7b]/10' : 'bg-[#437a22]/10'}`}>
              {budgetDelta > 0
                ? <AlertCircle className="w-5 h-5 text-[#a12c7b]" />
                : <Lightbulb className="w-5 h-5 text-[#437a22]" />
              }
            </span>
            <div className="flex-1 min-w-0">
              {budgetDelta > 0 ? (
                <p className="text-sm text-[#28251d]">
                  You are <span className="font-semibold text-[#a12c7b]">{formatINR(budgetDelta)}</span> over your planned spend. Review your highest-spend categories.
                </p>
              ) : (
                <p className="text-sm text-[#28251d]">
                  You have <span className="font-semibold text-[#437a22]">{formatINR(Math.abs(budgetDelta))}</span> available this month. Consider assigning part of it to a goal or emergency fund.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 3. Two-column: Donut + Budget */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spending by Category Donut */}
          <div className="bg-white rounded-[8px] shadow-card p-5">
            <h3 className="text-sm font-semibold text-[#28251d] mb-4">Spending by Category</h3>
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="skeleton-shimmer rounded-full w-[190px] h-[190px]" />
                <div className="grid grid-cols-2 gap-3 w-full mt-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="skeleton-shimmer rounded-full w-2.5 h-2.5 flex-shrink-0" />
                      <div className="skeleton-shimmer rounded h-3 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            ) : spendingByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10">
                <BarChart2 className="w-10 h-10 text-[#d4d2cc] mb-3" />
                <p className="text-sm text-[#7a7974]">No expenses recorded for this month.</p>
                <p className="text-xs text-[#7a7974] mt-0.5">Add a transaction to see spending breakdown.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={spendingByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {spendingByCategory.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<DonutTooltip totalExpenses={monthlySpend} />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-4">
                  {spendingByCategory.map((item) => {
                    const pct = monthlySpend > 0 ? ((item.value / monthlySpend) * 100).toFixed(0) : '0';
                    return (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-[#7a7974]">{item.name}</span>
                        <span className="text-xs font-medium text-[#28251d] ml-auto">{formatINR(item.value)}</span>
                        <span className="text-[10px] text-[#7a7974] w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Budget Overview */}
          <div className="bg-white rounded-[8px] shadow-card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-[#28251d]">Budget Overview</h3>
              {!loading && (
                <span className="text-xs text-[#7a7974]">
                  {totalBudgetLimit > 0 ? Math.round((monthlySpend / totalBudgetLimit) * 100) : 0}% of {formatINR(totalBudgetLimit)} used
                </span>
              )}
            </div>
            {loading ? (
              <div className="space-y-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="skeleton-shimmer rounded h-3 w-20" />
                      <div className="skeleton-shimmer rounded h-3 w-12" />
                    </div>
                    <div className="skeleton-shimmer rounded-full h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {budgetItems.map((item) => (
                  <BudgetProgressBar
                    key={item.category}
                    category={item.category}
                    spent={item.spent}
                    limit={item.limit}
                  />
                ))}
              </div>
            )}
            <div className="mt-5 pt-4 border-t border-[#f0ede6]">
              <Link
                to="/calculators/monthly-budget-planner"
                className="flex items-center justify-center gap-2 w-full h-11 rounded-[8px] bg-[#01696f] hover:bg-[#0c4e54] text-white text-sm font-semibold transition-colors"
              >
                <CalendarClock className="w-4 h-4" />
                Set or Change This Month Budget
              </Link>
            </div>

            {/* Compact monthly plan summary */}
            {!loading && (() => {
              const plan = (() => {
                try {
                  const raw = localStorage.getItem('finlee_monthly_budgets');
                  if (!raw) return null;
                  const all = JSON.parse(raw);
                  const now = new Date();
                  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                  return all[key] ?? null;
                } catch { return null; }
              })();
              if (!plan) return null;

              const pNum = (v: string) => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
              const inflow = pNum(plan.monthlyIncome) + pNum(plan.additionalIncome) + pNum(plan.rentalIncome) + pNum(plan.spousesIncome);
              const essential = pNum(plan.houseRentMaintenance) + pNum(plan.propertyTax) + pNum(plan.utilities) + pNum(plan.groceries) + pNum(plan.transportation) + pNum(plan.medicalExpenses) + pNum(plan.childrenSchoolFees) + pNum(plan.insurancePremiums);
              const lifestyle = pNum(plan.maid) + pNum(plan.shopping) + pNum(plan.travel) + pNum(plan.dineEntertainment);
              const emis = pNum(plan.homeLoanEmi) + pNum(plan.carLoanEmi) + pNum(plan.personalLoanEmi) + pNum(plan.otherEmis);
              const investments = pNum(plan.mutualFunds) + pNum(plan.stocks) + pNum(plan.fixedDeposits) + pNum(plan.others);
              const outflows = essential + lifestyle + emis + investments;
              const leftover = inflow - outflows;
              const health = leftover > 0 ? { text: 'Surplus', color: 'text-[#437a22]', bg: 'bg-[#437a22]/8' } : leftover === 0 ? { text: 'Fully allocated', color: 'text-[#b45309]', bg: 'bg-[#b45309]/8' } : { text: 'Deficit', color: 'text-[#a12c7b]', bg: 'bg-[#a12c7b]/8' };

              return (
                <div className="mt-3 bg-[#f7f6f2] rounded-[8px] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-[#28251d]">This Month's Plan</p>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${health.bg} ${health.color}`}>{health.text}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-[10px] text-[#7a7974]">Planned Inflow</p>
                      <p className="text-xs font-semibold text-[#28251d] mt-0.5">{formatINR(inflow)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7a7974]">Planned Outflows</p>
                      <p className="text-xs font-semibold text-[#a12c7b] mt-0.5">{formatINR(outflows)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#7a7974]">Planned Leftover</p>
                      <p className={`text-xs font-semibold mt-0.5 ${leftover >= 0 ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                        {leftover < 0 ? '-' : ''}{formatINR(Math.abs(leftover))}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/calculators/monthly-budget-planner"
                    className="flex items-center gap-1 text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors mt-3"
                  >
                    Edit Monthly Plan <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              );
            })()}
          </div>
        </div>

        {/* 4. Subscriptions */}
        <div className="bg-white rounded-[8px] shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6]">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-[#01696f]" />
              <h3 className="text-sm font-semibold text-[#28251d]">Subscriptions</h3>
            </div>
            <button
              onClick={() => setAddSubOpen(true)}
              className="text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors flex items-center gap-1"
              aria-label="Add subscription"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
          </div>
          {loading ? (
            <div className="divide-y divide-[#f0ede6]">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="table-row" />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Repeat className="w-8 h-8 text-[#d4d2cc] mx-auto mb-2" />
              <p className="text-sm text-[#7a7974]">No subscriptions tracked yet</p>
              <p className="text-xs text-[#7a7974] mt-0.5">Add Netflix, Spotify, or any recurring expense</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-5 py-3 bg-[#f7f6f2]">
                <div>
                  <p className="text-xs text-[#7a7974] font-medium">Monthly Total</p>
                  <p className="text-sm font-bold text-[#a12c7b]">{formatINR(subscriptionTotal)}</p>
                </div>
                {nextRenewal && (
                  <div className="text-right">
                    <p className="text-xs text-[#7a7974] font-medium">Next Renewal</p>
                    <p className="text-sm font-medium text-[#28251d]">{formatRenewal(nextRenewal.renewalDate)}</p>
                  </div>
                )}
              </div>
              <div className="divide-y divide-[#f0ede6]">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-3 px-5 py-3.5 group">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-[#01696f]/10">
                      <Repeat className="w-4 h-4 text-[#01696f]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#28251d] truncate">{sub.name}</p>
                      <p className="text-xs text-[#7a7974] mt-0.5">{formatRenewal(sub.renewalDate)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-[#a12c7b]">{formatINR(sub.amount)}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveSubscription(sub.id)}
                      className="text-[#d4d2cc] hover:text-[#a12c7b] transition-colors p-1 opacity-0 group-hover:opacity-100"
                      title="Remove subscription"
                      aria-label={`Remove ${sub.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 5. Goals at a Glance */}
        <div className="bg-white rounded-[8px] shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6]">
            <h3 className="text-sm font-semibold text-[#28251d]">Goals at a Glance</h3>
            <Link
              to="/goals"
              className="text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-[#f0ede6]">
            {GOAL_SUMMARIES.map((g, i) => (
              <div key={g.id} className={i >= 2 ? 'hidden sm:block' : ''}>
                <GoalSummaryRow goal={g} />
              </div>
            ))}
          </div>
          <div className="sm:hidden px-5 py-3 border-t border-[#f0ede6]">
            <Link
              to="/goals"
              className="text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
            >
              + {GOAL_SUMMARIES.length - 2} more goal{GOAL_SUMMARIES.length - 2 !== 1 ? 's' : ''}
            </Link>
          </div>
        </div>

        {/* 6. Recent Transactions */}
        <div className="bg-white rounded-[8px] shadow-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0ede6]">
            <h3 className="text-sm font-semibold text-[#28251d]">Recent Transactions</h3>
            <Link
              to="/transactions"
              className="text-xs font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
            >
              View all
            </Link>
          </div>
          {loading ? (
            <div className="divide-y divide-[#f0ede6]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} variant="table-row" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#f0ede6]">
              {recentTxns.map((txn, i) => (
                <div key={txn.id ?? i} className="flex items-center gap-3 px-5 py-3.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      txn.type === 'income' ? 'bg-[#437a22]/10' : 'bg-[#a12c7b]/10'
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        txn.type === 'income' ? 'text-[#437a22]' : 'text-[#a12c7b]'
                      }`}
                    >
                      {txn.merchant.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#28251d] truncate">{txn.merchant}</p>
                    <Badge variant={categoryBadgeVariant[txn.category] ?? 'gray'} className="mt-0.5">
                      {txn.category}
                    </Badge>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-semibold ${
                        txn.type === 'income' ? 'text-[#437a22]' : 'text-[#a12c7b]'
                      }`}
                    >
                      {txn.type === 'income' ? '+' : '-'}{formatINR(Math.abs(txn.amount))}
                    </p>
                    <p className="text-xs text-[#7a7974] mt-0.5">{formatDateShort(txn.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 7. Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setAddTxnOpen(true)}>
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setSetBudgetOpen(true)}>
            <Target className="w-4 h-4" />
            Set Budget
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setNetWorthOpen(true)}>
            <BarChart2 className="w-4 h-4" />
            Update Net Worth
          </Button>
          <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setAddSubOpen(true)}>
            <Repeat className="w-4 h-4" />
            Add Subscription
          </Button>
        </div>
      </div>

      {/* Modals */}
      {addTxnOpen && (
        <AddTransactionModal onClose={() => setAddTxnOpen(false)} onSave={handleAddTransaction} />
      )}
      {setBudgetOpen && (
        <SetBudgetModal onClose={() => setSetBudgetOpen(false)} onSave={handleSetBudget} />
      )}
      {netWorthOpen && (
        <QuickNetWorthModal
          initialItems={nwItems}
          onClose={() => setNetWorthOpen(false)}
          onSave={handleSaveNetWorth}
        />
      )}
      {addSubOpen && (
        <AddSubscriptionModal onClose={() => setAddSubOpen(false)} onSave={handleAddSubscription} />
      )}
    </>
  );
}
