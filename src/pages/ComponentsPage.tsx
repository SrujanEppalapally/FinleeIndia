import React, { useState } from 'react';
import {
  Wallet,
  Search,
  AlertCircle,
  PiggyBank,
  TrendingUp,
  CreditCard,
  Inbox,
} from 'lucide-react';
import {
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
  Skeleton,
  CurrencyDisplay,
  KPICard,
} from '../components/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <h2 className="text-lg font-semibold text-[#28251d] mb-1">{title}</h2>
      <div className="w-12 h-0.5 bg-[#01696f] mb-6 rounded-full" />
      {children}
    </section>
  );
}

function Row({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}

export function ComponentsPage() {
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  const categoryOptions = [
    { value: 'food', label: 'Food & Dining' },
    { value: 'transport', label: 'Transport' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'entertainment', label: 'Entertainment' },
  ];

  return (
    <div className="min-h-screen bg-[#f7f6f2]">
      {/* Header */}
      <header className="bg-white border-b border-[#e9e7e1] sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#01696f] rounded-[8px] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#28251d] leading-none">Finley</h1>
            <p className="text-xs text-[#7a7974]">Component Library</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#28251d] mb-2">Design System</h1>
          <p className="text-[#7a7974]">All reusable UI primitives for the Finley personal finance app.</p>
        </div>

        {/* Color Palette */}
        <Section title="Color Palette">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {[
              { name: 'Primary', hex: '#01696f', text: 'white' },
              { name: 'Hover', hex: '#0c4e54', text: 'white' },
              { name: 'Background', hex: '#f7f6f2', text: '#28251d', border: true },
              { name: 'Surface', hex: '#ffffff', text: '#28251d', border: true },
              { name: 'Income', hex: '#437a22', text: 'white' },
              { name: 'Expense', hex: '#a12c7b', text: 'white' },
            ].map((c) => (
              <div key={c.name} className="flex flex-col gap-2">
                <div
                  className={`h-16 rounded-[8px] ${c.border ? 'border border-[#d4d2cc]' : ''}`}
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <p className="text-xs font-medium text-[#28251d]">{c.name}</p>
                  <p className="text-xs text-[#7a7974] font-mono">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Button */}
        <Section title="Button">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Variants</p>
              <Row>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </Row>
            </div>
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Sizes</p>
              <Row className="items-end">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </Row>
            </div>
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">States</p>
              <Row>
                <Button loading={loading} onClick={handleLoadingDemo}>
                  {loading ? 'Saving...' : 'Click to Load'}
                </Button>
                <Button disabled>Disabled</Button>
                <Button variant="secondary" disabled>Disabled Secondary</Button>
              </Row>
            </div>
          </div>
        </Section>

        {/* Input */}
        <Section title="Input">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            <Input
              label="Amount"
              placeholder="Enter amount"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <Input
              label="Search transactions"
              placeholder="Search..."
              leftIcon={<Search className="w-4 h-4" />}
            />
            <Input
              label="Account number"
              placeholder="xxxx xxxx xxxx"
              error="Account number is required"
            />
            <Input
              label="Description"
              placeholder="e.g. Grocery shopping"
              disabled
              value="Disabled input"
            />
          </div>
        </Section>

        {/* Select */}
        <Section title="Select">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
            <Select
              label="Category"
              options={categoryOptions}
              placeholder="Select a category"
              value={selectValue}
              onChange={(e) => setSelectValue(e.target.value)}
            />
            <Select
              label="Category (error)"
              options={categoryOptions}
              placeholder="Select a category"
              error="Please select a category"
            />
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge">
          <Row>
            <Badge variant="green">Income</Badge>
            <Badge variant="red">Expense</Badge>
            <Badge variant="yellow">Pending</Badge>
            <Badge variant="gray">Archived</Badge>
            <Badge variant="teal">Active</Badge>
            <Badge variant="green">+₹1.2L</Badge>
            <Badge variant="red">-₹45.0K</Badge>
          </Row>
        </Section>

        {/* Spinner */}
        <Section title="Spinner">
          <Row className="items-center">
            <div className="flex flex-col items-center gap-2">
              <Spinner size="sm" />
              <span className="text-xs text-[#7a7974]">Small</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="md" />
              <span className="text-xs text-[#7a7974]">Medium</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Spinner size="lg" />
              <span className="text-xs text-[#7a7974]">Large</span>
            </div>
          </Row>
        </Section>

        {/* EmptyState */}
        <Section title="EmptyState">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-[8px] shadow-card">
              <EmptyState
                icon={<Inbox className="w-10 h-10" />}
                title="No transactions yet"
                description="Start tracking your income and expenses to see them here."
                action={{ label: 'Add Transaction', onClick: () => {} }}
              />
            </div>
            <div className="bg-white rounded-[8px] shadow-card">
              <EmptyState
                icon={<AlertCircle className="w-10 h-10" />}
                title="No results found"
                description="Try adjusting your filters or search term."
              />
            </div>
          </div>
        </Section>

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Text</p>
              <Skeleton variant="text" lines={3} />
            </div>
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Card</p>
              <Skeleton variant="card" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Table Row</p>
              <div className="bg-white rounded-[8px] shadow-card divide-y divide-[#f0ede6]">
                <Skeleton variant="table-row" />
                <Skeleton variant="table-row" />
                <Skeleton variant="table-row" />
              </div>
            </div>
          </div>
        </Section>

        {/* CurrencyDisplay */}
        <Section title="CurrencyDisplay">
          <div className="bg-white rounded-[8px] shadow-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f6f2]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Raw Value</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#7a7974] uppercase tracking-wide">Formatted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {[
                  500, 12345, 150000, 1500000, 10000000, 250000000,
                ].map((n) => (
                  <tr key={n}>
                    <td className="px-5 py-3 font-mono text-[#7a7974]">{n.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3 font-semibold text-[#28251d]">
                      <CurrencyDisplay amount={n} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* KPICard */}
        <Section title="KPICard">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Normal States</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                  label="Total Balance"
                  value={1287500}
                  delta={12.4}
                  icon={<Wallet className="w-5 h-5" />}
                />
                <KPICard
                  label="Monthly Income"
                  value={95000}
                  delta={5.2}
                  icon={<TrendingUp className="w-5 h-5" />}
                />
                <KPICard
                  label="Monthly Expenses"
                  value={43200}
                  delta={-8.1}
                  icon={<CreditCard className="w-5 h-5" />}
                />
                <KPICard
                  label="Savings Rate"
                  value={51800}
                  delta={-2.3}
                  icon={<PiggyBank className="w-5 h-5" />}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-[#7a7974] uppercase tracking-wide mb-3">Loading State</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard label="Loading" value={0} loading />
                <KPICard label="Loading" value={0} loading />
                <KPICard label="Loading" value={0} loading />
                <KPICard label="Loading" value={0} loading />
              </div>
            </div>
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="bg-white rounded-[8px] shadow-card p-6 space-y-4">
            <h1 className="text-4xl font-bold text-[#28251d]">Heading 1 — ₹1.28Cr</h1>
            <h2 className="text-3xl font-bold text-[#28251d]">Heading 2 — Balance Sheet</h2>
            <h3 className="text-2xl font-semibold text-[#28251d]">Heading 3 — Transactions</h3>
            <h4 className="text-xl font-semibold text-[#28251d]">Heading 4 — Categories</h4>
            <p className="text-base text-[#28251d] leading-relaxed">
              Body text — Inter is a highly legible typeface designed for use in digital interfaces.
              It provides excellent readability at small sizes while maintaining character at larger display sizes.
            </p>
            <p className="text-sm text-[#7a7974] leading-relaxed">
              Muted / secondary text — Used for labels, descriptions, and supporting information across the interface.
            </p>
            <p className="text-xs text-[#7a7974] uppercase tracking-wide font-medium">
              OVERLINE / LABEL — Section Headers
            </p>
          </div>
        </Section>

        {/* Chart Placeholder */}
        <Section title="Chart Preview (Recharts)">
          <div className="bg-white rounded-[8px] shadow-card p-6">
            <p className="text-sm font-semibold text-[#28251d] mb-4">Monthly Income vs Expenses</p>
            <ChartPreview />
          </div>
        </Section>
      </main>
    </div>
  );
}

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const chartData = [
  { month: 'Jan', income: 85000, expenses: 52000 },
  { month: 'Feb', income: 88000, expenses: 48000 },
  { month: 'Mar', income: 92000, expenses: 55000 },
  { month: 'Apr', income: 87000, expenses: 41000 },
  { month: 'May', income: 95000, expenses: 43200 },
  { month: 'Jun', income: 102000, expenses: 50000 },
];

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e9e7e1] rounded-[8px] shadow-card-md p-3 text-sm">
      <p className="font-semibold text-[#28251d] mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-[#7a7974] capitalize">{p.name}:</span>
          <span className="font-medium text-[#28251d]">
            ₹{(p.value / 1000).toFixed(1)}K
          </span>
        </div>
      ))}
    </div>
  );
}

function ChartPreview() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#01696f" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#01696f" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a12c7b" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#a12c7b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0ede6" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#7a7974' }}
          axisLine={{ stroke: '#e9e7e1' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#7a7974' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${v / 1000}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: '#7a7974', paddingTop: 12 }}
          iconType="circle"
          iconSize={8}
        />
        <Area
          type="monotone"
          dataKey="income"
          stroke="#01696f"
          strokeWidth={2}
          fill="url(#incomeGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#01696f' }}
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#a12c7b"
          strokeWidth={2}
          fill="url(#expenseGrad)"
          dot={false}
          activeDot={{ r: 4, fill: '#a12c7b' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
