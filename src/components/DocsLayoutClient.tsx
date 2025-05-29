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
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      </div>

      <div className="flex pt-16">
        {/* Fixed Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Sidebar docTree={docTree} currentPath={currentPath} />
          </div>
        </div>

        {/* Mobile Sidebar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="relative bg-white dark:bg-gray-900 w-64 mt-16">
              <div className="h-[calc(100vh-4rem)] overflow-y-auto">
                <Sidebar docTree={docTree} currentPath={currentPath} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Document Content */}
          <main className="flex-1 min-w-0">
            <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </div>
            </div>
          </main>

          {/* Right Sidebar for Comments */}
          <aside className="hidden xl:block w-80 flex-shrink-0">
            <div
              id="comments-sidebar"
              className="fixed top-16 right-0 w-80 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto"
            >
              {/* Comments will be rendered here */}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
