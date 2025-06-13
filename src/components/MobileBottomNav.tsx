'use client';

import React from 'react';
import Link from 'next/link';
import { Home, BookOpen, Search, User, Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface MobileBottomNavProps {
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

export default function MobileBottomNav({ onMenuToggle, onSearchOpen }: MobileBottomNavProps) {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      icon: Home,
      label: '首页',
      href: '/',
      onClick: undefined
    },
    {
      icon: BookOpen,
      label: '文档',
      href: '/docs',
      onClick: undefined
    },
    {
      icon: Search,
      label: '搜索',
      href: '#',
      onClick: onSearchOpen
    },
    {
      icon: Menu,
      label: '菜单',
      href: '#',
      onClick: onMenuToggle
    }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          if (item.onClick) {
            return (
              <button
                key={index}
                onClick={item.onClick}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                  active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] ${
                active
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
