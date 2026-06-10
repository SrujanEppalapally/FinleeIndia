import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CurrencyDisplay } from './CurrencyDisplay';
import { Skeleton } from './Skeleton';

interface KPICardProps {
  label: string;
  value: number;
  delta?: number;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function KPICard({ label, value, delta, icon, loading = false, className = '' }: KPICardProps) {
  if (loading) {
    return <Skeleton variant="card" className={className} />;
  }

  const isPositive = delta !== undefined && delta >= 0;
  const isNegative = delta !== undefined && delta < 0;

  return (
    <div
      className={[
        'bg-white rounded-[8px] shadow-card p-5 flex flex-col gap-3 relative',
        className,
      ].join(' ')}
    >
      {icon && (
        <span className="absolute top-4 right-4 text-[#7a7974] w-5 h-5 flex items-center justify-center opacity-60">
          {icon}
        </span>
      )}
      <p className="text-sm text-[#7a7974] font-medium pr-8">{label}</p>
      <CurrencyDisplay
        amount={value}
        className="text-2xl font-bold text-[#28251d] leading-tight"
      />
      {delta !== undefined && (
        <div
          className={[
            'flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-[#437a22]' : '',
            isNegative ? 'text-[#a12c7b]' : '',
          ].join(' ')}
        >
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{isPositive ? '+' : ''}{delta.toFixed(1)}% vs last month</span>
        </div>
      )}
    </div>
  );
}
