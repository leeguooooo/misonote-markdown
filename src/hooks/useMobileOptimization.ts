import { useEffect, useState, useCallback } from 'react';

interface MobileOptimizations {
  shouldReduceMotion: boolean;
  shouldEnablePerformanceMode: boolean;
  shouldUseMobileLayout: boolean;
  connectionSpeed: 'slow' | 'fast' | 'unknown';
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  screenSize: 'small' | 'medium' | 'large';
}

// 检测设备类型
function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isIOS: false,
      isAndroid: false,
      screenSize: 'large',
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = /mobile/.test(userAgent) || window.innerWidth < 768;
  const isTablet = /tablet|ipad/.test(userAgent) || 
    (window.innerWidth >= 768 && window.innerWidth < 1024);

  let screenSize: 'small' | 'medium' | 'large' = 'large';
  if (window.innerWidth < 640) {
    screenSize = 'small';
  } else if (window.innerWidth < 1024) {
    screenSize = 'medium';
  }

  return {
    isMobile,
    isTablet,
    isIOS,
    isAndroid,
    screenSize,
  };
}

// 检测网络连接速度
function detectConnectionSpeed(): 'slow' | 'fast' | 'unknown' {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return 'unknown';
  }

  const connection = (navigator as any).connection;
  if (!connection) return 'unknown';

  const effectiveType = connection.effectiveType;
  if (effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'slow';
  }

  return 'fast';
}

// 检测是否应该减少动画
function shouldReduceMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

export function useMobileOptimization() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice());
  const [optimizations, setOptimizations] = useState<MobileOptimizations>({
    shouldReduceMotion: false,
    shouldEnablePerformanceMode: false,
    shouldUseMobileLayout: false,
    connectionSpeed: 'unknown',
  });

  useEffect(() => {
    // 初始化设备信息
    const info = detectDevice();
    setDeviceInfo(info);

    // 设置优化选项
    const connectionSpeed = detectConnectionSpeed();
    const reduceMotion = shouldReduceMotion();
    
    setOptimizations({
      shouldReduceMotion: reduceMotion,
      shouldEnablePerformanceMode: 
        connectionSpeed === 'slow' || info.screenSize === 'small',
      shouldUseMobileLayout: info.isMobile || info.isTablet,
      connectionSpeed,
    });

    // 监听窗口大小变化
    const handleResize = () => {
      const newInfo = detectDevice();
      setDeviceInfo(newInfo);
      
      setOptimizations(prev => ({
        ...prev,
        shouldUseMobileLayout: newInfo.isMobile || newInfo.isTablet,
        shouldEnablePerformanceMode: 
          prev.connectionSpeed === 'slow' || newInfo.screenSize === 'small',
      }));
    };

    // 监听网络变化
    const handleConnectionChange = () => {
      const speed = detectConnectionSpeed();
      setOptimizations(prev => ({
        ...prev,
        connectionSpeed: speed,
        shouldEnablePerformanceMode: 
          speed === 'slow' || deviceInfo.screenSize === 'small',
      }));
    };

    window.addEventListener('resize', handleResize);
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return {
    ...deviceInfo,
    optimizations,
  };
}

// 虚拟键盘检测 Hook
export function useVirtualKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detectKeyboard = () => {
      const { isMobile, isTablet } = detectDevice();
      if (!isMobile && !isTablet) return;

      // 检测视口高度变化来判断键盘是否打开
      const threshold = 150;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.clientHeight;
      
      // 在移动设备上，当键盘弹出时，window.innerHeight 会变小
      const heightDiff = Math.abs(windowHeight - documentHeight);
      setIsKeyboardOpen(heightDiff > threshold);
    };

    // 监听 focus 和 blur 事件
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || 
          target.tagName === 'TEXTAREA' || 
          target.contentEditable === 'true') {
        setTimeout(detectKeyboard, 300); // 延迟检测，等待键盘动画
      }
    };

    const handleBlur = () => {
      setTimeout(() => setIsKeyboardOpen(false), 300);
    };

    // 监听窗口大小变化
    const handleResize = () => {
      detectKeyboard();
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isKeyboardOpen;
}

// 视口高度 Hook
export function useViewportHeight() {
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
      // 设置 CSS 变量供样式使用
      document.documentElement.style.setProperty(
        '--vh',
        `${window.innerHeight * 0.01}px`
      );
    };

    updateHeight();

    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return viewportHeight;
}