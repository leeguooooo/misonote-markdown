import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type TrendDirection = 'up' | 'down' | 'flat';

interface MetaItem {
  label: string;
  value: string;
  hint?: string;
  trend?: {
    value: string;
    direction: TrendDirection;
  };
}

interface TabItem {
  id: string;
  label: string;
  href?: string;
  active?: boolean;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  onClick?: () => void;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  meta?: MetaItem[];
  actions?: React.ReactNode;
  tabs?: TabItem[];
  borderless?: boolean;
  className?: string;
}

const trendColorMap: Record<TrendDirection, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  flat: 'text-gray-500'
};

export function PageHeader({
  title,
  description,
  badge,
  icon,
  meta,
  actions,
  tabs,
  borderless,
  className
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'bg-white px-6 py-6',
        borderless ? '' : 'border-b border-gray-200 shadow-sm shadow-gray-50/50',
        className
      )}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {icon}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {badge}
              </div>
              {description && (
                <p className="mt-1 max-w-2xl text-sm text-gray-600">{description}</p>
              )}
            </div>
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap gap-2">{actions}</div>
        )}
      </div>

      {meta && meta.length > 0 && (
        <dl className="mt-6 grid gap-4 border-t border-gray-100 pt-4 text-sm md:grid-cols-3">
          {meta.map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {item.label}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {item.value}
              </dd>
              {item.hint && (
                <p className="text-xs text-gray-500">{item.hint}</p>
              )}
              {item.trend && (
                <p className={cn('text-xs font-medium', trendColorMap[item.trend.direction])}>
                  {item.trend.direction === 'up' && '↑ '}
                  {item.trend.direction === 'down' && '↓ '}
                  {item.trend.direction === 'flat' && '• '}
                  {item.trend.value}
                </p>
              )}
            </div>
          ))}
        </dl>
      )}

      {tabs && tabs.length > 0 && (
        <div className="mt-6 flex gap-2 overflow-x-auto rounded-xl border border-gray-100 bg-gray-50 p-1">
          {tabs.map((tab) => {
            const content = (
              <>
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge}
              </>
            );

            if (tab.href) {
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={tab.onClick}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                    tab.active
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-900'
                  )}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={tab.id}
                onClick={tab.onClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                  tab.active
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                )}
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
