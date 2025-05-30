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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-blue-50 relative">
      {/* 文档页面背景网格 - 多层叠加 */}
      <div className="fixed inset-0 bg-grid-docs opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-grid-floating opacity-30 pointer-events-none"></div>

      {/* 微妙的浮动装饰 */}
      <div className="fixed top-20 right-10 w-32 h-32 bg-blue-400/8 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '4s' }}></div>
      <div className="fixed bottom-20 left-10 w-40 h-40 bg-purple-400/8 rounded-full blur-2xl pointer-events-none animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      <div className="fixed top-1/2 right-1/4 w-24 h-24 bg-indigo-400/6 rounded-full blur-xl pointer-events-none animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      </div>

      <div className="flex pt-16">
        {/* Fixed Desktop Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="fixed top-16 left-0 w-64 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white/95 backdrop-blur-sm z-30">
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
            <div className="relative bg-white/95 backdrop-blur-sm w-64 mt-16">
              <div className="h-[calc(100vh-4rem)] overflow-y-auto">
                <Sidebar docTree={docTree} currentPath={currentPath} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1">
          {/* Document Content - 在减去右侧边栏后的空间内居中 */}
          <main className="relative z-20">
            <div className="min-h-[calc(100vh-4rem)] bg-transparent">
              {/* 为右侧评论区预留空间，然后在剩余空间内居中 */}
              <div className="xl:pr-72">
                <div className="max-w-4xl mx-auto px-6 py-4">
                  <div className="bg-white/92 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 p-8 relative w-full">
                    {/* 内容区域的微妙网格背景 */}
                    <div className="absolute inset-0 bg-grid-docs-subtle opacity-20 rounded-xl pointer-events-none"></div>
                    <div className="relative z-10">
                      {children}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar for Comments - 固定定位 */}
          <div className="hidden xl:block">
            <div
              id="comments-sidebar"
              className="fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-white/95 backdrop-blur-sm border-l border-gray-200 overflow-y-auto z-30"
            >
              {/* Comments will be rendered here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
