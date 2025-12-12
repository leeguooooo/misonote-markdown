import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        <aside className="hidden border-r border-slate-200 bg-white/95 backdrop-blur lg:block lg:w-72 xl:w-80">
          <AdminSidebar variant="desktop" />
        </aside>

        <div className="flex w-full flex-col">
          <AdminHeader onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-slate-900/50 transition-opacity',
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={() => setSidebarOpen(false)}
        />
        <div
          className={cn(
            'relative h-full w-80 max-w-full bg-white shadow-2xl transition-transform',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <AdminSidebar variant="mobile" onClose={() => setSidebarOpen(false)} />
        </div>
      </div>
    </div>
  );
}
