'use client';

import React from 'react';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuth>
      <div className="h-screen flex overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="w-64">
            <AdminSidebar />
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <AdminHeader />
          
          {/* Main content */}
          <main className="flex-1 overflow-y-auto">
            <div className="py-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminAuth>
  );
}