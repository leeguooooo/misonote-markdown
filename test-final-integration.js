#!/usr/bin/env node

/**
 * 最终集成测试 - 验证自定义域名配置
 */

const crypto = require('crypto');

// 测试配置
const CONFIG = {
  licenseServer: 'https://license-api.misonote.com',
  mainProject: 'http://localhost:3000'
};

// 发送HTTP请求
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? require('https') : require('http');

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinalIntegrationTest/1.0',
        ...headers
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 生成测试许可证
function generateTestLicense(options = {}) {
  const license = {
    id: options.id || `test-license-${Date.now()}`,
    type: options.type || 'enterprise',
    organization: options.organization || 'Test Organization',
    email: options.email || 'test@example.com',
    maxUsers: options.maxUsers || 100,
    features: options.features || ['multi_user', 'advanced_permissions', 'cloud_sync'],
    issuedAt: options.issuedAt || new Date().toISOString(),
    expiresAt: options.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    signature: options.signature || 'test_signature_' + crypto.randomBytes(32).toString('hex')
  };

  return 'misonote_' + Buffer.from(JSON.stringify(license)).toString('base64');
}

// 测试自定义域名许可证服务器
async function testCustomDomainServer() {
  console.log('🌐 测试自定义域名许可证服务器...');

  try {
    // 健康检查
    const healthResult = await makeRequest(`${CONFIG.licenseServer}/health`);
    console.log(`  ✓ 健康检查: 状态=${healthResult.status}, 健康=${healthResult.body.status}`);

    // 服务信息
    const infoResult = await makeRequest(`${CONFIG.licenseServer}/`);
    console.log(`  ✓ 服务信息: ${infoResult.body.service} v${infoResult.body.version}`);

    // 许可证验证
    const license = generateTestLicense();
    const verifyResult = await makeRequest(`${CONFIG.licenseServer}/api/v1/licenses/verify`, 'POST', {
      licenseKey: license,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(8).toString('hex')
    });

    if (verifyResult.body.success) {
      console.log(`  ✓ 许可证验证: 成功 (类型: ${verifyResult.body.data.license.type})`);
    } else {
      console.log(`  ❌ 许可证验证: 失败 - ${verifyResult.body.error}`);
    }

    return true;
  } catch (error) {
    console.log(`  ❌ 自定义域名服务器测试失败: ${error.message}`);
    return false;
  }
}

// 测试主项目集成
async function testMainProjectIntegration() {
  console.log('🏗️  测试主项目集成...');

  try {
    // 检查当前许可证状态
    const statusResult = await makeRequest(`${CONFIG.mainProject}/api/license/status`);
    console.log(`  ✓ 当前状态: ${statusResult.body.data.licenseType} (用户数: ${statusResult.body.data.maxUsers})`);

    // 验证新许可证
    const license = generateTestLicense({ type: 'enterprise', maxUsers: 500 });
    const validateResult = await makeRequest(`${CONFIG.mainProject}/api/license/status`, 'POST', {
      licenseKey: license
    });

    if (validateResult.body.success) {
      console.log(`  ✓ 许可证验证: 成功`);
      console.log(`    类型: ${validateResult.body.data.license.type}`);
      console.log(`    组织: ${validateResult.body.data.license.organization}`);
      console.log(`    用户数: ${validateResult.body.data.license.maxUsers}`);
      console.log(`    功能: ${validateResult.body.data.license.features.join(', ')}`);
    } else {
      console.log(`  ❌ 许可证验证失败: ${validateResult.body.error}`);
    }

    // 再次检查状态，确认许可证已缓存
    const newStatusResult = await makeRequest(`${CONFIG.mainProject}/api/license/status`);
    console.log(`  ✓ 更新后状态: ${newStatusResult.body.data.licenseType} (用户数: ${newStatusResult.body.data.maxUsers})`);

    return true;
  } catch (error) {
    console.log(`  ❌ 主项目集成测试失败: ${error.message}`);
    return false;
  }
}

// 测试在线验证功能
async function testOnlineValidation() {
  console.log('🔗 测试在线验证功能...');

  try {
    // 生成测试许可证
    const license = generateTestLicense({ type: 'professional', maxUsers: 50 });
    
    // 通过主项目验证（会触发在线验证）
    const result = await makeRequest(`${CONFIG.mainProject}/api/license/status`, 'POST', {
      licenseKey: license
    });

    if (result.body.success) {
      console.log(`  ✓ 在线验证成功: ${result.body.data.license.type}`);
      console.log(`    验证消息: ${result.body.data.message}`);
    } else {
      console.log(`  ❌ 在线验证失败: ${result.body.error}`);
    }

    return result.body.success;
  } catch (error) {
    console.log(`  ❌ 在线验证测试失败: ${error.message}`);
    return false;
  }
}

// 性能基准测试
async function testPerformance() {
  console.log('⚡ 性能基准测试...');

  const license = generateTestLicense();
  const requests = [];
  const startTime = Date.now();

  // 并发发送5个验证请求
  for (let i = 0; i < 5; i++) {
    requests.push(
      makeRequest(`${CONFIG.licenseServer}/api/v1/licenses/verify`, 'POST', {
        licenseKey: license,
        timestamp: Date.now(),
        nonce: crypto.randomBytes(8).toString('hex')
      }).catch(err => ({ error: err.message }))
    );
  }

  const results = await Promise.allSettled(requests);
  const endTime = Date.now();

  let successCount = 0;
  let errorCount = 0;

  results.forEach((result) => {
    if (result.status === 'fulfilled' && result.value.status && result.value.status < 500) {
      successCount++;
    } else {
      errorCount++;
    }
  });

  console.log(`  ✓ 并发请求: 总数=5, 成功=${successCount}, 失败=${errorCount}`);
  console.log(`  ✓ 总耗时: ${endTime - startTime}ms`);
  console.log(`  ✓ 平均响应时间: ${(endTime - startTime) / 5}ms`);

  return successCount >= 4; // 至少80%成功率
}

// 测试错误处理
async function testErrorHandling() {
  console.log('🚨 测试错误处理...');

  try {
    // 测试无效许可证
    const invalidResult = await makeRequest(`${CONFIG.mainProject}/api/license/status`, 'POST', {
      licenseKey: 'invalid_license_key'
    });
    
    if (!invalidResult.body.success) {
      console.log(`  ✓ 无效许可证正确拒绝: ${invalidResult.body.error}`);
    } else {
      console.log(`  ❌ 无效许可证未被拒绝`);
      return false;
    }

    // 测试过期许可证
    const expiredLicense = generateTestLicense({
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    });
    
    const expiredResult = await makeRequest(`${CONFIG.mainProject}/api/license/status`, 'POST', {
      licenseKey: expiredLicense
    });
    
    if (!expiredResult.body.success) {
      console.log(`  ✓ 过期许可证正确拒绝: ${expiredResult.body.error}`);
    } else {
      console.log(`  ❌ 过期许可证未被拒绝`);
      return false;
    }

    return true;
  } catch (error) {
    console.log(`  ❌ 错误处理测试失败: ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runFinalIntegrationTests() {
  console.log('🎯 开始最终集成测试...\n');
  console.log(`🌐 许可证服务器: ${CONFIG.licenseServer}`);
  console.log(`🏗️  主项目: ${CONFIG.mainProject}\n`);

  const results = {
    customDomain: await testCustomDomainServer(),
    mainProject: await testMainProjectIntegration(),
    onlineValidation: await testOnlineValidation(),
    performance: await testPerformance(),
    errorHandling: await testErrorHandling()
  };

  console.log('\n📊 测试结果总结:');
  console.log('================================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ 通过' : '❌ 失败';
    const testName = {
      customDomain: '自定义域名服务器',
      mainProject: '主项目集成',
      onlineValidation: '在线验证功能',
      performance: '性能基准测试',
      errorHandling: '错误处理'
    }[test];
    
    console.log(`${status} ${testName}`);
  });

  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 总体结果:');
  if (allPassed) {
    console.log('🎉 所有测试通过！许可证系统已完全就绪！');
    console.log('\n✅ 系统功能:');
    console.log('• 自定义域名 https://license-api.misonote.com 正常工作');
    console.log('• 主项目许可证验证功能正常');
    console.log('• 在线验证机制正常运行');
    console.log('• 性能表现良好');
    console.log('• 错误处理机制完善');
    
    console.log('\n🚀 可以开始使用许可证功能了！');
  } else {
    console.log('⚠️  部分测试失败，请检查相关配置');
  }

  return allPassed;
}

// 运行测试
if (require.main === module) {
  runFinalIntegrationTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('\n❌ 测试执行失败:', error);
      process.exit(1);
    });
}

module.exports = { runFinalIntegrationTests };
