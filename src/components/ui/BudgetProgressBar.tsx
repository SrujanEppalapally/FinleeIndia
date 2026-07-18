import { formatINR } from './CurrencyDisplay';

interface BudgetProgressBarProps {
  category: string;
  spent: number;
  limit: number;
  className?: string;
}

function barColor(pct: number): string {
  if (pct > 100) return 'bg-[#a12c7b]';
  if (pct > 90) return 'bg-[#a12c7b]';
  if (pct > 70) return 'bg-[#b45309]';
  return 'bg-[#437a22]';
}

function labelColor(pct: number): string {
  if (pct > 100) return 'text-[#a12c7b]';
  if (pct > 90) return 'text-[#a12c7b]';
  if (pct > 70) return 'text-[#b45309]';
  return 'text-[#437a22]';
}

export function BudgetProgressBar({ category, spent, limit, className = '' }: BudgetProgressBarProps) {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  const isOver = pct > 100;
  const overBy = isOver ? spent - limit : 0;
  // Visual fill: full track represents the budget limit. Over-budget portion
  // overflows past the track via an absolute-positioned extension.
  const fillWidth = Math.min(pct, 100);
  const overflowWidth = isOver ? Math.min(pct - 100, 100) : 0;

  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#28251d] font-medium">{category}</span>
        <span className={`text-xs font-semibold ${labelColor(pct)}`}>
          {pct}%
        </span>
      </div>
      <div className="relative h-2 bg-[#f0ede6] rounded-full overflow-visible">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
          style={{ width: `${fillWidth}%` }}
        />
        {isOver && (
          <div
            className="absolute top-0 left-full h-full bg-[#a12c7b]/60 rounded-r-full transition-all duration-500"
            style={{ width: `${overflowWidth}%` }}
            title={`Over budget by ${formatINR(overBy)}`}
          />
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#7a7974]">
          {formatINR(spent)} <span className="text-[#d4d2cc]">/</span> {formatINR(limit)}
        </span>
        {isOver ? (
          <span className="text-xs font-medium text-[#a12c7b]">
            Over budget by {formatINR(overBy)}
          </span>
        ) : (
          <span className="text-xs text-[#7a7974]">of {formatINR(limit)}</span>
        )}
      </div>
    </div>
  );
}
