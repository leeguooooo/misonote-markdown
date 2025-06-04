/**
 * 认证数据清理工具
 * 用于清理旧版本的认证数据，解决兼容性问题
 */

import { log } from '@/core/logger';

export class AuthDataCleaner {
  private static readonly CURRENT_VERSION = '3.0.0';
  private static readonly VERSION_KEY = 'authVersion';

  /**
   * 检查并清理不兼容的认证数据
   */
  public static checkAndCleanup(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const currentVersion = localStorage.getItem(this.VERSION_KEY);

      // 如果版本不匹配，清理所有数据
      if (currentVersion !== this.CURRENT_VERSION) {
        log.warn(`检测到认证数据版本不匹配: ${currentVersion} -> ${this.CURRENT_VERSION}，开始清理`);
        this.performCleanup();
        localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
        return true;
      }

      // 检查是否有损坏的token
      const token = localStorage.getItem('admin-token');
      if (token && !this.isValidTokenFormat(token)) {
        log.warn('检测到损坏的token，清理认证数据');
        this.performCleanup();
        return true;
      }

      return false;
    } catch (error) {
      log.error('检查认证数据时发生错误:', error);
      this.performCleanup();
      return true;
    }
  }

  /**
   * 强制清理所有认证数据
   */
  public static forceCleanup(): void {
    if (typeof window === 'undefined') {
      return;
    }

    log.info('强制清理所有认证数据');
    this.performCleanup();
    localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
  }

  /**
   * 执行轻量级维护（不删除有效token）
   */
  public static performMaintenance(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // 只清理明确过期或损坏的数据
      const token = localStorage.getItem('admin-token');

      // 清理过期token
      if (token && this.isValidTokenFormat(token)) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            log.info('清理过期token');
            localStorage.removeItem('admin-token');
          }
        } catch (error) {
          // Token无法解析，清理
          log.warn('清理无法解析的token');
          localStorage.removeItem('admin-token');
        }
      }

      // 清理明确的旧版本keys（但保留当前版本的数据）
      const obsoleteKeys = [
        'auth-token',
        'jwt-token',
        'session-token',
        'login-token'
      ];

      obsoleteKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          log.info(`清理过时的key: ${key}`);
        }
      });

      // 确保版本标记正确
      localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);

    } catch (error) {
      log.error('维护过程中发生错误:', error);
    }
  }

  /**
   * 执行实际的清理操作
   */
  private static performCleanup(): void {
    const keysToRemove = [
      // 当前版本的keys
      'admin-token',
      'currentUser',
      'authState',
      'authVersion',

      // 可能的旧版本keys
      'token',
      'user',
      'adminToken',
      'userToken',
      'auth-token',
      'jwt-token',
      'session-token',
      'login-token',

      // 其他可能的认证相关keys
      'isAuthenticated',
      'userInfo',
      'loginState',
      'authData'
    ];

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        log.warn(`清理localStorage key "${key}" 失败:`, error);
      }
    });

    // 清理sessionStorage
    try {
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('auth') || key.includes('token') || key.includes('user')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {
      log.warn('清理sessionStorage失败:', error);
    }

    log.info('认证数据清理完成');
  }

  /**
   * 检查token格式是否有效
   */
  private static isValidTokenFormat(token: string): boolean {
    try {
      if (!token || typeof token !== 'string') {
        return false;
      }

      // JWT应该有3个部分
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      // 尝试解析header和payload
      JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));

      // 检查基本字段
      if (!payload.exp || !payload.iat) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取清理报告
   */
  public static getCleanupReport(): {
    needsCleanup: boolean;
    currentVersion: string;
    savedVersion: string;
    issues: string[];
    recommendations: string[];
  } {
    if (typeof window === 'undefined') {
      return {
        needsCleanup: false,
        currentVersion: this.CURRENT_VERSION,
        savedVersion: 'unknown',
        issues: ['服务器端无法访问localStorage'],
        recommendations: []
      };
    }

    const savedVersion = localStorage.getItem(this.VERSION_KEY) || 'unknown';
    const token = localStorage.getItem('admin-token');
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 检查版本
    if (savedVersion !== this.CURRENT_VERSION) {
      issues.push(`版本不匹配: ${savedVersion} vs ${this.CURRENT_VERSION}`);
      recommendations.push('建议清理旧版本数据');
    }

    // 检查token
    if (token) {
      if (!this.isValidTokenFormat(token)) {
        issues.push('Token格式无效');
        recommendations.push('建议清理损坏的token');
      } else {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            issues.push('Token已过期');
            recommendations.push('建议清理过期token');
          }
        } catch (error) {
          issues.push('Token解析失败');
          recommendations.push('建议清理无法解析的token');
        }
      }
    }

    // 检查localStorage大小
    try {
      const storageSize = JSON.stringify(localStorage).length;
      if (storageSize > 1024 * 1024) { // 1MB
        issues.push('localStorage数据过大');
        recommendations.push('建议清理冗余数据');
      }
    } catch (error) {
      issues.push('无法检查localStorage大小');
    }

    return {
      needsCleanup: issues.length > 0,
      currentVersion: this.CURRENT_VERSION,
      savedVersion,
      issues,
      recommendations
    };
  }

  /**
   * 自动修复常见问题
   */
  public static autoFix(): {
    fixed: boolean;
    actions: string[];
  } {
    if (typeof window === 'undefined') {
      return { fixed: false, actions: ['服务器端无法执行修复'] };
    }

    const actions: string[] = [];
    let fixed = false;

    try {
      // 修复版本问题
      const savedVersion = localStorage.getItem(this.VERSION_KEY);
      if (savedVersion !== this.CURRENT_VERSION) {
        localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
        actions.push('更新认证系统版本');
        fixed = true;
      }

      // 修复损坏的token
      const token = localStorage.getItem('admin-token');
      if (token && !this.isValidTokenFormat(token)) {
        localStorage.removeItem('admin-token');
        actions.push('移除损坏的token');
        fixed = true;
      }

      // 清理过期token
      if (token && this.isValidTokenFormat(token)) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.exp * 1000 < Date.now()) {
            localStorage.removeItem('admin-token');
            actions.push('移除过期token');
            fixed = true;
          }
        } catch (error) {
          localStorage.removeItem('admin-token');
          actions.push('移除无法解析的token');
          fixed = true;
        }
      }

      if (fixed) {
        actions.push('认证数据修复完成');
      } else {
        actions.push('未发现需要修复的问题');
      }

    } catch (error) {
      actions.push(`修复过程中发生错误: ${error}`);
    }

    return { fixed, actions };
  }
}
