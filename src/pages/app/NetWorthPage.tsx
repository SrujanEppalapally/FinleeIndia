import { useState, useEffect } from 'react';
import {
  Plus, Pencil, X, Trash2, Landmark, PiggyBank, TrendingUp,
  BarChart3, Briefcase, CircleDollarSign, Home, Car, CreditCard,
  HelpCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button, Input, Select, EmptyState } from '../../components/ui';
import { useTopBarActions } from '../../contexts/TopBarActionsContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';

// ── Types ──────────────────────────────────────────────────────

type AssetCategory = 'savings' | 'investment' | 'property' | 'gold' | 'epf';
type LiabilityCategory = 'home-loan' | 'car-loan' | 'credit-card' | 'other';
type ItemType = 'asset' | 'liability';

interface NetWorthItem {
  id: string;
  name: string;
  value: number;
  category: AssetCategory | LiabilityCategory;
  type: ItemType;
  investmentSubcategory?: string;
}

// ── Mock data ──────────────────────────────────────────────────

const INITIAL_ITEMS: NetWorthItem[] = [
  { id: 'a1', name: 'SBI Savings Account', value: 185000, category: 'savings', type: 'asset' },
  { id: 'a2', name: 'HDFC FD', value: 300000, category: 'savings', type: 'asset' },
  { id: 'a3', name: 'Zerodha Portfolio', value: 420000, category: 'investment', type: 'asset', investmentSubcategory: 'Stocks / Equity' },
  { id: 'a4', name: 'Zerodha MF', value: 560000, category: 'investment', type: 'asset', investmentSubcategory: 'Mutual Funds' },
  { id: 'a5', name: 'EPF Balance', value: 380000, category: 'epf', type: 'asset' },
  { id: 'a6', name: 'Gold (50g)', value: 375000, category: 'gold', type: 'asset' },
  { id: 'l1', name: 'Home Loan Outstanding', value: 2850000, category: 'home-loan', type: 'liability' },
  { id: 'l2', name: 'Car Loan Outstanding', value: 320000, category: 'car-loan', type: 'liability' },
  { id: 'l3', name: 'Credit Card Outstanding', value: 0, category: 'credit-card', type: 'liability' },
];

// ── Config ─────────────────────────────────────────────────────

const assetCategoryOptions = [
  { value: 'savings', label: 'Savings / FD' },
  { value: 'investment', label: 'Investments' },
  { value: 'property', label: 'Property' },
  { value: 'gold', label: 'Gold' },
  { value: 'epf', label: 'EPF / PF' },
];

const liabilityCategoryOptions = [
  { value: 'home-loan', label: 'Home Loan' },
  { value: 'car-loan', label: 'Car Loan' },
  { value: 'credit-card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
];

const investmentSubcategoryOptions = [
  { value: 'Mutual Funds', label: 'Mutual Funds' },
  { value: 'Stocks / Equity', label: 'Stocks / Equity' },
  { value: 'Bonds', label: 'Bonds' },
  { value: 'Debt Funds', label: 'Debt Funds' },
  { value: 'ETFs', label: 'ETFs' },
  { value: 'Fixed Deposit', label: 'Fixed Deposit' },
  { value: 'PPF / EPF', label: 'PPF / EPF' },
  { value: 'NPS', label: 'NPS' },
  { value: 'Crypto', label: 'Crypto' },
  { value: 'Other', label: 'Other' },
];

const categoryIcon: Record<string, React.ElementType> = {
  savings: Landmark,
  investment: BarChart3,
  property: Home,
  gold: CircleDollarSign,
  epf: Briefcase,
  'home-loan': Home,
  'car-loan': Car,
  'credit-card': CreditCard,
  other: HelpCircle,
};

// ── Helpers ────────────────────────────────────────────────────

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function fmtY(v: number): string {
  const a = Math.abs(v);
  if (a >= 1_00_00_000) return `${(a / 1_00_00_000).toFixed(1)}Cr`;
  if (a >= 1_00_000) return `${(a / 1_00_000).toFixed(1)}L`;
  if (a >= 1_000) return `${(a / 1_000).toFixed(0)}K`;
  return String(a);
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Add / Edit Modal ───────────────────────────────────────────

interface ModalState {
  open: boolean;
  type: ItemType;
  item?: NetWorthItem;
}

function ItemModal({
  state, onClose, onSave, onDelete,
}: {
  state: ModalState;
  onClose: () => void;
  onSave: (item: NetWorthItem) => void;
  onDelete: (id: string) => void;
}) {
  const isEdit = !!state.item;
  const [name, setName] = useState(state.item?.name ?? '');
  const [category, setCategory] = useState<string>(
    state.item?.category ?? (state.type === 'asset' ? 'savings' : 'home-loan')
  );
  const [investmentSub, setInvestmentSub] = useState<string>(
    state.item?.investmentSubcategory ?? 'Mutual Funds'
  );
  const [value, setValue] = useState(state.item ? String(state.item.value) : '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryOptions = state.type === 'asset' ? assetCategoryOptions : liabilityCategoryOptions;
  const showInvestmentSub = state.type === 'asset' && category === 'investment';

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!value || Number(value) < 0) errs.value = 'Enter a valid value';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    onSave({
      id: state.item?.id ?? uid(),
      name: name.trim(),
      value: Number(value),
      category: category as AssetCategory | LiabilityCategory,
      type: state.type,
      investmentSubcategory: showInvestmentSub ? investmentSub : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (state.item) onDelete(state.item.id);
    onClose();
  };

  const typeLabel = state.type === 'asset' ? 'Asset' : 'Liability';

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-end lg:items-center justify-center">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        <div className="bg-white rounded-t-[12px] lg:rounded-[8px] shadow-card-md w-full max-w-sm relative z-10">
          <div className="flex items-center justify-between p-5 border-b border-[#f0ede6]">
            <h3 className="text-base font-semibold text-[#28251d]">
              {isEdit ? `Edit ${typeLabel}` : `Add ${typeLabel}`}
            </h3>
            <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-4">
            <Input
              label="Name"
              placeholder={state.type === 'asset' ? 'e.g. SBI Savings' : 'e.g. Home Loan'}
              value={name}
              onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
              error={errors.name}
              autoFocus
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            {showInvestmentSub && (
              <Select
                label="Investment Type"
                options={investmentSubcategoryOptions}
                value={investmentSub}
                onChange={(e) => setInvestmentSub(e.target.value)}
              />
            )}
            <Input
              label="Value (₹)"
              type="number"
              placeholder="0"
              value={value}
              onChange={(e) => { setValue(e.target.value); setErrors((p) => ({ ...p, value: '' })); }}
              error={errors.value}
            />
          </div>
          <div className="flex items-center justify-between p-5 border-t border-[#f0ede6]">
            <div>
              {isEdit && (
                <Button variant="danger" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setConfirmDelete(false)} />
          <div className="bg-white rounded-[8px] shadow-card-md p-6 max-w-sm w-full relative z-10">
            <p className="text-sm text-[#28251d] mb-5">
              Delete <strong>{state.item?.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── ItemRow ────────────────────────────────────────────────────

function ItemRow({
  item, onEdit, isTotal,
}: {
  item: NetWorthItem;
  onEdit: (item: NetWorthItem) => void;
  isTotal?: boolean;
}) {
  const IconComp = categoryIcon[item.category] ?? HelpCircle;
  const isAsset = item.type === 'asset';

  if (isTotal) {
    return (
      <div className="flex items-center justify-between px-5 py-3 bg-[#f7f6f2] border-t border-[#e9e7e1]">
        <span className="text-sm font-bold text-[#28251d]">
          {isAsset ? 'Total Assets' : 'Total Liabilities'}
        </span>
        <span className={`text-sm font-bold ${isAsset ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
          {formatINR(item.value)}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-[#f7f6f2] transition-colors group">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAsset ? 'bg-[#437a22]/10' : 'bg-[#a12c7b]/10'}`}>
        <IconComp className={`w-3.5 h-3.5 ${isAsset ? 'text-[#437a22]' : 'text-[#a12c7b]'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#28251d] truncate">{item.name}</p>
        {item.investmentSubcategory && (
          <p className="text-[11px] text-[#7a7974] mt-0.5">{item.investmentSubcategory}</p>
        )}
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${isAsset ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
        {formatINR(item.value)}
      </span>
      <button
        onClick={() => onEdit(item)}
        className="ml-1 text-[#d4d2cc] hover:text-[#01696f] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Projection Chart Tooltip ───────────────────────────────────

function ProjTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  const assets = (payload[0]?.value ?? 0) + (payload[1]?.value ?? 0);
  const liabilities = payload.find((p) => p.name === '_liab')?.value ?? 0;
  const nw = assets - liabilities;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1">Year {label}</p>
      <p className="text-[#7a7974]">Net Worth: <span className="font-medium text-[#28251d]">{formatINR(nw)}</span></p>
    </div>
  );
}

// ── Projection Section ─────────────────────────────────────────

function ProjectionSection({ totalAssets, totalLiabilities }: { totalAssets: number; totalLiabilities: number }) {
  const [open, setOpen] = useState(false);
  const [returnRate, setReturnRate] = useState('10');
  const [years, setYears] = useState('10');
  const [monthlyAdd, setMonthlyAdd] = useState('20000');
  const [chartData, setChartData] = useState<{ year: number; existing: number; additional: number }[] | null>(null);

  const project = () => {
    const r = parseFloat(returnRate) / 100;
    const n = parseInt(years, 10);
    const monthly = parseFloat(monthlyAdd || '0');
    if (!n || n <= 0) return;

    const data: { year: number; existing: number; additional: number }[] = [];
    let existingCorpus = totalAssets;
    let additionalCorpus = 0;

    for (let y = 0; y <= n; y++) {
      data.push({
        year: y,
        existing: Math.round(existingCorpus),
        additional: Math.round(additionalCorpus),
      });
      existingCorpus = existingCorpus * (1 + r);
      // Annual value of monthly SIP growing at return rate
      const annualSip = monthly * 12;
      additionalCorpus = (additionalCorpus + annualSip) * (1 + r);
    }
    setChartData(data);
  };

  return (
    <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f7f6f2] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-[#28251d]">Future Net Worth Projection</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#7a7974]" />
          : <ChevronDown className="w-4 h-4 text-[#7a7974]" />
        }
      </button>

      {open && (
        <div className="border-t border-[#f0ede6] p-5 space-y-5">
          {/* Inline inputs */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1 min-w-[130px] flex-1">
              <label className="text-xs font-medium text-[#7a7974]">Annual Return (%)</label>
              <input
                type="number"
                value={returnRate}
                onChange={(e) => setReturnRate(e.target.value)}
                className="h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-[#28251d] px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[110px] flex-1">
              <label className="text-xs font-medium text-[#7a7974]">Years to Project</label>
              <input
                type="number"
                value={years}
                onChange={(e) => setYears(e.target.value)}
                className="h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-[#28251d] px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]"
              />
            </div>
            <div className="flex flex-col gap-1 min-w-[160px] flex-1">
              <label className="text-xs font-medium text-[#7a7974]">Monthly Investment (₹)</label>
              <input
                type="number"
                value={monthlyAdd}
                onChange={(e) => setMonthlyAdd(e.target.value)}
                className="h-9 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-[#28251d] px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]"
              />
            </div>
            <Button variant="primary" size="sm" onClick={project} className="flex-shrink-0 h-9">
              Project
            </Button>
          </div>

          {chartData && (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="gradExisting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#01696f" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#01696f" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="gradAdditional" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0e7490" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0e7490" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 11, fill: '#7a7974' }}
                  axisLine={{ stroke: '#e9e7e1' }}
                  tickLine={false}
                  label={{ value: 'Year', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#7a7974' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#7a7974' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtY}
                  width={48}
                />
                <Tooltip content={<ProjTip />} />
                <ReferenceLine
                  y={totalLiabilities}
                  stroke="#a12c7b"
                  strokeDasharray="5 3"
                  strokeWidth={1.5}
                  label={{ value: `Liabilities ${formatINR(totalLiabilities)}`, position: 'insideTopRight', fontSize: 10, fill: '#a12c7b' }}
                />
                <Area
                  type="monotone"
                  dataKey="existing"
                  name="Current Assets Growth"
                  stackId="1"
                  stroke="#01696f"
                  strokeWidth={2}
                  fill="url(#gradExisting)"
                />
                <Area
                  type="monotone"
                  dataKey="additional"
                  name="Additional Investments"
                  stackId="1"
                  stroke="#0e7490"
                  strokeWidth={2}
                  fill="url(#gradAdditional)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {!chartData && (
            <p className="text-xs text-[#7a7974] text-center py-4">
              Set your inputs and click Project to see the chart.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function NetWorthPage() {
  const { setActions } = useTopBarActions();
  const [items, setItems] = useState<NetWorthItem[]>(INITIAL_ITEMS);
  const [modal, setModal] = useState<ModalState | null>(null);

  // Addition 2 — income + age for benchmark
  const [annualIncome, setAnnualIncome] = useState('1200000');
  const [userAge, setUserAge] = useState('30');

  const assets = items.filter((i) => i.type === 'asset');
  const liabilities = items.filter((i) => i.type === 'liability');
  const totalAssets = assets.reduce((s, i) => s + i.value, 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + i.value, 0);
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;

  const assetPct = totalAssets + totalLiabilities > 0
    ? (totalAssets / (totalAssets + totalLiabilities)) * 100
    : 50;

  // Benchmark: (age - 25) × income / 10
  const incomeNum = parseFloat(annualIncome) || 0;
  const ageNum = parseInt(userAge, 10) || 0;
  const benchmarkTarget = ageNum > 25 ? ((ageNum - 25) * incomeNum) / 10 : 0;
  const benchmarkMet = netWorth >= benchmarkTarget;
  const benchmarkGap = Math.abs(netWorth - benchmarkTarget);

  useEffect(() => {
    setActions(
      <Button
        variant="secondary"
        size="sm"
        className="gap-1.5"
        onClick={() => setModal({ open: true, type: 'asset' })}
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Update Values</span>
        <span className="sm:hidden">Update</span>
      </Button>
    );
    return () => setActions(null);
  }, [setActions]);

  const handleSave = (item: NetWorthItem) => {
    setItems((prev) => {
      const exists = prev.find((i) => i.id === item.id);
      return exists ? prev.map((i) => (i.id === item.id ? item : i)) : [...prev, item];
    });
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <>
      <div className="space-y-5">

        {/* Addition 2 — Income input strip */}
        <div className="flex flex-wrap items-center gap-4 bg-white rounded-[8px] shadow-card px-5 py-3">
          <div className="flex items-center gap-3 flex-1 min-w-[220px]">
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-xs font-medium text-[#7a7974]">Your Current Annual Income (₹)</label>
              <input
                type="number"
                value={annualIncome}
                onChange={(e) => setAnnualIncome(e.target.value)}
                className="h-8 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-[#28251d] px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] w-full max-w-[200px]"
              />
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-xs font-medium text-[#7a7974]">Age</label>
              <input
                type="number"
                value={userAge}
                onChange={(e) => setUserAge(e.target.value)}
                className="h-8 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-[#28251d] px-3 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] w-20"
              />
            </div>
          </div>
          <p className="text-xs text-[#7a7974]">Used for net worth benchmarking</p>
        </div>

        {/* Hero */}
        <div className="bg-white rounded-[8px] shadow-card p-6">
          <div className="text-center mb-5">
            <p className="text-sm text-[#7a7974] mb-1">Net Worth</p>
            <p className={`text-4xl font-bold tracking-tight ${isPositive ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
              {isPositive ? '' : '-'}{formatINR(Math.abs(netWorth))}
            </p>
            <p className="text-sm text-[#7a7974] mt-2">As of June 2026</p>
          </div>

          {/* Benchmark line */}
          {benchmarkTarget > 0 && (
            <div className={`flex items-center justify-between rounded-[6px] px-4 py-2.5 mb-5 ${benchmarkMet ? 'bg-[#437a22]/8 border border-[#437a22]/20' : 'bg-[#a12c7b]/8 border border-[#a12c7b]/20'}`}>
              <div>
                <p className={`text-xs font-semibold ${benchmarkMet ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                  Target net worth at your age: {formatINR(benchmarkTarget)}
                </p>
                <p className={`text-[11px] mt-0.5 ${benchmarkMet ? 'text-[#437a22]/70' : 'text-[#a12c7b]/70'}`}>
                  {benchmarkMet
                    ? `You're ${formatINR(benchmarkGap)} ahead of benchmark`
                    : `${formatINR(benchmarkGap)} below benchmark`
                  }
                </p>
              </div>
              <span className={`text-lg ${benchmarkMet ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                {benchmarkMet ? '✓' : '↑'}
              </span>
            </div>
          )}

          {/* Split bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[#7a7974]">
              <span>Assets {formatINR(totalAssets)}</span>
              <span>Liabilities {formatINR(totalLiabilities)}</span>
            </div>
            <div className="h-3 bg-[#f0ede6] rounded-full overflow-hidden flex">
              <div
                className="h-full bg-[#437a22] rounded-l-full transition-all duration-700"
                style={{ width: `${assetPct}%` }}
              />
              <div
                className="h-full bg-[#a12c7b] rounded-r-full transition-all duration-700"
                style={{ width: `${100 - assetPct}%` }}
              />
            </div>
            <div className="flex items-center gap-4 justify-center">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#437a22] flex-shrink-0" />
                <span className="text-xs text-[#7a7974]">Assets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a12c7b] flex-shrink-0" />
                <span className="text-xs text-[#7a7974]">Liabilities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assets & Liabilities columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Assets */}
          <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-[#437a22]/8 border-b border-[#437a22]/15">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-[#437a22]" />
                <span className="text-sm font-semibold text-[#437a22]">Assets</span>
              </div>
              <span className="text-xs text-[#437a22] font-medium">{assets.length} items</span>
            </div>
            <div className="divide-y divide-[#f0ede6]">
              {assets.length === 0 ? (
                <EmptyState
                  icon={<PiggyBank className="w-8 h-8" />}
                  title="No assets yet"
                  description="Add your savings, investments, and property."
                  className="py-8"
                />
              ) : (
                assets.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={(i) => setModal({ open: true, type: 'asset', item: i })}
                  />
                ))
              )}
            </div>
            <ItemRow
              item={{ id: '_total_assets', name: '', value: totalAssets, category: 'savings', type: 'asset' }}
              onEdit={() => {}}
              isTotal
            />
            <div className="px-5 py-3">
              <button
                onClick={() => setModal({ open: true, type: 'asset' })}
                className="flex items-center gap-1.5 text-sm text-[#01696f] hover:text-[#0c4e54] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Asset
              </button>
            </div>
          </div>

          {/* Liabilities */}
          <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-[#a12c7b]/8 border-b border-[#a12c7b]/15">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#a12c7b]" />
                <span className="text-sm font-semibold text-[#a12c7b]">Liabilities</span>
              </div>
              <span className="text-xs text-[#a12c7b] font-medium">{liabilities.length} items</span>
            </div>
            <div className="divide-y divide-[#f0ede6]">
              {liabilities.length === 0 ? (
                <EmptyState
                  icon={<CreditCard className="w-8 h-8" />}
                  title="No liabilities yet"
                  description="Add loans and credit card balances."
                  className="py-8"
                />
              ) : (
                liabilities.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onEdit={(i) => setModal({ open: true, type: 'liability', item: i })}
                  />
                ))
              )}
            </div>
            <ItemRow
              item={{ id: '_total_liabilities', name: '', value: totalLiabilities, category: 'home-loan', type: 'liability' }}
              onEdit={() => {}}
              isTotal
            />
            <div className="px-5 py-3">
              <button
                onClick={() => setModal({ open: true, type: 'liability' })}
                className="flex items-center gap-1.5 text-sm text-[#a12c7b] hover:text-[#8a2468] font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Liability
              </button>
            </div>
          </div>
        </div>

        {/* Addition 3 — Projection */}
        <ProjectionSection totalAssets={totalAssets} totalLiabilities={totalLiabilities} />
      </div>

      {modal?.open && (
        <ItemModal
          state={modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
