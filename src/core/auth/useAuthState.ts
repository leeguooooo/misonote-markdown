/**
 * React Hook for unified authentication state management
 */

import { useState, useEffect, useCallback } from 'react';
import { AuthStateManager, AuthState } from './AuthStateManager';

export function useAuthState() {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // 只在客户端获取状态
    if (typeof window !== 'undefined') {
      return AuthStateManager.getInstance().getAuthState();
    }
    return {
      isAuthenticated: false,
      user: null,
      token: null,
      lastVerified: 0
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authManager = typeof window !== 'undefined' ? AuthStateManager.getInstance() : null;

  // 监听认证状态变化
  useEffect(() => {
    if (!authManager) return;

    const unsubscribe = authManager.addListener((newState) => {
      setAuthState(newState);
    });

    return unsubscribe;
  }, [authManager]);

  // 验证认证状态
  const verifyAuth = useCallback(async () => {
    if (!authManager) return false;

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await authManager.verifyAuthState();
      return isValid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '认证验证失败';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authManager]);

  // 登录
  const login = useCallback((user: any, token?: string | null) => {
    if (!authManager) return;
    authManager.setAuthState(user, token);
    setError(null);
  }, [authManager]);

  // 登出
  const logout = useCallback(() => {
    if (!authManager) return;
    authManager.logout();
    setError(null);
  }, [authManager]);

  // 强制刷新
  const forceRefresh = useCallback(async () => {
    if (!authManager) return false;

    setIsLoading(true);
    setError(null);

    try {
      const isValid = await authManager.forceRefresh();
      return isValid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刷新认证状态失败';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authManager]);

  // 清理所有数据
  const clearAllData = useCallback(() => {
    if (!authManager) return;
    authManager.clearAllAuthData();
    setError(null);
  }, [authManager]);

  // 诊断认证状态
  const diagnose = useCallback(() => {
    if (!authManager) return {
      hasValidToken: false,
      tokenAge: 0,
      stateAge: 0,
      version: 'unknown',
      recommendations: ['客户端未初始化']
    };
    return authManager.diagnoseAuthState();
  }, [authManager]);

  return {
    // 状态
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    isLoading,
    error,

    // 方法
    verifyAuth,
    login,
    logout,
    forceRefresh,
    clearAllData,
    diagnose,

    // 便捷属性
    isAdmin: authState.user?.role === 'admin',
    isLoggedIn: authState.isAuthenticated,
  };
}
