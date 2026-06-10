import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#01696f] text-white hover:bg-[#0c4e54] focus-visible:ring-[#01696f] disabled:bg-[#01696f]/50',
  secondary:
    'bg-transparent text-[#01696f] border border-[#01696f] hover:bg-[#01696f]/8 focus-visible:ring-[#01696f] disabled:opacity-50',
  ghost:
    'bg-transparent text-[#28251d] hover:bg-[#28251d]/8 focus-visible:ring-[#01696f] disabled:opacity-50',
  danger:
    'bg-[#a12c7b] text-white hover:bg-[#8a2468] focus-visible:ring-[#a12c7b] disabled:bg-[#a12c7b]/50',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded-[6px] transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <>
          <Loader2
            className={`animate-spin ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
          />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
