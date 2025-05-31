/**
 * 硬件指纹生成和验证
 * 用于许可证与设备绑定
 */

import crypto from 'crypto';
import os from 'os';
import { log } from '@/core/logger';

export interface HardwareFingerprintData {
  cpuInfo: string;
  totalMemory: number;
  platform: string;
  arch: string;
  hostname: string;
  networkInterfaces: string[];
  osVersion: string;
}

export interface FingerprintResult {
  fingerprint: string;
  components: HardwareFingerprintData;
  confidence: number; // 0-1, 指纹可靠性
}

export class HardwareFingerprint {
  private static instance: HardwareFingerprint;

  static getInstance(): HardwareFingerprint {
    if (!HardwareFingerprint.instance) {
      HardwareFingerprint.instance = new HardwareFingerprint();
    }
    return HardwareFingerprint.instance;
  }

  /**
   * 生成硬件指纹
   */
  async generateFingerprint(): Promise<FingerprintResult> {
    try {
      const components = await this.collectHardwareInfo();
      const fingerprint = this.computeFingerprint(components);
      const confidence = this.calculateConfidence(components);

      return {
        fingerprint,
        components,
        confidence
      };
    } catch (error) {
      log.error('生成硬件指纹失败:', error);
      throw new Error('无法生成硬件指纹');
    }
  }

  /**
   * 验证硬件指纹
   */
  async verifyFingerprint(expectedFingerprint: string, tolerance: number = 0.8): Promise<{
    valid: boolean;
    similarity: number;
    currentFingerprint: string;
  }> {
    try {
      const current = await this.generateFingerprint();
      const similarity = this.calculateSimilarity(expectedFingerprint, current.fingerprint);
      
      return {
        valid: similarity >= tolerance,
        similarity,
        currentFingerprint: current.fingerprint
      };
    } catch (error) {
      log.error('验证硬件指纹失败:', error);
      return {
        valid: false,
        similarity: 0,
        currentFingerprint: ''
      };
    }
  }

  /**
   * 收集硬件信息
   */
  private async collectHardwareInfo(): Promise<HardwareFingerprintData> {
    const cpus = os.cpus();
    const networkInterfaces = os.networkInterfaces();
    
    // CPU信息（型号和核心数）
    const cpuInfo = cpus.length > 0 ? 
      `${cpus[0].model}_${cpus.length}cores` : 
      'unknown_cpu';

    // 网络接口MAC地址
    const macAddresses: string[] = [];
    for (const [name, interfaces] of Object.entries(networkInterfaces)) {
      if (interfaces) {
        for (const iface of interfaces) {
          if (iface.mac && iface.mac !== '00:00:00:00:00:00' && !iface.internal) {
            macAddresses.push(iface.mac);
          }
        }
      }
    }

    return {
      cpuInfo: this.hashString(cpuInfo),
      totalMemory: Math.floor(os.totalmem() / (1024 * 1024 * 1024)), // GB
      platform: os.platform(),
      arch: os.arch(),
      hostname: this.hashString(os.hostname()),
      networkInterfaces: macAddresses.sort(),
      osVersion: this.hashString(os.release())
    };
  }

  /**
   * 计算指纹哈希
   */
  private computeFingerprint(components: HardwareFingerprintData): string {
    // 创建稳定的指纹字符串
    const fingerprintData = [
      components.cpuInfo,
      components.totalMemory.toString(),
      components.platform,
      components.arch,
      components.hostname,
      components.networkInterfaces.join(','),
      components.osVersion
    ].join('|');

    return crypto
      .createHash('sha256')
      .update(fingerprintData)
      .digest('hex')
      .substring(0, 32); // 取前32位
  }

  /**
   * 计算指纹可靠性
   */
  private calculateConfidence(components: HardwareFingerprintData): number {
    let confidence = 0;
    let factors = 0;

    // CPU信息可靠性
    if (components.cpuInfo && components.cpuInfo !== 'unknown_cpu') {
      confidence += 0.3;
    }
    factors++;

    // 内存信息可靠性
    if (components.totalMemory > 0) {
      confidence += 0.2;
    }
    factors++;

    // 网络接口可靠性
    if (components.networkInterfaces.length > 0) {
      confidence += 0.3;
    }
    factors++;

    // 系统信息可靠性
    if (components.platform && components.arch) {
      confidence += 0.2;
    }
    factors++;

    return Math.min(confidence, 1.0);
  }

  /**
   * 计算两个指纹的相似度
   */
  private calculateSimilarity(fingerprint1: string, fingerprint2: string): number {
    if (fingerprint1 === fingerprint2) {
      return 1.0;
    }

    // 计算汉明距离
    let matches = 0;
    const length = Math.min(fingerprint1.length, fingerprint2.length);
    
    for (let i = 0; i < length; i++) {
      if (fingerprint1[i] === fingerprint2[i]) {
        matches++;
      }
    }

    return matches / Math.max(fingerprint1.length, fingerprint2.length);
  }

  /**
   * 哈希字符串（用于敏感信息）
   */
  private hashString(input: string): string {
    return crypto
      .createHash('md5')
      .update(input)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * 生成许可证绑定数据
   */
  async generateLicenseBinding(): Promise<{
    fingerprint: string;
    bindingData: string;
    expiresAt: Date;
  }> {
    const result = await this.generateFingerprint();
    
    // 创建绑定数据
    const bindingInfo = {
      fingerprint: result.fingerprint,
      confidence: result.confidence,
      timestamp: Date.now(),
      platform: result.components.platform,
      arch: result.components.arch
    };

    const bindingData = Buffer.from(JSON.stringify(bindingInfo)).toString('base64');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30天后过期

    return {
      fingerprint: result.fingerprint,
      bindingData,
      expiresAt
    };
  }

  /**
   * 验证许可证绑定
   */
  async verifyLicenseBinding(bindingData: string, tolerance: number = 0.8): Promise<{
    valid: boolean;
    reason?: string;
    similarity?: number;
  }> {
    try {
      // 解析绑定数据
      const bindingInfo = JSON.parse(Buffer.from(bindingData, 'base64').toString());
      
      // 检查数据完整性
      if (!bindingInfo.fingerprint || !bindingInfo.timestamp) {
        return { valid: false, reason: '绑定数据格式无效' };
      }

      // 检查绑定是否过期（如果有过期时间）
      if (bindingInfo.expiresAt && new Date(bindingInfo.expiresAt) < new Date()) {
        return { valid: false, reason: '设备绑定已过期' };
      }

      // 验证当前硬件指纹
      const verification = await this.verifyFingerprint(bindingInfo.fingerprint, tolerance);
      
      if (!verification.valid) {
        return { 
          valid: false, 
          reason: '设备指纹不匹配',
          similarity: verification.similarity
        };
      }

      return { valid: true, similarity: verification.similarity };

    } catch (error) {
      log.error('验证许可证绑定失败:', error);
      return { valid: false, reason: '绑定验证过程中发生错误' };
    }
  }

  /**
   * 获取设备信息摘要（用于显示）
   */
  async getDeviceSummary(): Promise<{
    platform: string;
    arch: string;
    cpuCores: number;
    totalMemoryGB: number;
    hostname: string;
  }> {
    const cpus = os.cpus();
    
    return {
      platform: os.platform(),
      arch: os.arch(),
      cpuCores: cpus.length,
      totalMemoryGB: Math.floor(os.totalmem() / (1024 * 1024 * 1024)),
      hostname: os.hostname()
    };
  }
}
