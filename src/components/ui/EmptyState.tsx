import React from 'react';
import { Button } from './Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="mb-4 text-[#7a7974] w-12 h-12 flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#28251d] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#7a7974] max-w-sm leading-relaxed mb-6">{description}</p>
      )}
      {action && (
        <Button variant="primary" size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
