/**
 * 服务器初始化
 * 在服务器启动时执行的初始化逻辑
 */

import { dockerLicenseInitializer } from './docker-license-init';
import { log } from '@/core/logger';

let initialized = false;

/**
 * 初始化服务器
 */
export async function initializeServer(): Promise<void> {
  if (initialized) {
    return;
  }

  try {
    log.info('🚀 开始服务器初始化...');

    // 初始化Docker许可证
    await dockerLicenseInitializer.initializeDockerLicense();

    // 其他初始化逻辑可以在这里添加
    // 例如：数据库连接、缓存初始化等

    initialized = true;
    log.info('✅ 服务器初始化完成');

  } catch (error) {
    log.error('❌ 服务器初始化失败:', error);
    // 不抛出错误，允许服务器继续启动
  }
}

/**
 * 检查是否已初始化
 */
export function isInitialized(): boolean {
  return initialized;
}
