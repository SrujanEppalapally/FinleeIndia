import React from 'react';

type BadgeVariant = 'green' | 'red' | 'yellow' | 'gray' | 'teal';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-[#437a22]/12 text-[#437a22]',
  red: 'bg-[#a12c7b]/12 text-[#a12c7b]',
  yellow: 'bg-[#b45309]/12 text-[#b45309]',
  gray: 'bg-[#7a7974]/12 text-[#7a7974]',
  teal: 'bg-[#01696f]/12 text-[#01696f]',
};

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5 rounded-[9999px] text-xs font-medium',
        variantClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
