'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import type { DocTree } from '@/lib/docs';

interface DocsLayoutClientProps {
  docTree: DocTree;
  children: React.ReactNode;
}

export default function DocsLayoutClient({ docTree, children }: DocsLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // 直接从 pathname 计算 currentPath
  const currentPath = useMemo(() => {
    if (pathname.startsWith('/docs/')) {
      const pathSegments = pathname.slice(6).split('/');
      const decodedSegments = pathSegments.map(segment => decodeURIComponent(segment));
      const filteredSegments = decodedSegments.filter(segment => segment.length > 0);
      return filteredSegments;
    }
    return undefined;
  }, [pathname]);



  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar docTree={docTree} currentPath={currentPath} />
        </div>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative bg-white dark:bg-gray-900 w-64">
              <Sidebar docTree={docTree} currentPath={currentPath} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
