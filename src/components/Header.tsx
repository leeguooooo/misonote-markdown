'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Menu, X, BookOpen } from 'lucide-react';
import SearchDialog from '@/community/search/SearchDialog';
import GitHubLink from './GitHubLink';
import UserManager from './UserManager';
import { DocFile } from '@/core/docs/docs';

interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  isSearchOpen?: boolean;
  onSearchToggle?: () => void;
}

export default function Header({
  onMenuToggle,
  isMobileMenuOpen,
  isSearchOpen = false,
  onSearchToggle
}: HeaderProps) {
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);

  // 使用外部状态或内部状态
  const searchOpen = onSearchToggle ? isSearchOpen : internalSearchOpen;
  const handleSearchToggle = onSearchToggle || (() => setInternalSearchOpen(!internalSearchOpen));

  const handleSearch = async (query: string): Promise<DocFile[]> => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 safe-area-top">
        <div className="flex items-center justify-between h-16 px-3 sm:px-4">
          {/* Left side */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 touch-feedback min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <span className="text-base sm:text-xl font-bold text-gray-900 hidden sm:inline">
                文档中心
              </span>
            </Link>
          </div>

          {/* Center - Search (Desktop) / Right side - Search button (Mobile) */}
          <div className="flex-1 flex items-center justify-end sm:justify-center">
            {/* Desktop Search Bar */}
            <div className="hidden sm:block flex-1 max-w-md mx-4 search-bar">
              <button
                onClick={handleSearchToggle}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors min-h-[44px]"
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">搜索文档...</span>
                <div className="ml-auto hidden lg:flex items-center gap-1">
                  <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">
                    ⌘
                  </kbd>
                  <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">
                    K
                  </kbd>
                </div>
              </button>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={handleSearchToggle}
              className="sm:hidden p-2 text-gray-600 hover:text-gray-900 touch-feedback min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
            {/* Navigation links - Desktop only */}
            <nav className="hidden lg:flex items-center gap-6 header-nav">
              <Link
                href="/docs"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] flex items-center"
              >
                文档
              </Link>
              <Link
                href="/docs/示例文档/api"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] flex items-center"
              >
                API
              </Link>
              <Link
                href="/docs/示例文档/tutorials"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors min-h-[44px] flex items-center"
              >
                教程
              </Link>
            </nav>

            {/* GitHub Link - Hidden on mobile */}
            <div className="hidden md:block">
              <GitHubLink variant="header" />
            </div>

            {/* User Manager */}
            <UserManager />
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={searchOpen}
        onClose={() => onSearchToggle ? onSearchToggle() : setInternalSearchOpen(false)}
        onSearch={handleSearch}
      />
    </>
  );
}
