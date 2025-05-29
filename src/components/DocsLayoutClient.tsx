'use client';

import { useState, useEffect } from 'react';
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
  const [currentPath, setCurrentPath] = useState<string[] | undefined>(undefined);
  const pathname = usePathname();

  console.log('DocsLayoutClient rendered with pathname:', pathname);

  // 从 URL 路径中提取当前文档路径
  useEffect(() => {
    console.log('DocsLayoutClient useEffect triggered with pathname:', pathname);
    if (pathname.startsWith('/docs/')) {
      const pathSegments = pathname.slice(6).split('/'); // 移除 '/docs/' 前缀
      const decodedSegments = pathSegments.map(segment => decodeURIComponent(segment));
      const filteredSegments = decodedSegments.filter(segment => segment.length > 0);
      setCurrentPath(filteredSegments);
      console.log('DocsLayoutClient - Current path set to:', filteredSegments);
    } else {
      setCurrentPath(undefined);
      console.log('DocsLayoutClient - Current path set to undefined (not docs path)');
    }
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
