import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number;
  preventDefaultTouchmoveEvent?: boolean;
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const { threshold = 50, preventDefaultTouchmoveEvent = false } = config;
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touchEnd = {
        x: e.changedTouches[0].clientX,
        y: e.changedTouches[0].clientY,
      };

      const deltaX = touchEnd.x - touchStartRef.current.x;
      const deltaY = touchEnd.y - touchStartRef.current.y;

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // 判断是水平滑动还是垂直滑动
      if (absX > absY && absX > threshold) {
        if (deltaX > 0 && handlers.onSwipeRight) {
          handlers.onSwipeRight();
        } else if (deltaX < 0 && handlers.onSwipeLeft) {
          handlers.onSwipeLeft();
        }
      } else if (absY > absX && absY > threshold) {
        if (deltaY > 0 && handlers.onSwipeDown) {
          handlers.onSwipeDown();
        } else if (deltaY < 0 && handlers.onSwipeUp) {
          handlers.onSwipeUp();
        }
      }

      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchmoveEvent });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, preventDefaultTouchmoveEvent]);

  return elementRef;
}

// 专门用于侧边栏的滑动手势
export function useSidebarSwipe(
  onOpen: () => void,
  onClose: () => void,
  config: SwipeConfig = {}
) {
  return useSwipeGesture(
    {
      onSwipeRight: onOpen,
      onSwipeLeft: onClose,
    },
    config
  );
}

// 页面切换手势
export function usePageSwipe(
  onPrevPage: () => void,
  onNextPage: () => void,
  config: SwipeConfig = {}
) {
  return useSwipeGesture(
    {
      onSwipeRight: onPrevPage,
      onSwipeLeft: onNextPage,
    },
    config
  );
}