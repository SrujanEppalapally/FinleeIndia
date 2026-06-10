import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="w-full flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#28251d]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a7974] w-4 h-4 flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={[
            'w-full h-10 rounded-[6px] border bg-white text-[#28251d] text-sm placeholder:text-[#7a7974]',
            'px-3 transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#01696f] focus:border-[#01696f]',
            'disabled:bg-[#f7f6f2] disabled:cursor-not-allowed disabled:text-[#7a7974]',
            error
              ? 'border-[#a12c7b] focus:ring-[#a12c7b] focus:border-[#a12c7b]'
              : 'border-[#d4d2cc] hover:border-[#7a7974]',
            leftIcon ? 'pl-9' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-[#a12c7b]">{error}</p>}
    </div>
  );
}
