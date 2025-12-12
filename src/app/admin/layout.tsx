'use client';

import React from 'react';
import AdminAuth from '@/components/admin/AdminAuth';
import AdminShell from '@/components/admin/AdminShell';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuth>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminAuth>
  );
}
