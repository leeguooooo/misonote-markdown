'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import {
  Maximize,
  Minimize,
  Sun,
  Moon,
  Type,
  Minus,
  Plus,
  BookOpen,
  Settings,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import ClientOnly from './ClientOnly';

interface ImmersiveSettings {
  isImmersive: boolean;
  isDarkMode: boolean;
  fontSize: number;
  lineHeight: number;
  maxWidth: number;
  showProgress: boolean;
}

interface ImmersiveContextType {
  settings: ImmersiveSettings;
  updateSettings: (updates: Partial<ImmersiveSettings>) => void;
  toggleImmersive: () => void;
}

const ImmersiveContext = createContext<ImmersiveContextType>({
  settings: {
    isImmersive: false,
    isDarkMode: false,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 800,
    showProgress: true,
  },
  updateSettings: () => {},
  toggleImmersive: () => {},
});

export const useImmersive = () => useContext(ImmersiveContext);

export function ImmersiveProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ImmersiveSettings>({
    isImmersive: false,
    isDarkMode: false,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 800,
    showProgress: true,
  });

  useEffect(() => {
    // 从 localStorage 加载设置
    const saved = localStorage.getItem('immersiveSettings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsed, isImmersive: false })); // 不保存沉浸式状态
      } catch (error) {
        console.error('Failed to parse immersive settings:', error);
      }
    }
  }, []);

  useEffect(() => {
    // 保存设置到 localStorage
    const { isImmersive, ...settingsToSave } = settings;
    localStorage.setItem('immersiveSettings', JSON.stringify(settingsToSave));
  }, [settings]);

  const updateSettings = (updates: Partial<ImmersiveSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const toggleImmersive = () => {
    setSettings(prev => ({ ...prev, isImmersive: !prev.isImmersive }));
  };

  return (
    <ImmersiveContext.Provider value={{ settings, updateSettings, toggleImmersive }}>
      {children}
    </ImmersiveContext.Provider>
  );
}

interface ImmersiveReaderProps {
  children?: React.ReactNode;
}

export default function ImmersiveReader({ children }: ImmersiveReaderProps = {}) {
  const { settings, updateSettings, toggleImmersive } = useImmersive();
  const [showSettings, setShowSettings] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 计算阅读进度
  useEffect(() => {
    if (!settings.isImmersive || !settings.showProgress) return;

    const updateProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, [settings.isImmersive, settings.showProgress]);

  // 应用沉浸式样式
  useEffect(() => {
    if (settings.isImmersive) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.fontSize = `${settings.fontSize}px`;
      document.documentElement.style.lineHeight = settings.lineHeight.toString();

      if (settings.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.fontSize = '';
      document.documentElement.style.lineHeight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.fontSize = '';
      document.documentElement.style.lineHeight = '';
    };
  }, [settings]);

  // 避免 hydration 错误
  if (!isMounted) {
    return null;
  }

  if (!settings.isImmersive) {
    return (
      <button
        onClick={toggleImmersive}
        className="fixed bottom-6 left-6 z-[9999] p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 hover:scale-110 transition-all duration-200 border-2 border-white dark:border-gray-800"
        title="进入沉浸式阅读"
        style={{ zIndex: 9999 }}
      >
        <BookOpen className="w-6 h-6" />
      </button>
    );
  }

  return (
    <>
      {/* 阅读进度条 */}
      {settings.showProgress && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      )}

      {/* 沉浸式工具栏 */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {/* 设置按钮 */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="阅读设置"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 退出沉浸式 */}
        <button
          onClick={toggleImmersive}
          className="p-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title="退出沉浸式阅读"
        >
          <Minimize className="w-4 h-4" />
        </button>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="fixed top-16 right-4 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">阅读设置</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* 主题切换 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">深色模式</span>
              <button
                onClick={() => updateSettings({ isDarkMode: !settings.isDarkMode })}
                className={`p-2 rounded-lg transition-colors ${
                  settings.isDarkMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </div>

            {/* 字体大小 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">字体大小</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{settings.fontSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSettings({ fontSize: Math.max(12, settings.fontSize - 1) })}
                  className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((settings.fontSize - 12) / (24 - 12)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => updateSettings({ fontSize: Math.min(24, settings.fontSize + 1) })}
                  className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 行高 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">行高</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{settings.lineHeight}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSettings({ lineHeight: Math.max(1.2, settings.lineHeight - 0.1) })}
                  className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((settings.lineHeight - 1.2) / (2.0 - 1.2)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => updateSettings({ lineHeight: Math.min(2.0, settings.lineHeight + 0.1) })}
                  className="p-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* 阅读进度 */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">显示阅读进度</span>
              <button
                onClick={() => updateSettings({ showProgress: !settings.showProgress })}
                className={`p-2 rounded-lg transition-colors ${
                  settings.showProgress
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {settings.showProgress ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>

            {/* 阅读进度显示 */}
            {settings.showProgress && (
              <div className="text-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  阅读进度: {readingProgress.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
