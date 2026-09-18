import { useState, useEffect } from 'react';
import {
  Plus, Pencil, X, Trash2, Landmark, PiggyBank, TrendingUp,
  BarChart3, Briefcase, CircleDollarSign, Home, Car, CreditCard,
  HelpCircle, ChevronDown, ChevronUp, Calendar, Info,
} from 'lucide-react';
import { Button, Input, Select, EmptyState } from '../../components/ui';
import { useTopBarActions } from '../../contexts/TopBarActionsContext';
import { useToast } from '../../contexts/ToastContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
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
  lastUpdated?: string;
}

// ── Mock data ──────────────────────────────────────────────────

const AS_OF_DATE = '18 September 2026';
const LAST_UPDATED = '18 Sep 2026, 10:30 AM';

const INITIAL_ITEMS: NetWorthItem[] = [
  { id: 'a1', name: 'SBI Savings Account', value: 185000, category: 'savings', type: 'asset', lastUpdated: '15 Sep 2026' },
  { id: 'a2', name: 'HDFC FD', value: 300000, category: 'savings', type: 'asset', lastUpdated: '10 Sep 2026' },
  { id: 'a3', name: 'Zerodha Portfolio', value: 420000, category: 'investment', type: 'asset', investmentSubcategory: 'Stocks / Equity', lastUpdated: '17 Sep 2026' },
  { id: 'a4', name: 'Zerodha MF', value: 560000, category: 'investment', type: 'asset', investmentSubcategory: 'Mutual Funds', lastUpdated: '17 Sep 2026' },
  { id: 'a5', name: 'EPF Balance', value: 380000, category: 'epf', type: 'asset', lastUpdated: '01 Sep 2026' },
  { id: 'a6', name: 'Gold (50g)', value: 375000, category: 'gold', type: 'asset', lastUpdated: '05 Sep 2026' },
  { id: 'l1', name: 'Home Loan Outstanding', value: 2850000, category: 'home-loan', type: 'liability', lastUpdated: '12 Sep 2026' },
  { id: 'l2', name: 'Car Loan Outstanding', value: 320000, category: 'car-loan', type: 'liability', lastUpdated: '12 Sep 2026' },
  { id: 'l3', name: 'Credit Card Outstanding', value: 0, category: 'credit-card', type: 'liability', lastUpdated: '17 Sep 2026' },
];

// Sample 12-month trend (mock). Clearly marked as sample where shown.
const TREND_DATA = [
  { month: 'Oct', assets: 1850000, liabilities: 3270000, netWorth: -1420000 },
  { month: 'Nov', assets: 1920000, liabilities: 3240000, netWorth: -1320000 },
  { month: 'Dec', assets: 2010000, liabilities: 3210000, netWorth: -1200000 },
  { month: 'Jan', assets: 2100000, liabilities: 3190000, netWorth: -1090000 },
  { month: 'Feb', assets: 2180000, liabilities: 3160000, netWorth: -980000 },
  { month: 'Mar', assets: 2240000, liabilities: 3130000, netWorth: -890000 },
  { month: 'Apr', assets: 2310000, liabilities: 3100000, netWorth: -790000 },
  { month: 'May', assets: 2380000, liabilities: 3070000, netWorth: -690000 },
  { month: 'Jun', assets: 2420000, liabilities: 3220000, netWorth: -800000 },
  { month: 'Jul', assets: 2480000, liabilities: 3190000, netWorth: -710000 },
  { month: 'Aug', assets: 2540000, liabilities: 3170000, netWorth: -630000 },
  { month: 'Sep', assets: 2220000, liabilities: 3170000, netWorth: -950000 },
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
  { value: 'Fixed Deposits', label: 'Fixed Deposits' },
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

const categoryLabel: Record<string, string> = {
  savings: 'Savings / FD',
  investment: 'Investments',
  property: 'Property',
  gold: 'Gold',
  epf: 'EPF / PF',
  'home-loan': 'Home Loan',
  'car-loan': 'Car Loan',
  'credit-card': 'Credit Card',
  other: 'Other',
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
      lastUpdated: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
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
            <button onClick={onClose} className="text-[#7a7974] hover:text-[#28251d]" aria-label="Close">
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
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-[#7a7974]">{categoryLabel[item.category] ?? item.category}</span>
          {item.investmentSubcategory && (
            <>
              <span className="text-[11px] text-[#d4d2cc]">·</span>
              <span className="text-[11px] text-[#7a7974]">{item.investmentSubcategory}</span>
            </>
          )}
          {item.lastUpdated && (
            <>
              <span className="text-[11px] text-[#d4d2cc] hidden sm:inline">·</span>
              <span className="text-[11px] text-[#7a7974] hidden sm:inline">Updated {item.lastUpdated}</span>
            </>
          )}
        </div>
      </div>
      <span className={`text-sm font-semibold flex-shrink-0 ${isAsset ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
        {formatINR(item.value)}
      </span>
      <button
        onClick={() => onEdit(item)}
        className="ml-1 text-[#d4d2cc] hover:text-[#01696f] transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        aria-label={`Edit ${item.name}`}
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── Trend Chart Tooltip ─────────────────────────────────────────

function TrendTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string | number }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-[#28251d] mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-[#7a7974]">{p.name}:</span>
          <span className="font-medium text-[#28251d]">{formatINR(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Trend Section ──────────────────────────────────────────────

function TrendSection() {
  return (
    <div className="bg-white rounded-[8px] shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#28251d]">Net Worth Trend</h3>
        <span className="text-[11px] text-[#7a7974] bg-[#f7f6f2] rounded-full px-2 py-0.5">Sample data</span>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={TREND_DATA} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id="trendAssets" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#437a22" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#437a22" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="trendLiab" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a12c7b" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a12c7b" stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="trendNW" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#01696f" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#01696f" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={{ stroke: '#e9e7e1' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#7a7974' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={48} />
          <Tooltip content={<TrendTip />} />
          <Legend wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }} iconType="circle" iconSize={8} />
          <Area type="monotone" dataKey="assets" name="Total Assets" stroke="#437a22" strokeWidth={2} fill="url(#trendAssets)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="liabilities" name="Total Liabilities" stroke="#a12c7b" strokeWidth={2} fill="url(#trendLiab)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="netWorth" name="Net Worth" stroke="#01696f" strokeWidth={2.5} fill="url(#trendNW)" dot={false} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Projection Chart Tooltip ────────────────────────────────────

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
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-[#28251d]">Future Net Worth Projection</span>
        {open
          ? <ChevronUp className="w-4 h-4 text-[#7a7974]" />
          : <ChevronDown className="w-4 h-4 text-[#7a7974]" />
        }
      </button>

      {open && (
        <div className="border-t border-[#f0ede6] p-5 space-y-5">
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

// ── Benchmark Card ─────────────────────────────────────────────

function BenchmarkCard({
  netWorth, benchmarkTarget, benchmarkGap, ageNum, incomeNum,
}: {
  netWorth: number;
  benchmarkTarget: number;
  benchmarkGap: number;
  ageNum: number;
  incomeNum: number;
}) {
  const [showInfo, setShowInfo] = useState(false);

  if (benchmarkTarget <= 0) return null;

  const met = netWorth >= benchmarkTarget;
  const smallGap = !met && benchmarkGap <= benchmarkTarget * 0.15;
  const level: 'good' | 'warn' | 'critical' = met ? 'good' : smallGap ? 'warn' : 'critical';

  const styles = {
    good: { bg: 'bg-[#437a22]/8 border-[#437a22]/20', text: 'text-[#437a22]', icon: '✓' },
    warn: { bg: 'bg-[#b45309]/8 border-[#b45309]/20', text: 'text-[#b45309]', icon: '↑' },
    critical: { bg: 'bg-[#a12c7b]/8 border-[#a12c7b]/20', text: 'text-[#a12c7b]', icon: '↑' },
  }[level];

  return (
    <div className={`rounded-[6px] px-4 py-3 mb-5 border ${styles.bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-semibold text-[#28251d]">
            Suggested net worth benchmark: <span className={styles.text}>{formatINR(benchmarkTarget)}</span>
          </p>
          <p className={`text-[11px] mt-0.5 ${styles.text}`}>
            {met
              ? `You are ${formatINR(benchmarkGap)} above the benchmark.`
              : `You are ${formatINR(benchmarkGap)} below the benchmark.`}
          </p>
          <p className="text-[11px] text-[#7a7974] mt-1">
            Age used: {ageNum} · Annual income used: {formatINR(incomeNum)}
          </p>
        </div>
        <span className={`text-lg flex-shrink-0 ${styles.text}`}>{styles.icon}</span>
      </div>
      <div className="mt-2">
        <button
          onClick={() => setShowInfo((v) => !v)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#01696f] hover:text-[#0c4e54] transition-colors"
          aria-expanded={showInfo}
        >
          <Info className="w-3 h-3" />
          How is this calculated?
        </button>
        {showInfo && (
          <p className="text-[11px] text-[#7a7974] mt-1.5 leading-relaxed bg-[#f7f6f2] rounded-[6px] px-3 py-2">
            This is a planning guideline based on the current benchmark formula used by Finlee. It is not a guaranteed financial target or personalised financial advice.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function NetWorthPage() {
  const { setActions } = useTopBarActions();
  const { showToast } = useToast();
  const [items, setItems] = useState<NetWorthItem[]>(INITIAL_ITEMS);
  const [modal, setModal] = useState<ModalState | null>(null);

  const [annualIncome, setAnnualIncome] = useState('1200000');
  const [userAge, setUserAge] = useState('30');

  const assets = items.filter((i) => i.type === 'asset');
  const liabilities = items.filter((i) => i.type === 'liability');
  const totalAssets = assets.reduce((s, i) => s + i.value, 0);
  const totalLiabilities = liabilities.reduce((s, i) => s + i.value, 0);
  const netWorth = totalAssets - totalLiabilities;
  const isPositive = netWorth >= 0;

  const incomeNum = parseFloat(annualIncome) || 0;
  const ageNum = parseInt(userAge, 10) || 0;
  const benchmarkTarget = ageNum > 25 ? ((ageNum - 25) * incomeNum) / 10 : 0;
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
    showToast('Net worth updated successfully');
  };

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Net worth updated successfully');
  };

  return (
    <>
      <div className="space-y-5">

        {/* Income input strip */}
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
          {/* Summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div>
              <p className="text-xs text-[#7a7974] font-medium">Current Net Worth</p>
              <p className={`text-xl font-bold mt-1 ${isPositive ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                {isPositive ? '' : '-'}{formatINR(Math.abs(netWorth))}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#7a7974] font-medium">Total Assets</p>
              <p className="text-xl font-bold text-[#437a22] mt-1">{formatINR(totalAssets)}</p>
            </div>
            <div>
              <p className="text-xs text-[#7a7974] font-medium">Total Liabilities</p>
              <p className="text-xl font-bold text-[#a12c7b] mt-1">{formatINR(totalLiabilities)}</p>
            </div>
            <div>
              <p className="text-xs text-[#7a7974] font-medium">As of</p>
              <p className="text-sm font-semibold text-[#28251d] mt-1">{AS_OF_DATE}</p>
              <p className="text-[11px] text-[#7a7974] mt-0.5 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Updated {LAST_UPDATED}
              </p>
            </div>
          </div>

          {/* Net worth status explanation */}
          <div className={`rounded-[6px] px-4 py-2.5 mb-5 ${isPositive ? 'bg-[#437a22]/8' : 'bg-[#a12c7b]/8'}`}>
            <p className={`text-xs font-medium ${isPositive ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
              {isPositive
                ? 'Your assets currently exceed your liabilities.'
                : 'Your liabilities are currently higher than your assets.'}
            </p>
          </div>

          {/* Benchmark card */}
          <BenchmarkCard
            netWorth={netWorth}
            benchmarkTarget={benchmarkTarget}
            benchmarkGap={benchmarkGap}
            ageNum={ageNum}
            incomeNum={incomeNum}
          />

          {/* Comparison layout: Assets vs Liabilities vs Net Worth */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#7a7974] font-medium">Assets</span>
                <span className="text-[#437a22] font-semibold">{formatINR(totalAssets)}</span>
              </div>
              <div className="h-3 bg-[#f0ede6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#437a22] rounded-full transition-all duration-700"
                  style={{ width: totalAssets > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#7a7974] font-medium">Liabilities</span>
                <span className="text-[#a12c7b] font-semibold">{formatINR(totalLiabilities)}</span>
              </div>
              <div className="h-3 bg-[#f0ede6] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#a12c7b] rounded-full transition-all duration-700"
                  style={{ width: totalLiabilities > 0 ? '100%' : '0%' }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#7a7974] font-medium">Net Worth</span>
                <span className={`font-semibold ${isPositive ? 'text-[#437a22]' : 'text-[#a12c7b]'}`}>
                  {isPositive ? '' : '-'}{formatINR(Math.abs(netWorth))}
                </span>
              </div>
              <div className="h-3 bg-[#f0ede6] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-[#01696f]' : 'bg-[#a12c7b]'}`}
                  style={{ width: netWorth !== 0 ? '100%' : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <TrendSection />

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
                  title="No assets added yet"
                  description="Add savings, investments, and property to see your net worth."
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
                  title="No liabilities added yet"
                  description="Add loans or outstanding balances to see your complete net worth."
                  action={{ label: 'Add Liability', onClick: () => setModal({ open: true, type: 'liability' }) }}
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

        {/* Projection */}
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
