'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [isMounted, setIsMounted] = useState(false);

  // 获取系统主题
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // 解析实际主题
  const resolveTheme = (theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return getSystemTheme();
    }
    return theme;
  };

  // 应用主题到 DOM
  const applyTheme = (resolvedTheme: 'light' | 'dark') => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    // 只管理 dark 类，避免 hydration 错误
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // 确保 body 也有正确的背景色
    document.body.style.backgroundColor = resolvedTheme === 'dark' ? '#0f172a' : '#ffffff';
    document.body.style.color = resolvedTheme === 'dark' ? '#f1f5f9' : '#171717';
  };

  // 初始化主题
  useEffect(() => {
    setIsMounted(true);

    // 从 localStorage 读取保存的主题
    const savedTheme = localStorage.getItem('theme') as Theme;
    const initialTheme = savedTheme && ['light', 'dark', 'system'].includes(savedTheme) ? savedTheme : 'light';

    setTheme(initialTheme);

    // 立即应用初始主题
    const initialResolvedTheme = resolveTheme(initialTheme);
    setResolvedTheme(initialResolvedTheme);
    applyTheme(initialResolvedTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const currentTheme = localStorage.getItem('theme') as Theme || 'light';
      if (currentTheme === 'system') {
        const newResolvedTheme = getSystemTheme();
        setResolvedTheme(newResolvedTheme);
        applyTheme(newResolvedTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 主题变化时更新
  useEffect(() => {
    if (!isMounted) return;

    const newResolvedTheme = resolveTheme(theme);
    setResolvedTheme(newResolvedTheme);
    applyTheme(newResolvedTheme);

    // 保存到 localStorage
    localStorage.setItem('theme', theme);
  }, [theme, isMounted]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 避免 hydration 错误
  if (!isMounted) {
    return (
      <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors">
        <Sun className="w-4 h-4" />
      </button>
    );
  }

  const themes = [
    { key: 'light' as const, label: '浅色模式', icon: Sun },
    { key: 'dark' as const, label: '深色模式', icon: Moon },
    { key: 'system' as const, label: '跟随系统', icon: Monitor },
  ];

  const currentTheme = themes.find(t => t.key === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        title={`当前主题: ${currentTheme.label}`}
      >
        <CurrentIcon className="w-4 h-4" />
      </button>

      {showMenu && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* 主题菜单 */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              选择主题
            </div>

            {themes.map((themeOption) => {
              const Icon = themeOption.icon;
              const isActive = theme === themeOption.key;

              return (
                <button
                  key={themeOption.key}
                  onClick={() => {
                    setTheme(themeOption.key);
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="flex-1 text-left">{themeOption.label}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
                  )}
                </button>
              );
            })}

            <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2 px-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                当前: {resolvedTheme === 'dark' ? '深色' : '浅色'}模式
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
