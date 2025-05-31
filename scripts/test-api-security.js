#!/usr/bin/env node

/**
 * API安全测试脚本
 * 测试实际运行的API的安全功能
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SecurityTest/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
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

async function testLicenseAPIRateLimit() {
  console.log('🔒 测试许可证API速率限制...');
  
  const requests = [];
  const startTime = Date.now();
  
  // 发送15个快速请求
  for (let i = 0; i < 15; i++) {
    requests.push(
      makeRequest('/api/license', 'POST', { licenseKey: `test_key_${i}` })
        .catch(err => ({ error: err.message }))
    );
  }
  
  const results = await Promise.allSettled(requests);
  const endTime = Date.now();
  
  let successCount = 0;
  let rateLimitedCount = 0;
  let errorCount = 0;
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value.status) {
      if (result.value.status === 429) {
        rateLimitedCount++;
        console.log(`  请求 ${index + 1}: 速率限制 (429)`);
      } else if (result.value.status === 400) {
        successCount++;
        console.log(`  请求 ${index + 1}: 正常处理 (400 - 许可证无效)`);
      } else {
        console.log(`  请求 ${index + 1}: 状态 ${result.value.status}`);
      }
    } else {
      errorCount++;
      console.log(`  请求 ${index + 1}: 错误`);
    }
  });
  
  console.log(`\n  📊 测试结果:`);
  console.log(`  ✓ 总请求数: ${results.length}`);
  console.log(`  ✓ 正常处理: ${successCount}`);
  console.log(`  ✓ 速率限制: ${rateLimitedCount}`);
  console.log(`  ✓ 错误请求: ${errorCount}`);
  console.log(`  ✓ 总耗时: ${endTime - startTime}ms`);
  console.log(`  ✓ 速率限制${rateLimitedCount > 0 ? '正常工作 ✅' : '可能未生效 ⚠️'}`);
  
  // 检查速率限制头部
  if (results.length > 0 && results[0].status === 'fulfilled') {
    const headers = results[0].value.headers;
    if (headers['x-ratelimit-limit']) {
      console.log(`  ✓ 速率限制头部: Limit=${headers['x-ratelimit-limit']}, Remaining=${headers['x-ratelimit-remaining']}`);
    }
  }
  
  console.log('');
}

async function testLicenseValidation() {
  console.log('🔐 测试许可证验证功能...');
  
  // 测试1: 无许可证
  try {
    const result1 = await makeRequest('/api/license', 'GET');
    console.log(`  ✓ 获取当前许可证: 状态=${result1.status}, 类型=${result1.body?.data?.type || '未知'}`);
  } catch (error) {
    console.log(`  ❌ 获取许可证失败: ${error.message}`);
  }
  
  // 测试2: 无效许可证
  try {
    const result2 = await makeRequest('/api/license', 'POST', { licenseKey: 'invalid_license' });
    console.log(`  ✓ 无效许可证: 状态=${result2.status}, 成功=${result2.body?.success}, 错误=${result2.body?.error || '无'}`);
  } catch (error) {
    console.log(`  ❌ 无效许可证测试失败: ${error.message}`);
  }
  
  // 测试3: 格式错误的许可证
  try {
    const result3 = await makeRequest('/api/license', 'POST', { licenseKey: 'misonote_invalid_base64' });
    console.log(`  ✓ 格式错误: 状态=${result3.status}, 成功=${result3.body?.success}, 错误=${result3.body?.error || '无'}`);
  } catch (error) {
    console.log(`  ❌ 格式错误测试失败: ${error.message}`);
  }
  
  // 测试4: 测试许可证
  const testLicense = {
    id: 'test-license-001',
    type: 'enterprise',
    organization: 'Test Organization',
    email: 'test@example.com',
    maxUsers: 100,
    features: ['multi_user', 'advanced_permissions'],
    issuedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    signature: 'test_signature_placeholder'
  };
  
  const testLicenseKey = 'misonote_' + Buffer.from(JSON.stringify(testLicense)).toString('base64');
  
  try {
    const result4 = await makeRequest('/api/license', 'POST', { licenseKey: testLicenseKey });
    console.log(`  ✓ 测试许可证: 状态=${result4.status}, 成功=${result4.body?.success}, 错误=${result4.body?.error || '无'}`);
  } catch (error) {
    console.log(`  ❌ 测试许可证失败: ${error.message}`);
  }
  
  console.log('');
}

async function testSecurityHeaders() {
  console.log('🛡️  测试安全头部...');
  
  try {
    const result = await makeRequest('/api/license', 'GET');
    const headers = result.headers;
    
    console.log(`  ✓ 响应状态: ${result.status}`);
    
    // 检查安全相关头部
    const securityHeaders = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining', 
      'x-ratelimit-reset',
      'content-type',
      'cache-control'
    ];
    
    securityHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`  ✓ ${header}: ${headers[header]}`);
      } else {
        console.log(`  ⚠️  ${header}: 未设置`);
      }
    });
    
  } catch (error) {
    console.log(`  ❌ 安全头部测试失败: ${error.message}`);
  }
  
  console.log('');
}

async function testAPIEndpoints() {
  console.log('🌐 测试API端点安全...');
  
  const endpoints = [
    { path: '/api/health', method: 'GET', description: '健康检查' },
    { path: '/api/license', method: 'GET', description: '许可证信息' },
    { path: '/api/enterprise/users', method: 'GET', description: '企业用户' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const result = await makeRequest(endpoint.path, endpoint.method);
      console.log(`  ✓ ${endpoint.description} (${endpoint.method} ${endpoint.path}): 状态=${result.status}`);
      
      // 检查是否有适当的错误处理
      if (result.status >= 400 && result.status < 500) {
        console.log(`    - 客户端错误处理: ${result.body?.error || result.body?.message || '有错误响应'}`);
      }
      
    } catch (error) {
      console.log(`  ❌ ${endpoint.description}: ${error.message}`);
    }
  }
  
  console.log('');
}

async function runAllTests() {
  console.log('🔒 开始API安全测试...\n');
  console.log(`📡 测试目标: ${BASE_URL}\n`);
  
  await testLicenseAPIRateLimit();
  await testLicenseValidation();
  await testSecurityHeaders();
  await testAPIEndpoints();
  
  console.log('✅ 所有API安全测试完成！');
}

// 运行测试
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('\n🎉 API安全测试完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ 测试失败:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testLicenseAPIRateLimit,
  testLicenseValidation,
  testSecurityHeaders,
  testAPIEndpoints,
  makeRequest
};
