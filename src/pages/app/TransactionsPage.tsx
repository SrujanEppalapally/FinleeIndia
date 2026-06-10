import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  ArrowLeftRight,
  Utensils,
  Car,
  ShoppingBag,
  Zap,
  Film,
  Home,
  Pill,
  Shield,
} from 'lucide-react';
import { Button, Input, Select, Badge, EmptyState, Skeleton } from '../../components/ui';
import { useTopBarActions } from '../../contexts/TopBarActionsContext';
import { useToast } from '../../contexts/ToastContext';

// ── Types ──────────────────────────────────────────────────────

type TxnType = 'income' | 'expense';

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  type: TxnType;
  date: string;
  account: string;
  note: string;
}

// ── Category config ────────────────────────────────────────────

const categories = [
  'Food',
  'Transport',
  'Shopping',
  'Utilities',
  'Entertainment',
  'Healthcare',
  'Insurance',
  'EMI',
  'Income',
  'Other',
] as const;

const categoryIcon: Record<string, React.ElementType> = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Utilities: Zap,
  Entertainment: Film,
  Healthcare: Pill,
  Insurance: Shield,
  EMI: Home,
  Income: ArrowLeftRight,
  Other: ArrowLeftRight,
};

const categoryBadgeVariant: Record<string, 'green' | 'red' | 'yellow' | 'gray' | 'teal'> = {
  Food: 'teal',
  Transport: 'gray',
  Shopping: 'red',
  Utilities: 'yellow',
  Entertainment: 'green',
  Healthcare: 'teal',
  Insurance: 'gray',
  EMI: 'red',
  Income: 'green',
  Other: 'gray',
};

const categoryOptions = categories.map((c) => ({ value: c, label: c }));
const monthOptions = [
  { value: '2026-05', label: 'May 2026' },
  { value: '2026-06', label: 'June 2026' },
];

// ── Mock data ──────────────────────────────────────────────────

const MOCK_TXNS: Transaction[] = [
  { id: '1', merchant: 'Salary Credit', category: 'Income', amount: 95000, type: 'income', date: '2026-06-01', account: 'HDFC Savings', note: 'Monthly salary' },
  { id: '2', merchant: 'Home Loan EMI', category: 'EMI', amount: -25000, type: 'expense', date: '2026-06-05', account: 'HDFC Savings', note: 'HDFC Home Loan' },
  { id: '3', merchant: 'Swiggy', category: 'Food', amount: -450, type: 'expense', date: '2026-06-10', account: 'SBI Credit Card', note: 'Dinner order' },
  { id: '4', merchant: 'Airtel Recharge', category: 'Utilities', amount: -499, type: 'expense', date: '2026-06-08', account: 'HDFC Savings', note: 'Monthly plan' },
  { id: '5', merchant: 'Amazon', category: 'Shopping', amount: -2340, type: 'expense', date: '2026-05-31', account: 'SBI Credit Card', note: 'Kitchen items' },
  { id: '6', merchant: 'Ola', category: 'Transport', amount: -280, type: 'expense', date: '2026-05-30', account: 'PhonePe', note: 'Ride to office' },
  { id: '7', merchant: 'BESCOM Bill', category: 'Utilities', amount: -1840, type: 'expense', date: '2026-05-30', account: 'HDFC Savings', note: 'Electricity bill May' },
  { id: '8', merchant: 'Zomato', category: 'Food', amount: -620, type: 'expense', date: '2026-05-29', account: 'PhonePe', note: 'Weekend brunch' },
  { id: '9', merchant: 'PVR Cinemas', category: 'Entertainment', amount: -750, type: 'expense', date: '2026-05-28', account: 'SBI Credit Card', note: 'Movie tickets' },
  { id: '10', merchant: 'Apollo Pharmacy', category: 'Healthcare', amount: -340, type: 'expense', date: '2026-05-27', account: 'HDFC Savings', note: 'Medicines' },
  { id: '11', merchant: 'LIC Premium', category: 'Insurance', amount: -3500, type: 'expense', date: '2026-05-25', account: 'HDFC Savings', note: 'Quarterly premium' },
  { id: '12', merchant: 'Flipkart', category: 'Shopping', amount: -4599, type: 'expense', date: '2026-05-24', account: 'SBI Credit Card', note: 'Wireless earbuds' },
  { id: '13', merchant: 'Uber', category: 'Transport', amount: -520, type: 'expense', date: '2026-05-23', account: 'PhonePe', note: 'Airport drop' },
  { id: '14', merchant: 'Swiggy', category: 'Food', amount: -380, type: 'expense', date: '2026-05-22', account: 'PhonePe', note: 'Lunch' },
  { id: '15', merchant: 'SBI Credit Card Bill', category: 'EMI', amount: -8500, type: 'expense', date: '2026-05-20', account: 'HDFC Savings', note: 'Full payment' },
  { id: '16', merchant: 'Airtel Recharge', category: 'Utilities', amount: -499, type: 'expense', date: '2026-05-08', account: 'HDFC Savings', note: 'Monthly plan' },
  { id: '17', merchant: 'BESCOM Bill', category: 'Utilities', amount: -1620, type: 'expense', date: '2026-05-05', account: 'HDFC Savings', note: 'Electricity bill April' },
  { id: '18', merchant: 'Salary Credit', category: 'Income', amount: 95000, type: 'income', date: '2026-05-01', account: 'HDFC Savings', note: 'Monthly salary' },
  { id: '19', merchant: 'Zomato', category: 'Food', amount: -290, type: 'expense', date: '2026-05-15', account: 'PhonePe', note: 'Snacks' },
  { id: '20', merchant: 'Home Loan EMI', category: 'EMI', amount: -25000, type: 'expense', date: '2026-05-05', account: 'HDFC Savings', note: 'HDFC Home Loan' },
];

// ── Helpers ────────────────────────────────────────────────────

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function formatDate(dateStr: string): string {
  const today = '2026-06-10';
  const yesterday = '2026-06-09';
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function groupByDate(txns: Transaction[]): { label: string; txns: Transaction[] }[] {
  const groups: Map<string, Transaction[]> = new Map();
  for (const t of txns) {
    const key = t.date;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const sorted = Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  return sorted.map(([date, txns]) => ({ label: formatDate(date), txns }));
}

// ── ConfirmModal ───────────────────────────────────────────────

function ConfirmModal({ open, onConfirm, onCancel, message }: { open: boolean; onConfirm: () => void; onCancel: () => void; message: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onCancel} />
      <div className="bg-white rounded-[8px] shadow-card-md p-6 max-w-sm w-full relative z-10">
        <p className="text-sm text-[#28251d] mb-5">{message}</p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </div>
  );
}

// ── AddTransactionDrawer ───────────────────────────────────────

function AddTransactionDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (txn: Omit<Transaction, 'id'>) => void }) {
  const [type, setType] = useState<TxnType>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState('2026-06-10');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

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
      date,
      account: 'HDFC Savings',
      note: note.trim(),
    });
    setMerchant(''); setAmount(''); setNote(''); setErrors({});
    onClose();
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

          <Input label="Amount (₹)" type="number" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
          <Input label="Merchant / Description" placeholder="e.g. Swiggy" value={merchant} onChange={(e) => setMerchant(e.target.value)} error={errors.merchant} />
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

// ── TransactionDetailModal ─────────────────────────────────────

function TransactionDetailModal({
  txn,
  onClose,
  onEdit,
  onDelete,
}: {
  txn: Transaction;
  onClose: () => void;
  onEdit: (updated: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [merchant, setMerchant] = useState(txn.merchant);
  const [amount, setAmount] = useState(String(Math.abs(txn.amount)));
  const [category, setCategory] = useState(txn.category);
  const [date, setDate] = useState(txn.date);
  const [note, setNote] = useState(txn.note);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!merchant.trim()) errs.merchant = 'Merchant is required';
    if (!amount || Number(amount) <= 0) errs.amount = 'Valid amount is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onEdit({
      ...txn,
      merchant: merchant.trim(),
      amount: txn.type === 'expense' ? -Number(amount) : Number(amount),
      category,
      date,
      note: note.trim(),
    });
    setEditing(false);
  };

  const handleDelete = () => {
    onDelete(txn.id);
    setConfirmDelete(false);
    onClose();
  };

  const IconComp = categoryIcon[txn.category] ?? ArrowLeftRight;

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-lg relative z-10 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
            <h3 className="text-base font-semibold text-[#28251d]">Transaction Detail</h3>
            <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]"><X className="w-5 h-5" /></button>
          </div>

          <div className="p-5 space-y-4">
            {/* Merchant + Amount header */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${txn.type === 'income' ? 'bg-[#437a22]/10' : 'bg-[#a12c7b]/10'}`}>
                <IconComp className={`w-5 h-5 ${txn.type === 'income' ? 'text-[#437a22]' : 'text-[#a12c7b]'}`} />
              </div>
              <div className="flex-1">
                {editing ? (
                  <Input label="" placeholder="Merchant" value={merchant} onChange={(e) => setMerchant(e.target.value)} error={errors.merchant} />
                ) : (
                  <p className="text-base font-semibold text-[#28251d]">{txn.merchant}</p>
                )}
              </div>
              <span className={`text-lg font-bold flex-shrink-0 ${txn.type === 'income' ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                {txn.type === 'income' ? '+' : '-'}{formatINR(Math.abs(txn.amount))}
              </span>
            </div>

            {editing ? (
              <>
                <Input label="Amount (₹)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
                <Select label="Category" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
                <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <Input label="Note" placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} />
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#7a7974]">Category</span>
                  <Badge variant={categoryBadgeVariant[txn.category] ?? 'gray'}>{txn.category}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7a7974]">Date</span>
                  <span className="text-[#28251d]">{formatDate(txn.date)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#7a7974]">Account</span>
                  <span className="text-[#28251d]">{txn.account}</span>
                </div>
                {txn.note && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#7a7974]">Note</span>
                    <span className="text-[#28251d] text-right max-w-[60%]">{txn.note}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex justify-between p-5 border-t border-[#f0ede6]">
            {editing ? (
              <>
                <Button variant="ghost" onClick={() => { setEditing(false); setErrors({}); }}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save</Button>
              </>
            ) : (
              <>
                <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
                <Button variant="secondary" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4" /> Edit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal open={confirmDelete} onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} message="Are you sure you want to delete this transaction? This cannot be undone." />
    </>
  );
}

// ── Transaction Row ────────────────────────────────────────────

function TransactionRow({ txn, onClick }: { txn: Transaction; onClick: () => void }) {
  const IconComp = categoryIcon[txn.category] ?? ArrowLeftRight;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[#f7f6f2] transition-colors text-left"
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          txn.type === 'income' ? 'bg-[#437a22]/10' : 'bg-[#a12c7b]/10'
        }`}
      >
        <IconComp className={`w-4 h-4 ${txn.type === 'income' ? 'text-[#437a22]' : 'text-[#a12c7b]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#28251d] truncate">{txn.merchant}</p>
        <Badge variant={categoryBadgeVariant[txn.category] ?? 'gray'} className="mt-0.5">{txn.category}</Badge>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${txn.type === 'income' ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
          {txn.type === 'income' ? '+' : '-'}{formatINR(Math.abs(txn.amount))}
        </p>
      </div>
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function TransactionsPage() {
  const { setActions } = useTopBarActions();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [txns, setTxns] = useState<Transaction[]>(MOCK_TXNS);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('2026-05');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // Set TopBar actions
  useEffect(() => {
    setActions(
      <Button variant="primary" size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
        <Plus className="w-4 h-4" />
        <span className="hidden sm:inline">Add Transaction</span>
        <span className="sm:hidden">Add</span>
      </Button>
    );
    return () => setActions(null);
  }, [setActions]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return txns.filter((t) => {
      if (search && !t.merchant.toLowerCase().includes(search.toLowerCase())) return false;
      if (categoryFilter && t.category !== categoryFilter) return false;
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (monthFilter) {
        const prefix = monthFilter; // e.g. "2026-05"
        if (!t.date.startsWith(prefix)) return false;
      }
      return true;
    });
  }, [txns, search, categoryFilter, monthFilter, typeFilter]);

  // Summary
  const totalIncome = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = totalIncome - totalExpense;

  const grouped = groupByDate(filtered);

  // Handlers
  const handleAdd = (data: Omit<Transaction, 'id'>) => {
    const id = String(Date.now());
    setTxns((prev) => [{ ...data, id }, ...prev]);
    showToast('Transaction added');
  };

  const handleEdit = (updated: Transaction) => {
    setTxns((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelectedTxn(updated);
  };

  const handleDelete = (id: string) => {
    setTxns((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white rounded-[8px] shadow-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Search merchant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            options={[{ value: '', label: 'All Categories' }, ...categoryOptions]}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="All Categories"
          />
          <Select
            options={monthOptions}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
          <div className="flex rounded-[6px] border border-[#d4d2cc] overflow-hidden">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={[
                  'flex-1 py-2 text-xs font-medium transition-colors',
                  typeFilter === t
                    ? 'bg-[#01696f] text-white'
                    : 'bg-white text-[#7a7974] hover:bg-[#f7f6f2]',
                ].join(' ')}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
          <p className="text-xs text-[#7a7974] font-medium mb-1">Total Income</p>
          <p className="text-base font-bold text-[#437a22]">{formatINR(totalIncome)}</p>
        </div>
        <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
          <p className="text-xs text-[#7a7974] font-medium mb-1">Total Expenses</p>
          <p className="text-base font-bold text-[#a12c7b]">{formatINR(totalExpense)}</p>
        </div>
        <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
          <p className="text-xs text-[#7a7974] font-medium mb-1">Net</p>
          <p className={`text-base font-bold ${net >= 0 ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
            {net >= 0 ? '+' : ''}{formatINR(net)}
          </p>
        </div>
      </div>

      {/* Transaction list */}
      <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#f0ede6]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="table-row" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight className="w-10 h-10" />}
            title="No transactions found"
            description="Try adjusting your filters or add a new transaction."
            action={{ label: 'Add Transaction', onClick: () => setAddOpen(true) }}
          />
        ) : (
          grouped.map((group) => (
            <div key={group.label}>
              <div className="px-5 py-2 bg-[#f7f6f2] sticky top-0 z-10">
                <p className="text-xs font-semibold text-[#7a7974] uppercase tracking-wide">{group.label}</p>
              </div>
              <div className="divide-y divide-[#f0ede6]">
                {group.txns.map((txn) => (
                  <TransactionRow
                    key={txn.id}
                    txn={txn}
                    onClick={() => setSelectedTxn(txn)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      {selectedTxn && (
        <TransactionDetailModal
          txn={selectedTxn}
          onClose={() => setSelectedTxn(null)}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <AddTransactionDrawer
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleAdd}
      />
    </div>
  );
}
