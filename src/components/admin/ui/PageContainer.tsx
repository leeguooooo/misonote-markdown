import React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  bleed?: boolean;
}

export function PageContainer({ children, className, bleed }: PageContainerProps) {
  return (
    <div
      className={cn(
        'px-6 pb-10',
        bleed ? 'pt-0' : 'pt-6',
        className
      )}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {children}
      </div>
    </div>
  );
}
