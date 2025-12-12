import React from 'react';
import { cn } from '@/lib/utils';

export interface SectionCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  padding?: 'default' | 'compact' | 'none';
  bleed?: boolean;
  className?: string;
}

const paddingMap = {
  default: 'px-6 py-5',
  compact: 'px-4 py-4',
  none: ''
};

export function SectionCard({
  title,
  description,
  icon,
  actions,
  footer,
  children,
  padding = 'default',
  bleed,
  className
}: SectionCardProps) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-50/40',
        className
      )}
    >
      {(title || description || actions) && (
        <div className={cn('flex items-start justify-between gap-4 border-b border-gray-100', paddingMap[padding])}>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
                  {icon}
                </div>
              )}
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                )}
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>
          </div>
          {actions && <div className="flex flex-shrink-0 gap-2">{actions}</div>}
        </div>
      )}

      <div
        className={cn(
          bleed ? '' : paddingMap[padding],
          bleed ? 'overflow-hidden rounded-2xl' : ''
        )}
      >
        {children}
      </div>

      {footer && (
        <div className={cn('border-t border-gray-100 text-sm text-gray-600', paddingMap[padding])}>
          {footer}
        </div>
      )}
    </section>
  );
}
