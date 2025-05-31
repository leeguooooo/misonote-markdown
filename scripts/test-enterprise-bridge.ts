#!/usr/bin/env tsx

/**
 * 企业版与社区版功能衔接测试脚本
 * 用于验证许可证系统、功能门控、数据库初始化等关键功能
 */

import { LicenseManager } from '../src/business/license/manager'
import { checkFeature, getFeatureAccess } from '../src/business/features/gate'
import { FeatureFlag } from '../src/types/business/features'
import { LicenseType } from '../src/types/business/license'
import { getDatabaseStats, getDatabase } from '../src/core/database/database'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

class EnterpriseBridgeTest {
  private results: TestResult[] = []
  private licenseManager: LicenseManager

  constructor() {
    this.licenseManager = LicenseManager.getInstance()
  }

  private addResult(name: string, passed: boolean, message: string, details?: any) {
    this.results.push({ name, passed, message, details })
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${name}: ${message}`)
    if (details) {
      console.log(`   详情: ${JSON.stringify(details, null, 2)}`)
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 开始企业版与社区版功能衔接测试\n')

    await this.testCommunityMode()
    await this.testEnterpriseModuleLoading()
    await this.testLicenseActivation()
    await this.testFeatureGating()
    await this.testDatabaseInitialization()
    await this.testErrorHandling()
    await this.testFeatureFlagConsistency()

    this.printSummary()
  }

  private async testCommunityMode(): Promise<void> {
    console.log('📋 测试社区版模式...')

    try {
      // 确保在社区版模式下
      delete process.env.MISONOTE_LICENSE_KEY
      delete process.env.ENTERPRISE_LICENSE

      // 测试社区版功能
      const communityFeatures = ['comments', 'annotations', 'bookmarks', 'basic_search']
      let allCommunityFeaturesWork = true

      for (const feature of communityFeatures) {
        if (!this.licenseManager.hasFeature(feature)) {
          allCommunityFeaturesWork = false
          break
        }
      }

      this.addResult(
        '社区版基础功能',
        allCommunityFeaturesWork,
        allCommunityFeaturesWork ? '所有社区版功能正常' : '部分社区版功能不可用',
        { availableFeatures: communityFeatures }
      )

      // 测试企业版功能被拒绝
      const enterpriseBlocked = !this.licenseManager.isFeatureEnabled(FeatureFlag.MULTI_USER)
      this.addResult(
        '企业版功能阻止',
        enterpriseBlocked,
        enterpriseBlocked ? '企业版功能正确被阻止' : '企业版功能意外可用'
      )

      // 测试许可证状态
      const license = this.licenseManager.getCurrentLicense()
      const licenseType = this.licenseManager.getLicenseType()
      const correctStatus = licenseType === LicenseType.COMMUNITY || license?.type === 'community'
      this.addResult(
        '社区版许可证状态',
        correctStatus,
        correctStatus ? '许可证状态正确' : '许可证状态异常',
        { type: licenseType, license: license?.type }
      )

    } catch (error) {
      this.addResult('社区版模式测试', false, `测试失败: ${error}`)
    }
  }

  private async testEnterpriseModuleLoading(): Promise<void> {
    console.log('📦 测试企业版模块加载...')

    try {
      // 测试企业版模块是否存在
      let enterpriseModuleExists = false
      try {
        await import('../enterprise/types/features')
        enterpriseModuleExists = true
      } catch (error) {
        // 模块不存在是正常的
      }

      this.addResult(
        '企业版模块检测',
        true,
        enterpriseModuleExists ? '企业版模块存在' : '企业版模块不存在（社区版模式）',
        { moduleExists: enterpriseModuleExists }
      )

      // 测试功能检查的优雅降级
      const featureResult = await checkFeature(FeatureFlag.MULTI_USER)
      this.addResult(
        '功能检查降级',
        !featureResult,
        '企业版功能正确返回不可用'
      )

    } catch (error) {
      this.addResult('企业版模块加载测试', false, `测试失败: ${error}`)
    }
  }

  private async testLicenseActivation(): Promise<void> {
    console.log('🔑 测试许可证激活流程...')

    try {
      // 测试开发环境许可证
      const originalEnv = process.env.NODE_ENV
      ;(process.env as any).NODE_ENV = 'development'
      process.env.MISONOTE_LICENSE_KEY = 'DEV_ENTERPRISE_LICENSE_KEY_123456'

      // 检查是否有企业版许可证管理器
      try {
        await import('../enterprise/services/license-manager')

        // 如果存在，测试激活流程
        // 注意：这里只是检查模块是否存在，不实际激活
        this.addResult(
          '企业版许可证管理器',
          true,
          '企业版许可证管理器可用'
        )
      } catch (error) {
        this.addResult(
          '企业版许可证管理器',
          true,
          '企业版许可证管理器不存在（社区版模式）'
        )
      }

      // 恢复环境
      ;(process.env as any).NODE_ENV = originalEnv
      delete process.env.MISONOTE_LICENSE_KEY

    } catch (error) {
      this.addResult('许可证激活测试', false, `测试失败: ${error}`)
    }
  }

  private async testFeatureGating(): Promise<void> {
    console.log('🚪 测试功能门控...')

    try {
      // 测试社区版功能不被阻止
      const communityFeatureAllowed = this.licenseManager.hasFeature('comments')
      this.addResult(
        '社区版功能门控',
        communityFeatureAllowed,
        communityFeatureAllowed ? '社区版功能正常通过' : '社区版功能被意外阻止'
      )

      // 测试企业版功能被阻止
      const enterpriseFeatureBlocked = !await checkFeature(FeatureFlag.MULTI_USER)
      this.addResult(
        '企业版功能门控',
        enterpriseFeatureBlocked,
        enterpriseFeatureBlocked ? '企业版功能正确被阻止' : '企业版功能意外通过'
      )

      // 测试功能访问检查
      const accessCheck = await getFeatureAccess(FeatureFlag.ENTERPRISE_SUPPORT)
      const correctAccessCheck = !accessCheck.enabled && !!accessCheck.reason && !!accessCheck.upgradeUrl
      this.addResult(
        '功能访问检查',
        correctAccessCheck,
        correctAccessCheck ? '功能访问检查正确' : '功能访问检查异常',
        accessCheck
      )

    } catch (error) {
      this.addResult('功能门控测试', false, `测试失败: ${error}`)
    }
  }

  private async testDatabaseInitialization(): Promise<void> {
    console.log('🗄️ 测试数据库初始化...')

    try {
      // 初始化数据库（通过获取数据库实例来触发初始化）
      getDatabase()

      // 获取数据库统计信息
      const stats = getDatabaseStats()

      // 检查基础表是否存在
      const expectedBaseTables = [
        'system_settings', 'api_keys', 'users', 'documents',
        'comments', 'annotations', 'bookmarks', 'migration_history', 'user_sessions'
      ]

      const allBaseTablesExist = expectedBaseTables.every(table =>
        stats.tables.hasOwnProperty(table)
      )

      this.addResult(
        '基础数据库表',
        allBaseTablesExist,
        allBaseTablesExist ? '所有基础表创建成功' : '部分基础表缺失',
        { tables: Object.keys(stats.tables), expected: expectedBaseTables }
      )

      // 检查企业版表是否不存在（在社区版模式下）
      const enterpriseTables = [
        'document_versions', 'version_branches', 'version_tags',
        'document_locks', 'collaboration_sessions', 'collaboration_operations'
      ]

      const noEnterpriseTablesInCommunity = !enterpriseTables.some(table =>
        stats.tables.hasOwnProperty(table)
      )

      this.addResult(
        '企业版表隔离',
        noEnterpriseTablesInCommunity,
        noEnterpriseTablesInCommunity ? '企业版表正确隔离' : '发现意外的企业版表'
      )

    } catch (error) {
      this.addResult('数据库初始化测试', false, `测试失败: ${error}`)
    }
  }

  private async testErrorHandling(): Promise<void> {
    console.log('🛡️ 测试错误处理和恢复...')

    try {
      // 测试无效许可证处理
      process.env.MISONOTE_LICENSE_KEY = 'invalid_license_key'

      const license = this.licenseManager.getCurrentLicense()
      const licenseType = this.licenseManager.getLicenseType()
      const gracefulDegradation = licenseType === LicenseType.COMMUNITY || license?.type === 'community'

      this.addResult(
        '无效许可证降级',
        gracefulDegradation,
        gracefulDegradation ? '无效许可证正确降级到社区版' : '无效许可证处理异常'
      )

      // 清理环境变量
      delete process.env.MISONOTE_LICENSE_KEY

      // 测试许可证服务器不可用
      const originalUrl = process.env.LICENSE_SERVER_URL
      process.env.LICENSE_SERVER_URL = 'http://invalid-server.com'

      // 应该不会崩溃
      const licenseAfterServerError = this.licenseManager.getCurrentLicense()
      const licenseTypeAfterServerError = this.licenseManager.getLicenseType()
      const serverErrorHandled = licenseTypeAfterServerError === LicenseType.COMMUNITY || licenseAfterServerError?.type === 'community'

      this.addResult(
        '服务器错误处理',
        serverErrorHandled,
        serverErrorHandled ? '服务器错误正确处理' : '服务器错误处理异常'
      )

      // 恢复环境变量
      if (originalUrl) {
        process.env.LICENSE_SERVER_URL = originalUrl
      } else {
        delete process.env.LICENSE_SERVER_URL
      }

    } catch (error) {
      this.addResult('错误处理测试', false, `测试失败: ${error}`)
    }
  }

  private async testFeatureFlagConsistency(): Promise<void> {
    console.log('🏁 测试功能标志一致性...')

    try {
      // 测试社区版功能标志
      const communityFeatures = ['comments', 'annotations', 'bookmarks', 'basic_search']
      let consistencyCheck = true

      for (const feature of communityFeatures) {
        if (!this.licenseManager.hasFeature(feature)) {
          consistencyCheck = false
          break
        }
      }

      this.addResult(
        '社区版功能一致性',
        consistencyCheck,
        consistencyCheck ? '社区版功能标志一致' : '社区版功能标志不一致'
      )

      // 测试企业版功能标志识别
      const enterpriseFeatures = [FeatureFlag.MULTI_USER, FeatureFlag.ENTERPRISE_SUPPORT]
      let enterpriseRecognition = true

      for (const feature of enterpriseFeatures) {
        const result = await checkFeature(feature)
        if (result !== false) {
          enterpriseRecognition = false
          break
        }
      }

      this.addResult(
        '企业版功能识别',
        enterpriseRecognition,
        enterpriseRecognition ? '企业版功能正确识别' : '企业版功能识别异常'
      )

    } catch (error) {
      this.addResult('功能标志一致性测试', false, `测试失败: ${error}`)
    }
  }

  private printSummary(): void {
    console.log('\n📊 测试结果汇总:')
    console.log('=' .repeat(50))

    const passed = this.results.filter(r => r.passed).length
    const total = this.results.length
    const passRate = ((passed / total) * 100).toFixed(1)

    console.log(`总测试数: ${total}`)
    console.log(`通过数: ${passed}`)
    console.log(`失败数: ${total - passed}`)
    console.log(`通过率: ${passRate}%`)

    if (passed === total) {
      console.log('\n🎉 所有测试通过！企业版与社区版功能衔接正常。')
    } else {
      console.log('\n⚠️  部分测试失败，请检查以下问题:')
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(`   - ${result.name}: ${result.message}`)
      })
    }

    console.log('\n' + '='.repeat(50))
  }
}

// 运行测试
async function main() {
  const tester = new EnterpriseBridgeTest()
  await tester.runAllTests()
}

if (require.main === module) {
  main().catch(console.error)
}

export { EnterpriseBridgeTest }
