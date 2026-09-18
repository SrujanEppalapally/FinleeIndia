import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Calendar, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTopBarActions } from '../../../contexts/TopBarActionsContext';
import { useToast } from '../../../contexts/ToastContext';
import { Button, Input } from '../../../components/ui';

// ── Types ──────────────────────────────────────────────────────

interface BudgetData {
  monthlyIncome: string;
  additionalIncome: string;
  rentalIncome: string;
  spousesIncome: string;
  houseRentMaintenance: string;
  propertyTax: string;
  utilities: string;
  groceries: string;
  transportation: string;
  medicalExpenses: string;
  childrenSchoolFees: string;
  insurancePremiums: string;
  maid: string;
  shopping: string;
  travel: string;
  dineEntertainment: string;
  homeLoanEmi: string;
  carLoanEmi: string;
  personalLoanEmi: string;
  otherEmis: string;
  mutualFunds: string;
  stocks: string;
  fixedDeposits: string;
  others: string;
}

const EMPTY_BUDGET: BudgetData = {
  monthlyIncome: '', additionalIncome: '', rentalIncome: '', spousesIncome: '',
  houseRentMaintenance: '', propertyTax: '', utilities: '', groceries: '',
  transportation: '', medicalExpenses: '', childrenSchoolFees: '', insurancePremiums: '',
  maid: '', shopping: '', travel: '', dineEntertainment: '',
  homeLoanEmi: '', carLoanEmi: '', personalLoanEmi: '', otherEmis: '',
  mutualFunds: '', stocks: '', fixedDeposits: '', others: '',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const STORAGE_KEY = 'finlee_monthly_budgets';
const BUDGET_LIMITS_KEY = 'finlee_budget_limits';

function loadAllBudgets(): Record<string, BudgetData> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllBudgets(data: Record<string, BudgetData>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function loadBudgetLimits(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BUDGET_LIMITS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveBudgetLimits(data: Record<string, number>): void {
  try {
    localStorage.setItem(BUDGET_LIMITS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ── Helpers ─────────────────────────────────────────────────────

function num(v: string): number {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

function formatINR(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(abs / 1_000).toFixed(1)}K`;
  return `₹${abs.toLocaleString('en-IN')}`;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

// ── Section field configs ───────────────────────────────────────

interface FieldDef {
  key: keyof BudgetData;
  label: string;
}

const INFLOW_FIELDS: FieldDef[] = [
  { key: 'monthlyIncome', label: 'Monthly Income' },
  { key: 'additionalIncome', label: 'Additional Income' },
  { key: 'rentalIncome', label: 'Rental Income' },
  { key: 'spousesIncome', label: "Spouse's Income" },
];

const ESSENTIAL_FIELDS: FieldDef[] = [
  { key: 'houseRentMaintenance', label: 'House Rent & Maintenance' },
  { key: 'propertyTax', label: 'Property Tax' },
  { key: 'utilities', label: 'Utilities' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'medicalExpenses', label: 'Medical Expenses' },
  { key: 'childrenSchoolFees', label: 'Children School Fees' },
  { key: 'insurancePremiums', label: 'Insurance Premiums' },
];

const LIFESTYLE_FIELDS: FieldDef[] = [
  { key: 'maid', label: 'Maid' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'travel', label: 'Travel' },
  { key: 'dineEntertainment', label: 'Dine & Entertainment' },
];

const EMI_FIELDS: FieldDef[] = [
  { key: 'homeLoanEmi', label: 'Home Loan EMI' },
  { key: 'carLoanEmi', label: 'Car Loan EMI' },
  { key: 'personalLoanEmi', label: 'Personal Loan EMI' },
  { key: 'otherEmis', label: 'Other EMIs' },
];

const INVESTMENT_FIELDS: FieldDef[] = [
  { key: 'mutualFunds', label: 'Mutual Funds' },
  { key: 'stocks', label: 'Stocks' },
  { key: 'fixedDeposits', label: 'Fixed Deposits' },
  { key: 'others', label: 'Others' },
];

// ── Chart colors ────────────────────────────────────────────────

const CHART_COLORS = {
  essential: '#0e7490',
  lifestyle: '#b45309',
  emis: '#6b7280',
  investments: '#b8860b',
  leftout: '#01696f',
};

// ── Status logic ────────────────────────────────────────────────

type StatusLevel = 'good' | 'warn' | 'critical';

interface StatusInfo {
  level: StatusLevel;
  text: string;
}

function essentialStatus(p: number): StatusInfo {
  if (p <= 50) return { level: 'good', text: 'Essential spending is within a healthy range.' };
  if (p <= 65) return { level: 'warn', text: 'Essential spending is manageable but should be monitored.' };
  return { level: 'critical', text: 'Fixed essentials are high. Review rent, utilities, transport, and recurring commitments.' };
}
function lifestyleStatus(p: number): StatusInfo {
  if (p <= 15) return { level: 'good', text: 'Lifestyle spending is well controlled.' };
  if (p <= 25) return { level: 'warn', text: 'Lifestyle spending is moderate. Review discretionary purchases regularly.' };
  return { level: 'critical', text: 'Lifestyle spending is high. Consider reducing non-essential expenses.' };
}
function emiStatus(p: number): StatusInfo {
  if (p <= 25) return { level: 'good', text: 'Your EMI burden is comfortable.' };
  if (p <= 40) return { level: 'warn', text: 'Your EMI burden is meaningful. Review repayment priorities.' };
  return { level: 'critical', text: 'Debt repayments are heavy relative to income. Prioritise debt reduction.' };
}
function investmentStatus(p: number): StatusInfo {
  if (p >= 20) return { level: 'good', text: 'Your investment allocation is strong.' };
  if (p >= 10) return { level: 'warn', text: 'You are investing, but there is room to increase contributions.' };
  return { level: 'critical', text: 'Investment allocation is low. Consider starting or increasing a regular investment.' };
}
function leftoutStatus(p: number): StatusInfo {
  if (p > 20) return { level: 'good', text: 'Strong surplus. Consider assigning it to emergency savings or goals.' };
  if (p >= 0) return { level: 'warn', text: 'You have a limited buffer. Avoid adding unnecessary commitments.' };
  return { level: 'critical', text: 'Your plan is in deficit. Reduce outflows or increase income before adding new commitments.' };
}

const STATUS_STYLES: Record<StatusLevel, { dot: string; text: string; bg: string }> = {
  good: { dot: 'bg-[#437a22]', text: 'text-[#437a22]', bg: 'bg-[#437a22]/8' },
  warn: { dot: 'bg-[#b45309]', text: 'text-[#b45309]', bg: 'bg-[#b45309]/8' },
  critical: { dot: 'bg-[#a12c7b]', text: 'text-[#a12c7b]', bg: 'bg-[#a12c7b]/8' },
};

// ── Planner → Budget category mapping ───────────────────────────

const PLANNER_TO_BUDGET_MAP: { plannerKey: keyof BudgetData; budgetId: string }[] = [
  { plannerKey: 'groceries', budgetId: 'food' },
  { plannerKey: 'transportation', budgetId: 'transport' },
  { plannerKey: 'shopping', budgetId: 'shopping' },
  { plannerKey: 'utilities', budgetId: 'utilities' },
  { plannerKey: 'dineEntertainment', budgetId: 'entertainment' },
  { plannerKey: 'medicalExpenses', budgetId: 'health' },
];

// ── Input section card ──────────────────────────────────────────

interface SectionCardProps {
  title: string;
  fields: FieldDef[];
  data: BudgetData;
  onChange: (key: keyof BudgetData, val: string) => void;
  total: number;
  totalLabel: string;
  accent: string;
}

function SectionCard({ title, fields, data, onChange, total, totalLabel, accent }: SectionCardProps) {
  return (
    <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#f0ede6]">
        <span className={`w-2 h-2 rounded-full ${accent}`} />
        <h3 className="text-sm font-semibold text-[#28251d]">{title}</h3>
      </div>
      <div className="p-5 space-y-3">
        {fields.map((f) => (
          <div key={f.key} className="flex items-center gap-3">
            <label className="text-sm text-[#7a7974] flex-1" htmlFor={f.key}>{f.label}</label>
            <div className="w-40">
              <Input
                id={f.key}
                type="number"
                placeholder="0"
                value={data[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="text-right"
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 border-t border-[#f0ede6]">
          <span className="text-sm font-medium text-[#28251d]">{totalLabel}</span>
          <span className="text-sm font-bold text-[#28251d]">{formatINR(total)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Pie chart tooltip ───────────────────────────────────────────

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[6px] shadow-card px-3 py-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.payload.color }} />
        <span className="text-[#28251d] font-medium">{item.name}</span>
      </div>
      <p className="text-[#7a7974] mt-0.5 ml-[18px]">{formatINR(item.value)}</p>
    </div>
  );
}

// ── Custom Legend ───────────────────────────────────────────────

interface LegendEntry {
  value?: string;
  payload?: { color?: string };
}

function renderLegend(value: string, entry: LegendEntry) {
  const color = entry?.payload?.color ?? '#7a7974';
  return (
    <span className="text-xs text-[#7a7974]">
      <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ backgroundColor: color }} />
      {value}
    </span>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export function MonthlyBudgetPlannerPage() {
  const navigate = useNavigate();
  const { setActions } = useTopBarActions();
  const { showToast } = useToast();

  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [allBudgets, setAllBudgets] = useState<Record<string, BudgetData>>({});
  const [data, setData] = useState<BudgetData>(EMPTY_BUDGET);
  const [loaded, setLoaded] = useState(false);
  const [showApplyConfirm, setShowApplyConfirm] = useState(false);

  // Load all saved budgets on mount
  useEffect(() => {
    setAllBudgets(loadAllBudgets());
    setLoaded(true);
  }, []);

  // When month changes, load that month's data
  useEffect(() => {
    if (!loaded) return;
    const saved = allBudgets[monthKey];
    setData(saved ?? EMPTY_BUDGET);
  }, [monthKey, loaded, allBudgets]);

  // Top bar back button
  useEffect(() => {
    setActions(
      <button
        onClick={() => navigate('/calculators')}
        className="flex items-center gap-1.5 text-sm text-[#7a7974] hover:text-[#28251d] transition-colors"
        aria-label="Back to all calculators"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">All Calculators</span>
      </button>
    );
    return () => setActions(null);
  }, [setActions, navigate]);

  const handleChange = (key: keyof BudgetData, val: string) => {
    setData((prev) => ({ ...prev, [key]: val }));
  };

  // ── Calculations ─────────────────────────────────────────────

  const totals = useMemo(() => {
    const totalInflow =
      num(data.monthlyIncome) + num(data.additionalIncome) +
      num(data.rentalIncome) + num(data.spousesIncome);

    const totalEssential =
      num(data.houseRentMaintenance) + num(data.propertyTax) + num(data.utilities) +
      num(data.groceries) + num(data.transportation) + num(data.medicalExpenses) +
      num(data.childrenSchoolFees) + num(data.insurancePremiums);

    const totalLifestyle =
      num(data.maid) + num(data.shopping) + num(data.travel) + num(data.dineEntertainment);

    const totalEmis =
      num(data.homeLoanEmi) + num(data.carLoanEmi) + num(data.personalLoanEmi) + num(data.otherEmis);

    const totalInvestments =
      num(data.mutualFunds) + num(data.stocks) + num(data.fixedDeposits) + num(data.others);

    const totalOutflows = totalEssential + totalLifestyle + totalEmis + totalInvestments;
    const leftout = totalInflow - totalOutflows;

    return { totalInflow, totalEssential, totalLifestyle, totalEmis, totalInvestments, totalOutflows, leftout };
  }, [data]);

  const percentages = useMemo(() => {
    const t = totals.totalInflow;
    return {
      essential: pct(totals.totalEssential, t),
      lifestyle: pct(totals.totalLifestyle, t),
      emis: pct(totals.totalEmis, t),
      investments: pct(totals.totalInvestments, t),
      leftout: pct(totals.leftout, t),
    };
  }, [totals]);

  const chartData = useMemo(() => {
    const items = [
      { name: 'Essential Expenses', value: totals.totalEssential, color: CHART_COLORS.essential },
      { name: 'Lifestyle Expenses', value: totals.totalLifestyle, color: CHART_COLORS.lifestyle },
      { name: 'EMIs', value: totals.totalEmis, color: CHART_COLORS.emis },
      { name: 'Investments', value: totals.totalInvestments, color: CHART_COLORS.investments },
      { name: 'Leftover', value: Math.max(totals.leftout, 0), color: CHART_COLORS.leftout },
    ];
    return items.filter((d) => d.value > 0);
  }, [totals]);

  const summaryRows = useMemo(() => {
    return [
      { name: 'Essential Expenses', value: totals.totalEssential, pct: percentages.essential, status: essentialStatus(percentages.essential) },
      { name: 'Lifestyle Expenses', value: totals.totalLifestyle, pct: percentages.lifestyle, status: lifestyleStatus(percentages.lifestyle) },
      { name: 'EMIs', value: totals.totalEmis, pct: percentages.emis, status: emiStatus(percentages.emis) },
      { name: 'Investments', value: totals.totalInvestments, pct: percentages.investments, status: investmentStatus(percentages.investments) },
      { name: 'Leftover', value: totals.leftout, pct: percentages.leftout, status: leftoutStatus(percentages.leftout) },
    ];
  }, [totals, percentages]);

  // ── Actions ──────────────────────────────────────────────────

  const handleSave = () => {
    const updated = { ...allBudgets, [monthKey]: data };
    setAllBudgets(updated);
    saveAllBudgets(updated);
    showToast('Budget saved for ' + monthLabel(monthKey));
  };

  const handleReset = () => {
    setData(EMPTY_BUDGET);
    const updated = { ...allBudgets };
    delete updated[monthKey];
    setAllBudgets(updated);
    saveAllBudgets(updated);
    showToast('Budget reset');
  };

  const handleApplyToBudget = () => {
    const existing = loadBudgetLimits();
    const newLimits: Record<string, number> = { ...existing };
    for (const { plannerKey, budgetId } of PLANNER_TO_BUDGET_MAP) {
      const val = num(data[plannerKey]);
      if (val > 0) newLimits[budgetId] = val;
    }
    saveBudgetLimits(newLimits);
    setShowApplyConfirm(false);
    showToast('Category budgets updated from your plan');
  };

  function monthLabel(key: string): string {
    const [y, m] = key.split('-');
    return `${MONTHS[parseInt(m, 10) - 1]} ${y}`;
  }

  const monthOptions = useMemo(() => {
    const now = new Date();
    const opts: { value: string; label: string }[] = [];
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      opts.push({ value: k, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` });
    }
    return opts;
  }, []);

  const hasSavedBudget = !!allBudgets[monthKey];
  const leftoutNegative = totals.leftout < 0;
  const leftoutZero = totals.leftout === 0;

  // Summary status
  const summaryStatus: { level: StatusLevel; text: string } = leftoutNegative
    ? { level: 'critical', text: `Your planned outflows exceed your income by ${formatINR(Math.abs(totals.leftout))}.` }
    : leftoutZero
      ? { level: 'warn', text: 'Your monthly plan is fully allocated.' }
      : { level: 'good', text: `You have ${formatINR(totals.leftout)} available to allocate.` };

  const summaryStyles = STATUS_STYLES[summaryStatus.level];

  // Accessible chart description
  const chartDesc = useMemo(() => {
    if (chartData.length === 0) return 'No data to display in the allocation chart yet.';
    return `Allocation chart: Essential Expenses ${formatINR(totals.totalEssential)} (${percentages.essential}%), Lifestyle ${formatINR(totals.totalLifestyle)} (${percentages.lifestyle}%), EMIs ${formatINR(totals.totalEmis)} (${percentages.emis}%), Investments ${formatINR(totals.totalInvestments)} (${percentages.investments}%), Leftover ${formatINR(Math.max(totals.leftout, 0))} (${percentages.leftout}%).`;
  }, [chartData, totals, percentages]);

  return (
    <div className="space-y-5 pb-20 lg:pb-5">
      {/* Header */}
      <div className="bg-white rounded-[8px] shadow-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#28251d]">Monthly Budget Planning</h2>
            <p className="text-sm text-[#7a7974] mt-1">
              Plan your income, spending, EMIs, investments, and monthly leftover in one place.
            </p>
            <p className="text-xs text-[#7a7974] mt-2 bg-[#f7f6f2] rounded-[6px] px-3 py-2">
              Monthly Budget Planner is your full cash-flow plan. Budget is where you track category limits against actual spending.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#7a7974] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={monthKey}
                onChange={(e) => setMonthKey(e.target.value)}
                className="h-10 rounded-[6px] border border-[#d4d2cc] bg-white text-sm text-[#28251d] pl-9 pr-8 focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f] hover:border-[#7a7974] transition-colors cursor-pointer"
                aria-label="Select month"
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button variant="primary" onClick={handleSave} className="gap-1.5">
            <Save className="w-4 h-4" />
            Save This Month Budget
          </Button>
          <Button variant="secondary" onClick={handleReset} className="gap-1.5">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          {hasSavedBudget && (
            <Button
              variant="secondary"
              onClick={() => setShowApplyConfirm(true)}
              className="gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              Use this plan for category budgets
            </Button>
          )}
          {hasSavedBudget && (
            <span className="text-xs text-[#437a22] font-medium flex items-center">
              Saved for {monthLabel(monthKey)}
            </span>
          )}
        </div>
      </div>

      {/* Top summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
          <p className="text-xs text-[#7a7974] font-medium mb-1">Total Monthly Inflow</p>
          <p className="text-lg font-bold text-[#28251d]">{formatINR(totals.totalInflow)}</p>
        </div>
        <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
          <p className="text-xs text-[#7a7974] font-medium mb-1">Total Outflows</p>
          <p className="text-lg font-bold text-[#a12c7b]">{formatINR(totals.totalOutflows)}</p>
        </div>
        <div className="bg-white rounded-[8px] shadow-card p-4 text-center">
          <p className="text-xs text-[#7a7974] font-medium mb-1">Leftover for the Month</p>
          <p className={`text-lg font-bold ${leftoutNegative ? 'text-[#a12c7b]' : leftoutZero ? 'text-[#b45309]' : 'text-[#437a22]'}`}>
            {leftoutNegative ? '-' : ''}{formatINR(Math.abs(totals.leftout))}
          </p>
        </div>
      </div>

      {/* Summary status banner */}
      <div className={`rounded-[8px] px-4 py-3 ${summaryStyles.bg}`}>
        <p className={`text-sm font-medium ${summaryStyles.text}`}>
          {summaryStatus.text}
        </p>
      </div>

      {/* Percentage allocation summary */}
      <div className="bg-white rounded-[8px] shadow-card p-5">
        <h3 className="text-sm font-semibold text-[#28251d] mb-3">Percentage Allocation</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Essential', value: percentages.essential, color: 'text-[#0e7490]' },
            { label: 'Lifestyle', value: percentages.lifestyle, color: 'text-[#b45309]' },
            { label: 'EMIs', value: percentages.emis, color: 'text-[#6b7280]' },
            { label: 'Investments', value: percentages.investments, color: 'text-[#b8860b]' },
            { label: 'Leftover', value: percentages.leftout, color: leftoutNegative ? 'text-[#a12c7b]' : 'text-[#01696f]' },
          ].map((item) => (
            <div key={item.label} className="text-center bg-[#f7f6f2] rounded-[6px] py-3">
              <p className="text-xs text-[#7a7974] font-medium">{item.label}</p>
              <p className={`text-lg font-bold mt-1 ${item.color}`}>
                {item.label === 'Leftover' && leftoutNegative ? '' : ''}{item.value}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-5">
          <SectionCard
            title="Monthly Inflows"
            fields={INFLOW_FIELDS}
            data={data}
            onChange={handleChange}
            total={totals.totalInflow}
            totalLabel="Total Monthly Inflow"
            accent="bg-[#01696f]"
          />
          <SectionCard
            title="Essential Expenses"
            fields={ESSENTIAL_FIELDS}
            data={data}
            onChange={handleChange}
            total={totals.totalEssential}
            totalLabel="Total Essential Expenses"
            accent="bg-[#0e7490]"
          />
          <SectionCard
            title="Lifestyle Expenses"
            fields={LIFESTYLE_FIELDS}
            data={data}
            onChange={handleChange}
            total={totals.totalLifestyle}
            totalLabel="Total Lifestyle Expenses"
            accent="bg-[#b45309]"
          />
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <SectionCard
            title="EMIs"
            fields={EMI_FIELDS}
            data={data}
            onChange={handleChange}
            total={totals.totalEmis}
            totalLabel="Total EMIs"
            accent="bg-[#6b7280]"
          />
          <SectionCard
            title="Investments"
            fields={INVESTMENT_FIELDS}
            data={data}
            onChange={handleChange}
            total={totals.totalInvestments}
            totalLabel="Total Investments"
            accent="bg-[#b8860b]"
          />

          {/* Pie chart card */}
          <div className="bg-white rounded-[8px] shadow-card p-5">
            <h3 className="text-sm font-semibold text-[#28251d] mb-4">Budget Distribution</h3>
            <p className="sr-only" role="img" aria-label="Allocation chart description">{chartDesc}</p>
            {chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PieChart>
                  <Pie data={[{ value: 1 }]} outerRadius={80} dataKey="value" fill="#f0ede6" />
                </PieChart>
                <p className="text-sm text-[#7a7974] mt-2">Enter some values to see the chart</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      stroke="none"
                      paddingAngle={2}
                    >
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend
                      wrapperStyle={{ fontSize: 11, color: '#7a7974', paddingTop: 12 }}
                      iconType="circle"
                      iconSize={8}
                      formatter={renderLegend}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend with amounts and percentages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                  {chartData.map((entry) => {
                    const p = pct(entry.value, totals.totalInflow);
                    return (
                      <div key={entry.name} className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="text-xs text-[#7a7974] flex-1">{entry.name}</span>
                        <span className="text-xs font-medium text-[#28251d]">{formatINR(entry.value)}</span>
                        <span className="text-xs text-[#7a7974] w-8 text-right">{p}%</span>
                      </div>
                    );
                  })}
                </div>
                {leftoutNegative && (
                  <div className="mt-3 bg-[#a12c7b]/8 rounded-[6px] px-3 py-2">
                    <p className="text-xs text-[#a12c7b] font-medium">
                      Negative leftover is excluded from the allocation chart.
                    </p>
                    <p className="text-xs text-[#a12c7b] mt-0.5">
                      Actual leftover: -{formatINR(Math.abs(totals.leftout))}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Budget Health Summary */}
      <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#f0ede6]">
          <h3 className="text-sm font-semibold text-[#28251d]">Budget Health Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#f0ede6]">
                <th className="text-left text-xs font-semibold text-[#7a7974] uppercase tracking-wide px-5 py-3">Name</th>
                <th className="text-right text-xs font-semibold text-[#7a7974] uppercase tracking-wide px-5 py-3">Amount</th>
                <th className="text-right text-xs font-semibold text-[#7a7974] uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Percentage</th>
                <th className="text-left text-xs font-semibold text-[#7a7974] uppercase tracking-wide px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => {
                const s = STATUS_STYLES[row.status.level];
                const isLeftoutRow = row.name === 'Leftover';
                return (
                  <tr key={row.name} className="border-b border-[#f0ede6] last:border-0">
                    <td className="px-5 py-4">
                      <span className="text-sm font-medium text-[#28251d]">{row.name}</span>
                      <span className="text-xs text-[#7a7974] sm:hidden block mt-0.5">{row.pct}%</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-semibold ${isLeftoutRow && leftoutNegative ? 'text-[#a12c7b]' : 'text-[#28251d]'}`}>
                        {isLeftoutRow && leftoutNegative ? '-' : ''}{formatINR(row.value)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right hidden sm:table-cell">
                      <span className="text-sm text-[#7a7974]">{row.pct}%</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className={`flex items-start gap-2 ${s.bg} rounded-[6px] px-3 py-2`}>
                        <span className={`w-2 h-2 rounded-full ${s.dot} flex-shrink-0 mt-1`} />
                        <span className={`text-xs leading-relaxed ${s.text}`}>{row.status.text}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply to Budget confirmation modal */}
      {showApplyConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setShowApplyConfirm(false)} />
          <div className="bg-white rounded-[8px] shadow-card-md p-6 max-w-sm w-full relative z-10">
            <h3 className="text-base font-semibold text-[#28251d] mb-3">Apply plan to category budgets?</h3>
            <p className="text-sm text-[#7a7974] mb-5">
              This will replace your existing Budget category limits with the amounts from this plan for: Food, Transport, Shopping, Utilities, Entertainment, and Health.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowApplyConfirm(false)}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleApplyToBudget}>Apply to Budgets</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
