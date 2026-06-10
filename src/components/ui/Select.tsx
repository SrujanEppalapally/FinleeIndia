import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ label, error, options, placeholder, className = '', id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-[#28251d]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          className={[
            'w-full h-10 rounded-[6px] border bg-white text-[#28251d] text-sm appearance-none',
            'px-3 pr-8 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
            'disabled:bg-[#f7f6f2] disabled:cursor-not-allowed disabled:text-[#7a7974]',
            error
              ? 'border-[#a12c7b] focus:ring-[#a12c7b] focus:border-[#a12c7b]'
              : 'border-[#d4d2cc] hover:border-[#7a7974]',
            className,
          ].join(' ')}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a7974] pointer-events-none" />
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}
