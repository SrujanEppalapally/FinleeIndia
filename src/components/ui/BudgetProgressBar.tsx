import { formatINR } from './CurrencyDisplay';

interface BudgetProgressBarProps {
  category: string;
  spent: number;
  limit: number;
  className?: string;
}

function barColor(pct: number): string {
  if (pct > 90) return 'bg-[#a12c7b]';
  if (pct > 70) return 'bg-[#b45309]';
  return 'bg-[#437a22]';
}

function labelColor(pct: number): string {
  if (pct > 90) return 'text-[#a12c7b]';
  if (pct > 70) return 'text-[#b45309]';
  return 'text-[#437a22]';
}

export function BudgetProgressBar({ category, spent, limit, className = '' }: BudgetProgressBarProps) {
  const pct = Math.min(Math.round((spent / limit) * 100), 100);
  const fillWidth = Math.min((spent / limit) * 100, 100);

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#28251d] font-medium">{category}</span>
        <span className={`text-xs font-semibold ${labelColor(pct)}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 bg-[#f0ede6] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
          style={{ width: `${fillWidth}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7a7974]">{formatINR(spent)}</span>
        <span className="text-xs text-[#7a7974]">of {formatINR(limit)}</span>
      </div>
    </div>
  );
}
