import React from 'react';
import { cn } from '@/lib/utils';

type MetricTrend = 'up' | 'down' | 'neutral';

export interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  trend?: MetricTrend;
  description?: string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'purple' | 'gray';
  className?: string;
}

const trendColor: Record<MetricTrend, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-500'
};

const accentClass: Record<NonNullable<MetricCardProps['accent']>, string> = {
  blue: 'text-blue-600 bg-blue-50/80',
  green: 'text-green-600 bg-green-50/80',
  amber: 'text-amber-600 bg-amber-50/80',
  purple: 'text-purple-600 bg-purple-50/80',
  gray: 'text-gray-600 bg-gray-50/80'
};

export function MetricCard({
  label,
  value,
  delta,
  trend = 'neutral',
  description,
  icon,
  accent = 'blue',
  className
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-50/30',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', accentClass[accent])}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        {delta && (
          <span className={cn('text-sm font-medium', trendColor[trend])}>{delta}</span>
        )}
      </div>
      {description && (
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}
