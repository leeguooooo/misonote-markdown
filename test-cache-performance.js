#!/usr/bin/env node

const http = require('http');

const TEST_URL = 'http://localhost:3001/docs/test-ssr';
const TEST_ROUNDS = 5;

function makeRequest() {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    
    const req = http.get(TEST_URL, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const end = Date.now();
        resolve({
          statusCode: res.statusCode,
          responseTime: end - start,
          contentLength: data.length
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function runPerformanceTest() {
  console.log('🚀 开始缓存性能测试...\n');
  
  const results = [];
  
  for (let i = 1; i <= TEST_ROUNDS; i++) {
    try {
      console.log(`📊 第 ${i} 次请求...`);
      const result = await makeRequest();
      results.push(result);
      
      console.log(`   状态码: ${result.statusCode}`);
      console.log(`   响应时间: ${result.responseTime}ms`);
      console.log(`   内容长度: ${result.contentLength} bytes\n`);
      
      // 间隔 100ms
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ 第 ${i} 次请求失败:`, error.message);
    }
  }
  
  if (results.length > 0) {
    const responseTimes = results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log('📈 性能统计:');
    console.log(`   总请求数: ${results.length}`);
    console.log(`   平均响应时间: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`   最快响应时间: ${minResponseTime}ms`);
    console.log(`   最慢响应时间: ${maxResponseTime}ms`);
    console.log(`   响应时间标准差: ${calculateStandardDeviation(responseTimes).toFixed(2)}ms`);
    
    // 分析缓存效果
    if (results.length >= 2) {
      const firstRequest = responseTimes[0];
      const subsequentRequests = responseTimes.slice(1);
      const avgSubsequent = subsequentRequests.reduce((a, b) => a + b, 0) / subsequentRequests.length;
      
      console.log('\n🎯 缓存效果分析:');
      console.log(`   首次请求: ${firstRequest}ms (可能需要读取文件)`);
      console.log(`   后续请求平均: ${avgSubsequent.toFixed(2)}ms (使用缓存)`);
      
      if (avgSubsequent < firstRequest) {
        const improvement = ((firstRequest - avgSubsequent) / firstRequest * 100).toFixed(1);
        console.log(`   性能提升: ${improvement}% 🚀`);
      }
    }
  }
}

function calculateStandardDeviation(values) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

// 运行测试
runPerformanceTest().catch(console.error);
