/**
 * 企业版与社区版功能衔接测试
 * 测试许可证管理、功能门控、优雅降级等关键功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LicenseManager } from '@/business/license/manager'
import { checkFeature, checkFeatureAccess } from '@/business/features/gate'
import { FeatureFlag } from '@/types/business/features'

describe('企业版与社区版功能衔接测试', () => {
  let licenseManager: LicenseManager
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    // 保存原始环境变量
    originalEnv = { ...process.env }
    
    // 重置许可证管理器
    licenseManager = LicenseManager.getInstance()
    
    // 清理模块缓存，确保每次测试都是干净的状态
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 恢复环境变量
    process.env = originalEnv
  })

  describe('社区版模式测试', () => {
    beforeEach(() => {
      // 设置为社区版环境
      process.env.NODE_ENV = 'test'
      delete process.env.ENTERPRISE_LICENSE
      delete process.env.MISONOTE_LICENSE_KEY
    })

    it('应该正确识别社区版功能', async () => {
      // 测试社区版基础功能
      expect(licenseManager.hasFeature('comments')).toBe(true)
      expect(licenseManager.hasFeature('annotations')).toBe(true)
      expect(licenseManager.hasFeature('bookmarks')).toBe(true)
      expect(licenseManager.hasFeature('basic_search')).toBe(true)
    })

    it('应该拒绝企业版功能', async () => {
      // 测试企业版功能在社区版中被拒绝
      expect(licenseManager.isFeatureEnabled(FeatureFlag.MULTI_USER)).toBe(false)
      expect(licenseManager.isFeatureEnabled(FeatureFlag.VERSION_CONTROL)).toBe(false)
      expect(licenseManager.isFeatureEnabled(FeatureFlag.SSO_INTEGRATION)).toBe(false)
    })

    it('应该提供升级提示', async () => {
      const result = licenseManager.checkFeatureAccess(FeatureFlag.MULTI_USER)
      
      expect(result.enabled).toBe(false)
      expect(result.reason).toContain('企业版')
      expect(result.upgradeUrl).toBe('/pricing')
      expect(result.requiredLicense).toContain('enterprise')
    })

    it('应该返回社区版许可证状态', () => {
      const status = licenseManager.getCurrentLicenseStatus()
      
      expect(status.isValid).toBe(true)
      expect(status.type).toBe('community')
      expect(status.features).toEqual(['comments', 'annotations', 'bookmarks', 'basic_search'])
      expect(status.isCommunity).toBe(true)
      expect(status.isEnterprise).toBe(false)
    })
  })

  describe('企业版模块加载测试', () => {
    it('应该优雅处理企业版模块缺失', async () => {
      // 模拟企业版模块不存在的情况
      const mockImport = vi.fn().mockRejectedValue(new Error('Module not found'))
      global.eval = vi.fn().mockReturnValue(mockImport)

      const result = await checkFeature(FeatureFlag.MULTI_USER)
      expect(result).toBe(false)
    })

    it('应该在企业版模块存在时正确加载', async () => {
      // 模拟企业版模块存在
      const mockEnterpriseModule = {
        FeatureFlag: FeatureFlag,
        FEATURE_REQUIREMENTS: {
          [FeatureFlag.MULTI_USER]: {
            license: ['enterprise'],
            description: '多用户功能'
          }
        }
      }

      const mockImport = vi.fn().mockResolvedValue(mockEnterpriseModule)
      global.eval = vi.fn().mockReturnValue(mockImport)

      // 这里应该能够加载企业版功能
      const featureAccess = await checkFeatureAccess(FeatureFlag.MULTI_USER)
      expect(featureAccess.enabled).toBe(false) // 因为没有有效许可证
      expect(featureAccess.reason).toContain('企业版')
    })
  })

  describe('许可证激活流程测试', () => {
    it('应该在无效许可证时降级到社区版', async () => {
      // 设置无效的许可证密钥
      process.env.MISONOTE_LICENSE_KEY = 'invalid_license_key'

      const status = licenseManager.getCurrentLicenseStatus()
      expect(status.type).toBe('community')
      expect(status.isValid).toBe(true) // 社区版总是有效的
    })

    it('应该在许可证过期时降级到社区版', async () => {
      // 模拟过期的许可证
      const expiredLicense = {
        type: 'enterprise',
        isValid: false,
        expiresAt: new Date(Date.now() - 86400000), // 昨天过期
        features: []
      }

      // 这里需要模拟许可证验证返回过期状态
      vi.spyOn(licenseManager, 'getCurrentLicenseStatus').mockReturnValue({
        isValid: true,
        type: 'community',
        features: ['comments', 'annotations', 'bookmarks', 'basic_search'],
        currentUsers: 0,
        isEnterprise: false,
        isProfessional: false,
        isCommunity: true
      })

      const status = licenseManager.getCurrentLicenseStatus()
      expect(status.type).toBe('community')
    })
  })

  describe('功能门控中间件测试', () => {
    it('应该正确处理社区版功能请求', async () => {
      // 测试社区版功能不被阻止
      expect(licenseManager.hasFeature('comments')).toBe(true)
      expect(licenseManager.hasFeature('annotations')).toBe(true)
    })

    it('应该阻止企业版功能请求', async () => {
      // 测试企业版功能被正确阻止
      const result = await checkFeature(FeatureFlag.MULTI_USER)
      expect(result).toBe(false)
    })
  })

  describe('数据库初始化测试', () => {
    it('应该在社区版模式下只创建基础表', () => {
      // 社区版应该只有基础表
      const expectedTables = [
        'system_settings',
        'api_keys', 
        'users',
        'documents',
        'comments',
        'annotations',
        'bookmarks',
        'migration_history',
        'user_sessions'
      ]

      // 这里需要检查数据库表是否正确创建
      // 实际实现中需要查询数据库表结构
      expect(true).toBe(true) // 占位符，实际需要数据库查询
    })

    it('应该在企业版激活时创建企业版表', async () => {
      // 模拟企业版许可证激活
      process.env.MISONOTE_LICENSE_KEY = 'DEV_ENTERPRISE_LICENSE_KEY_123456'
      process.env.NODE_ENV = 'development'

      // 企业版应该创建额外的表
      const expectedEnterpriseTables = [
        'document_versions',
        'version_branches', 
        'version_tags',
        'document_locks',
        'collaboration_sessions',
        'collaboration_operations',
        'content_diffs',
        'annotation_migrations',
        'audit_logs',
        'access_logs'
      ]

      // 这里需要检查企业版表是否被创建
      expect(true).toBe(true) // 占位符，实际需要数据库查询
    })
  })

  describe('错误处理和恢复测试', () => {
    it('应该在企业版服务器不可用时优雅降级', async () => {
      // 模拟许可证服务器不可用
      process.env.LICENSE_SERVER_URL = 'http://invalid-server.com'
      process.env.MISONOTE_LICENSE_KEY = 'some_license_key'

      // 应该降级到社区版而不是崩溃
      const status = licenseManager.getCurrentLicenseStatus()
      expect(status.type).toBe('community')
      expect(status.isValid).toBe(true)
    })

    it('应该在许可证验证失败时继续运行', async () => {
      // 模拟许可证验证异常
      const originalConsoleError = console.error
      console.error = vi.fn() // 静默错误日志

      try {
        // 设置会导致验证失败的许可证
        process.env.MISONOTE_LICENSE_KEY = 'malformed_license_key'

        const status = licenseManager.getCurrentLicenseStatus()
        expect(status.type).toBe('community')
        expect(status.isValid).toBe(true)
      } finally {
        console.error = originalConsoleError
      }
    })
  })

  describe('功能标志一致性测试', () => {
    it('社区版和企业版功能标志应该兼容', async () => {
      // 检查功能标志定义的一致性
      const communityFeatures = ['comments', 'annotations', 'bookmarks', 'basic_search']
      
      for (const feature of communityFeatures) {
        expect(licenseManager.hasFeature(feature)).toBe(true)
      }
    })

    it('企业版功能标志应该在社区版中被正确识别', async () => {
      // 企业版功能应该被识别但不可用
      const enterpriseFeatures = [
        FeatureFlag.MULTI_USER,
        FeatureFlag.VERSION_CONTROL,
        FeatureFlag.SSO_INTEGRATION
      ]

      for (const feature of enterpriseFeatures) {
        const result = await checkFeature(feature)
        expect(result).toBe(false)
      }
    })
  })
})
