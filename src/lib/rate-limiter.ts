/**
 * 简单的内存速率限制器
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * 检查是否超过速率限制
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // 获取或创建请求记录
    let requests = this.requests.get(identifier) || [];
    
    // 清理过期的请求记录
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // 检查是否超过限制
    if (requests.length >= this.maxRequests) {
      return true;
    }

    // 记录当前请求
    requests.push(now);
    this.requests.set(identifier, requests);

    return false;
  }

  /**
   * 清理过期的记录
   */
  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

// 创建不同类型的速率限制器
export const authLimiter = new RateLimiter(15 * 60 * 1000, 5); // 15分钟内最多5次认证尝试
export const apiLimiter = new RateLimiter(60 * 1000, 60); // 1分钟内最多60次API请求
export const uploadLimiter = new RateLimiter(60 * 1000, 10); // 1分钟内最多10次文件操作

// 定期清理过期记录
setInterval(() => {
  authLimiter.cleanup();
  apiLimiter.cleanup();
  uploadLimiter.cleanup();
}, 5 * 60 * 1000); // 每5分钟清理一次
