import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Calculator,
  Sunset,
  IndianRupee,
  Scale,
  Home,
  Car,
  Flame,
  Plane,
  Building2,
  BarChart2,
  CreditCard,
  Search,
  ArrowRight,
  Wallet,
} from 'lucide-react';
import { Input } from '../../components/ui';

// ── Types ──────────────────────────────────────────────────────

type Tab = 'grow' | 'manage';

interface CalcCard {
  id: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  path: string;
  tab: Tab;
}

// ── Calculator registry ────────────────────────────────────────

const CALCULATORS: CalcCard[] = [
  {
    id: 'sip',
    icon: TrendingUp,
    iconBg: 'bg-[#01696f]/10',
    iconColor: 'text-[#01696f]',
    title: 'Incremental SIP',
    description: 'Step-up SIP with % or fixed annual increase',
    path: '/calculators/sip',
    tab: 'grow',
  },
  {
    id: 'dream-house',
    icon: Home,
    iconBg: 'bg-[#0e7490]/10',
    iconColor: 'text-[#0e7490]',
    title: 'Dream House',
    description: 'Future price, EMI, and SIP needed for your home',
    path: '/calculators/dream-house',
    tab: 'grow',
  },
  {
    id: 'retirement',
    icon: Sunset,
    iconBg: 'bg-[#437a22]/10',
    iconColor: 'text-[#437a22]',
    title: 'Retirement Corpus',
    description: 'How much do you need to retire comfortably?',
    path: '/calculators/retirement',
    tab: 'grow',
  },
  {
    id: 'fire',
    icon: Flame,
    iconBg: 'bg-[#b45309]/10',
    iconColor: 'text-[#b45309]',
    title: 'FIRE Calculator',
    description: 'Find your Financial Independence number and age',
    path: '/calculators/fire',
    tab: 'grow',
  },
  {
    id: 'rental-yield',
    icon: Building2,
    iconBg: 'bg-[#437a22]/10',
    iconColor: 'text-[#437a22]',
    title: 'Rental Yield',
    description: 'Gross vs net yield and IRR on your property',
    path: '/calculators/rental-yield',
    tab: 'grow',
  },
  {
    id: 'lumpsum-vs-sip',
    icon: BarChart2,
    iconBg: 'bg-[#01696f]/10',
    iconColor: 'text-[#01696f]',
    title: 'Lumpsum vs SIP',
    description: 'Which strategy grows your money faster?',
    path: '/calculators/lumpsum-vs-sip',
    tab: 'grow',
  },
  {
    id: 'emi',
    icon: Calculator,
    iconBg: 'bg-[#b45309]/10',
    iconColor: 'text-[#b45309]',
    title: 'EMI Calculator',
    description: 'Calculate your loan EMI and total interest',
    path: '/calculators/emi',
    tab: 'manage',
  },
  {
    id: 'ctc',
    icon: IndianRupee,
    iconBg: 'bg-[#0e7490]/10',
    iconColor: 'text-[#0e7490]',
    title: 'CTC → In-Hand',
    description: 'Your actual monthly take-home salary',
    path: '/calculators/ctc-inhand',
    tab: 'manage',
  },
  {
    id: 'tax',
    icon: Scale,
    iconBg: 'bg-[#6b7280]/10',
    iconColor: 'text-[#6b7280]',
    title: 'Tax Regime',
    description: 'Old vs New — which saves you more?',
    path: '/calculators/tax-regime',
    tab: 'manage',
  },
  {
    id: 'dream-vehicle',
    icon: Car,
    iconBg: 'bg-[#b45309]/10',
    iconColor: 'text-[#b45309]',
    title: 'Dream Vehicle',
    description: 'Is that car within your salary budget?',
    path: '/calculators/dream-vehicle',
    tab: 'manage',
  },
  {
    id: 'trip-budget',
    icon: Plane,
    iconBg: 'bg-[#0e7490]/10',
    iconColor: 'text-[#0e7490]',
    title: 'Trip Budget Planner',
    description: 'Plan your holiday cost and monthly savings',
    path: '/calculators/trip-budget',
    tab: 'manage',
  },
  {
    id: 'debt-payoff',
    icon: CreditCard,
    iconBg: 'bg-[#a12c7b]/10',
    iconColor: 'text-[#a12c7b]',
    title: 'Debt Payoff',
    description: 'Avalanche or Snowball — pay off debts fast',
    path: '/calculators/debt-payoff',
    tab: 'manage',
  },
  {
    id: 'monthly-budget-planner',
    icon: Wallet,
    iconBg: 'bg-[#01696f]/10',
    iconColor: 'text-[#01696f]',
    title: 'Monthly Budget Planner',
    description: 'Plan your income, expenses, EMIs, investments, and leftover for the month.',
    path: '/calculators/monthly-budget-planner',
    tab: 'manage',
  },
];

const TABS: { id: Tab; label: string }[] = [
  { id: 'grow', label: '📈 Grow Wealth' },
  { id: 'manage', label: '💳 Manage Money' },
];

// ── Calculator Card ────────────────────────────────────────────

function CalcCardItem({ calc, onClick }: { calc: CalcCard; onClick: () => void }) {
  const IconComp = calc.icon;
  return (
    <div
      className="bg-white rounded-[8px] shadow-card p-5 flex items-start gap-4 hover:shadow-card-md transition-all duration-150 cursor-pointer group"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${calc.iconBg}`}>
        <IconComp className={`w-5 h-5 ${calc.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#28251d]">{calc.title}</p>
            <p className="text-xs text-[#7a7974] mt-0.5 leading-relaxed">{calc.description}</p>
          </div>
          <button
            className="flex-shrink-0 flex items-center gap-1 text-xs font-medium text-[#01696f] border border-[#01696f] rounded-[6px] px-2.5 py-1.5 hover:bg-[#01696f] hover:text-white transition-colors group-hover:bg-[#01696f] group-hover:text-white"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
          >
            Open
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────

export function CalculatorsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('grow');
  const [search, setSearch] = useState('');

  const isSearching = search.trim().length > 0;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return CALCULATORS.filter((c) => c.tab === activeTab);
    return CALCULATORS.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
    );
  }, [search, activeTab]);

  return (
    <div className="space-y-5">
      {/* Search bar */}
      <div className="bg-white rounded-[8px] shadow-card p-4">
        <Input
          placeholder="Search calculators..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Tabs — only visible when not searching */}
      {!isSearching && (
        <div className="flex gap-0 border-b border-[#e9e7e1] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={[
                'flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-[#01696f] text-[#01696f]'
                  : 'border-transparent text-[#7a7974] hover:text-[#28251d] hover:border-[#d4d2cc]',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search result label */}
      {isSearching && (
        <p className="text-xs text-[#7a7974]">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} for "{search}"
        </p>
      )}

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-[8px] shadow-card p-10 text-center">
          <p className="text-sm font-medium text-[#28251d]">No calculators match "{search}"</p>
          <p className="text-xs text-[#7a7974] mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((calc) => (
            <CalcCardItem key={calc.id} calc={calc} onClick={() => navigate(calc.path)} />
          ))}
        </div>
      )}
    </div>
  );
}
