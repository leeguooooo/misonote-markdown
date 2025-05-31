/**
 * Docker环境许可证初始化
 * 在Docker容器启动时自动验证许可证
 */

import { LicenseManager } from '@/business/license/manager';
import { log } from '@/core/logger';
import fs from 'fs';
import path from 'path';

export class DockerLicenseInitializer {
  private static instance: DockerLicenseInitializer;
  private licenseManager = LicenseManager.getInstance();

  private constructor() {}

  public static getInstance(): DockerLicenseInitializer {
    if (!DockerLicenseInitializer.instance) {
      DockerLicenseInitializer.instance = new DockerLicenseInitializer();
    }
    return DockerLicenseInitializer.instance;
  }

  /**
   * 初始化Docker环境的许可证
   */
  public async initializeDockerLicense(): Promise<void> {
    try {
      log.info('🔐 开始初始化Docker环境许可证...');

      // 检查是否在Docker环境中
      if (!this.isDockerEnvironment()) {
        log.debug('非Docker环境，跳过Docker许可证初始化');
        return;
      }

      // 尝试从环境变量获取许可证
      const envLicenseKey = process.env.MISONOTE_LICENSE_KEY;
      if (envLicenseKey) {
        log.info('📋 从环境变量中检测到许可证密钥');
        await this.validateAndSetLicense(envLicenseKey, '环境变量');
        return;
      }

      // 尝试从临时文件获取许可证
      const tempLicenseFile = '/tmp/license.key';
      if (fs.existsSync(tempLicenseFile)) {
        try {
          const licenseKey = fs.readFileSync(tempLicenseFile, 'utf-8').trim();
          if (licenseKey) {
            log.info('📄 从临时文件中检测到许可证密钥');
            await this.validateAndSetLicense(licenseKey, '临时文件');
            // 验证成功后删除临时文件
            fs.unlinkSync(tempLicenseFile);
            return;
          }
        } catch (error) {
          log.warn('读取临时许可证文件失败:', error);
        }
      }

      // 检查是否有持久化的许可证
      const persistedLicense = await this.loadPersistedLicense();
      if (persistedLicense) {
        log.info('💾 从持久化存储中加载许可证');
        await this.validateAndSetLicense(persistedLicense, '持久化存储');
        return;
      }

      // 没有找到许可证，使用社区版
      log.info('ℹ️  未找到许可证密钥，使用社区版模式');
      this.logCommunityModeInfo();

    } catch (error) {
      log.error('Docker许可证初始化失败:', error);
      log.info('🔄 回退到社区版模式');
      this.logCommunityModeInfo();
    }
  }

  /**
   * 验证并设置许可证
   */
  private async validateAndSetLicense(licenseKey: string, source: string): Promise<void> {
    try {
      log.info(`🔍 验证许可证 (来源: ${source})...`);

      const result = await this.licenseManager.validateLicense(licenseKey);
      
      if (result.valid && result.license) {
        log.info('✅ 许可证验证成功!');
        log.info(`📊 许可证信息:`);
        log.info(`   - 类型: ${result.license.type}`);
        log.info(`   - 组织: ${result.license.organization}`);
        log.info(`   - 最大用户数: ${result.license.maxUsers === -1 ? '无限制' : result.license.maxUsers}`);
        log.info(`   - 到期时间: ${result.license.expiresAt ? new Date(result.license.expiresAt).toLocaleDateString('zh-CN') : '永久'}`);
        log.info(`   - 功能: ${result.license.features.join(', ')}`);

        // 持久化许可证
        await this.persistLicense(licenseKey);
        
        log.info('🎉 Docker环境许可证配置完成!');
      } else {
        log.error('❌ 许可证验证失败:', result.error);
        log.info('🔄 回退到社区版模式');
        this.logCommunityModeInfo();
      }
    } catch (error) {
      log.error('许可证验证过程中发生错误:', error);
      log.info('🔄 回退到社区版模式');
      this.logCommunityModeInfo();
    }
  }

  /**
   * 检查是否在Docker环境中
   */
  private isDockerEnvironment(): boolean {
    // 检查Docker环境的多种方式
    return (
      // 检查/.dockerenv文件
      fs.existsSync('/.dockerenv') ||
      // 检查环境变量
      process.env.DOCKER_BUILD === 'true' ||
      // 检查cgroup
      (fs.existsSync('/proc/1/cgroup') && 
       fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker'))
    );
  }

  /**
   * 加载持久化的许可证
   */
  private async loadPersistedLicense(): Promise<string | null> {
    try {
      const licenseFile = path.join(process.cwd(), 'data', 'license.key');
      if (fs.existsSync(licenseFile)) {
        return fs.readFileSync(licenseFile, 'utf-8').trim();
      }
    } catch (error) {
      log.debug('加载持久化许可证失败:', error);
    }
    return null;
  }

  /**
   * 持久化许可证
   */
  private async persistLicense(licenseKey: string): Promise<void> {
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      const licenseFile = path.join(dataDir, 'license.key');
      fs.writeFileSync(licenseFile, licenseKey, 'utf-8');
      log.debug('许可证已持久化到:', licenseFile);
    } catch (error) {
      log.warn('持久化许可证失败:', error);
    }
  }

  /**
   * 记录社区版模式信息
   */
  private logCommunityModeInfo(): void {
    log.info('');
    log.info('🏠 当前运行在社区版模式');
    log.info('📋 社区版功能:');
    log.info('   - 单用户使用');
    log.info('   - 基础文档管理');
    log.info('   - 本地存储');
    log.info('');
    log.info('🚀 升级到专业版或企业版:');
    log.info('   1. 联系 sales@misonote.com 购买许可证');
    log.info('   2. 重新启动容器并设置 MISONOTE_LICENSE_KEY 环境变量:');
    log.info('      docker run -e MISONOTE_LICENSE_KEY=your_license_key ...');
    log.info('   3. 或在Web界面的许可证管理页面中输入许可证密钥');
    log.info('');
  }

  /**
   * 获取Docker启动命令示例
   */
  public getDockerStartupExamples(): string[] {
    return [
      '# 社区版启动 (免费)',
      'docker run -d -p 3001:3001 misonote/markdown',
      '',
      '# 专业版启动',
      'docker run -d -p 3001:3001 \\',
      '  -e ADMIN_PASSWORD=your_admin_password \\',
      '  -e MISONOTE_LICENSE_KEY=misonote_your_license_key \\',
      '  -v misonote-data:/app/data \\',
      '  misonote/markdown',
      '',
      '# 企业版启动 (自定义许可证服务器)',
      'docker run -d -p 3001:3001 \\',
      '  -e ADMIN_PASSWORD=your_admin_password \\',
      '  -e MISONOTE_LICENSE_KEY=misonote_your_license_key \\',
      '  -e MISONOTE_LICENSE_SERVER_URL=https://your-license-server.com \\',
      '  -v misonote-data:/app/data \\',
      '  misonote/markdown'
    ];
  }

  /**
   * 获取许可证状态信息
   */
  public async getLicenseStatusForDocker(): Promise<{
    isDocker: boolean;
    hasLicense: boolean;
    licenseType: string;
    organization?: string;
    maxUsers: number;
    expiresAt?: string;
    features: string[];
  }> {
    const isDocker = this.isDockerEnvironment();
    const currentLicense = this.licenseManager.getCurrentLicense();

    return {
      isDocker,
      hasLicense: !!currentLicense,
      licenseType: currentLicense?.type || 'community',
      organization: currentLicense?.organization,
      maxUsers: currentLicense?.maxUsers || 1,
      expiresAt: currentLicense?.expiresAt?.toISOString(),
      features: currentLicense?.features || []
    };
  }
}

// 导出单例实例
export const dockerLicenseInitializer = DockerLicenseInitializer.getInstance();
