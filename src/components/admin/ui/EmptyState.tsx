import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'positive' | 'warning';
}

const toneClasses: Record<NonNullable<EmptyStateProps['tone']>, string> = {
  neutral: 'bg-gray-50 text-gray-600 border-gray-100',
  positive: 'bg-green-50 text-green-700 border-green-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100'
};

export function EmptyState({
  title,
  description,
  icon,
  actions,
  className,
  tone = 'neutral'
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex h-full flex-col items-center justify-center rounded-2xl border px-6 py-10 text-center',
        toneClasses[tone],
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-2xl">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm opacity-80">{description}</p>
      )}
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
