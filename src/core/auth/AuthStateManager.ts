/**
 * 统一的认证状态管理器
 * 处理JWT token验证、缓存清理、兼容性问题
 */

// 客户端安全的日志函数
const safeLog = {
  info: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.info(`[AUTH] ${message}`, meta || '');
    } else {
      try {
        const { log } = require('@/core/logger');
        log.info(message, meta);
      } catch (error) {
        console.info(`[AUTH] ${message}`, meta || '');
      }
    }
  },
  warn: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.warn(`[AUTH] ${message}`, meta || '');
    } else {
      try {
        const { log } = require('@/core/logger');
        log.warn(message, meta);
      } catch (error) {
        console.warn(`[AUTH] ${message}`, meta || '');
      }
    }
  },
  error: (message: string, meta?: any) => {
    if (typeof window !== 'undefined') {
      console.error(`[AUTH] ${message}`, meta || '');
    } else {
      try {
        const { log } = require('@/core/logger');
        log.error(message, meta);
      } catch (error) {
        console.error(`[AUTH] ${message}`, meta || '');
      }
    }
  }
};

export interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  lastVerified: number;
}

export class AuthStateManager {
  private static instance: AuthStateManager;
  private authState: AuthState = {
    isAuthenticated: false,
    user: null,
    token: null,
    lastVerified: 0
  };
  private listeners: Array<(state: AuthState) => void> = [];
  private verificationPromise: Promise<boolean> | null = null;

  // localStorage keys
  private readonly ADMIN_TOKEN_KEY = 'admin-token';
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly AUTH_STATE_KEY = 'authState';
  private readonly AUTH_VERSION_KEY = 'authVersion';

  // 当前认证系统版本，用于检测不兼容的旧数据
  private readonly CURRENT_AUTH_VERSION = '3.0.0';

  // Token验证缓存时间（5分钟）
  private readonly VERIFICATION_CACHE_TIME = 5 * 60 * 1000;

  private constructor() {
    // 只在客户端初始化
    if (typeof window !== 'undefined') {
      this.initializeAuthState();
    }
  }

  public static getInstance(): AuthStateManager {
    if (!AuthStateManager.instance) {
      AuthStateManager.instance = new AuthStateManager();
    }
    return AuthStateManager.instance;
  }

  /**
   * 初始化认证状态
   */
  private initializeAuthState(): void {
    // 确保在客户端环境
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // 检查认证系统版本
      const savedVersion = localStorage.getItem(this.AUTH_VERSION_KEY);
      if (savedVersion !== this.CURRENT_AUTH_VERSION) {
        safeLog.warn(`认证系统版本不匹配，清理旧数据。旧版本: ${savedVersion}, 新版本: ${this.CURRENT_AUTH_VERSION}`);
        this.clearAllAuthData();
        localStorage.setItem(this.AUTH_VERSION_KEY, this.CURRENT_AUTH_VERSION);
        return;
      }

      // 尝试从localStorage恢复状态
      const savedState = localStorage.getItem(this.AUTH_STATE_KEY);
      if (savedState) {
        const parsedState = JSON.parse(savedState);

        // 检查状态是否过期（超过1小时自动清理）
        const stateAge = Date.now() - (parsedState.lastVerified || 0);
        if (stateAge > 60 * 60 * 1000) {
          safeLog.info('认证状态已过期，清理数据');
          this.clearAllAuthData();
          return;
        }

        this.authState = parsedState;
        safeLog.info('恢复认证状态成功');
      }

      // 检查token有效性
      const token = localStorage.getItem(this.ADMIN_TOKEN_KEY);
      if (token && !this.isTokenValid(token)) {
        safeLog.warn('检测到无效token，清理认证数据');
        this.clearAllAuthData();
      }

    } catch (error) {
      safeLog.error('初始化认证状态失败，清理所有数据:', error);
      this.clearAllAuthData();
    }
  }

  /**
   * 检查token格式是否有效（不验证签名）
   */
  private isTokenValid(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }

      // JWT应该有3个部分
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // 尝试解析payload
      const payload = JSON.parse(atob(parts[1]));

      // 检查是否过期
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        safeLog.info('Token已过期');
        return false;
      }

      return true;
    } catch (error) {
      safeLog.warn('Token格式无效:', error);
      return false;
    }
  }

  /**
   * 清理所有认证相关数据
   */
  public clearAllAuthData(): void {
    safeLog.info('清理所有认证数据');

    // 只在客户端清理localStorage
    if (typeof window === 'undefined') {
      return;
    }

    // 清理localStorage
    const keysToRemove = [
      this.ADMIN_TOKEN_KEY,
      this.CURRENT_USER_KEY,
      this.AUTH_STATE_KEY,
      // 清理可能的旧版本keys
      'token',
      'user',
      'adminToken',
      'userToken'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });

    // 重置内存状态
    this.authState = {
      isAuthenticated: false,
      user: null,
      token: null,
      lastVerified: 0
    };

    // 通知监听器
    this.notifyListeners();
  }

  /**
   * 验证当前认证状态
   */
  public async verifyAuthState(): Promise<boolean> {
    // 只在客户端验证
    if (typeof window === 'undefined') {
      return false;
    }

    // 如果正在验证，返回现有的Promise
    if (this.verificationPromise) {
      return this.verificationPromise;
    }

    // 检查缓存
    const now = Date.now();
    if (this.authState.lastVerified &&
        (now - this.authState.lastVerified) < this.VERIFICATION_CACHE_TIME &&
        this.authState.isAuthenticated) {
      return true;
    }

    this.verificationPromise = this.performVerification();
    const result = await this.verificationPromise;
    this.verificationPromise = null;

    return result;
  }

  /**
   * 执行实际的验证
   */
  private async performVerification(): Promise<boolean> {
    try {
      const token = localStorage.getItem(this.ADMIN_TOKEN_KEY);

      if (!token || !this.isTokenValid(token)) {
        this.clearAllAuthData();
        return false;
      }

      // 向服务器验证token
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // 更新认证状态
        this.authState = {
          isAuthenticated: true,
          user: data.user,
          token: token,
          lastVerified: Date.now()
        };

        this.saveAuthState();
        this.notifyListeners();

        safeLog.info('认证验证成功');
        return true;
      } else {
        safeLog.warn('服务器认证验证失败');
        this.clearAllAuthData();
        return false;
      }
    } catch (error) {
      safeLog.error('认证验证过程中发生错误:', error);
      this.clearAllAuthData();
      return false;
    }
  }

  /**
   * 设置认证状态
   */
  public setAuthState(user: any, token: string): void {
    this.authState = {
      isAuthenticated: true,
      user: user,
      token: token,
      lastVerified: Date.now()
    };

    // 保存到localStorage
    localStorage.setItem(this.ADMIN_TOKEN_KEY, token);
    this.saveAuthState();
    this.notifyListeners();

    safeLog.info('认证状态已设置');
  }

  /**
   * 登出
   */
  public logout(): void {
    safeLog.info('用户登出');
    this.clearAllAuthData();
  }

  /**
   * 获取当前认证状态
   */
  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  /**
   * 添加状态监听器
   */
  public addListener(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);

    // 返回取消监听的函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 保存认证状态到localStorage
   */
  private saveAuthState(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.AUTH_STATE_KEY, JSON.stringify(this.authState));
    } catch (error) {
      safeLog.error('保存认证状态失败:', error);
    }
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.authState);
      } catch (error) {
        safeLog.error('通知认证状态监听器失败:', error);
      }
    });
  }

  /**
   * 强制刷新认证状态
   */
  public async forceRefresh(): Promise<boolean> {
    this.authState.lastVerified = 0; // 清除缓存
    return this.verifyAuthState();
  }

  /**
   * 检查是否需要清理数据（用于调试）
   */
  public diagnoseAuthState(): {
    hasValidToken: boolean;
    tokenAge: number;
    stateAge: number;
    version: string;
    recommendations: string[];
  } {
    if (typeof window === 'undefined') {
      return {
        hasValidToken: false,
        tokenAge: 0,
        stateAge: 0,
        version: 'unknown',
        recommendations: ['服务器端无法访问localStorage']
      };
    }

    const token = localStorage.getItem(this.ADMIN_TOKEN_KEY);
    const savedVersion = localStorage.getItem(this.AUTH_VERSION_KEY);
    const now = Date.now();

    const diagnosis = {
      hasValidToken: token ? this.isTokenValid(token) : false,
      tokenAge: 0,
      stateAge: now - this.authState.lastVerified,
      version: savedVersion || 'unknown',
      recommendations: [] as string[]
    };

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        diagnosis.tokenAge = now - (payload.iat * 1000);
      } catch (error) {
        diagnosis.recommendations.push('Token格式无效，建议清理');
      }
    }

    if (savedVersion !== this.CURRENT_AUTH_VERSION) {
      diagnosis.recommendations.push('认证系统版本不匹配，建议清理');
    }

    if (diagnosis.stateAge > 60 * 60 * 1000) {
      diagnosis.recommendations.push('认证状态过期，建议刷新');
    }

    return diagnosis;
  }
}
