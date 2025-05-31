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
}

export default function Header({ onMenuToggle, isMobileMenuOpen }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                文档中心
              </span>
            </Link>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>搜索文档...</span>
              <div className="ml-auto flex items-center gap-1">
                <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">
                  ⌘
                </kbd>
                <kbd className="px-2 py-1 text-xs bg-white border border-gray-300 rounded">
                  K
                </kbd>
              </div>
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/docs"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                文档
              </Link>
              <Link
                href="/docs/示例文档/api"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                API
              </Link>
              <Link
                href="/docs/示例文档/tutorials"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                教程
              </Link>
            </nav>

            {/* GitHub Link */}
            <GitHubLink variant="header" />

            {/* User Manager */}
            <UserManager />
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSearch={handleSearch}
      />
    </>
  );
}
