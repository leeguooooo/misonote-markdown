'use client';

import { useEffect } from 'react';
import { setupApiInterceptor } from '@/lib/api/interceptor';

export default function ApiInterceptorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 只在客户端初始化拦截器
    if (typeof window !== 'undefined') {
      setupApiInterceptor();
    }
  }, []);

  return <>{children}</>;
}