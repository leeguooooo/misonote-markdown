#!/usr/bin/env tsx

/**
 * 数据库适配器测试脚本
 * 验证数据库存储功能是否正常工作
 */

import { DatabaseAdapter } from '../lib/storage/database-adapter';

async function testDatabaseAdapter() {
  console.log('🧪 开始测试数据库适配器...\n');
  
  // 创建适配器实例
  const adapter = new DatabaseAdapter();
  
  const testPath = 'test/sample-document.md';
  const testContent = `---
title: "测试文档"
status: "published"
public: true
created: "2024-01-01T00:00:00.000Z"
---

# 测试文档

这是一个测试文档，用于验证数据库适配器的功能。

## 功能特性

- 支持 Markdown 格式
- 支持 frontmatter
- 支持版本管理
- 支持协同编辑

## 代码示例

\`\`\`javascript
console.log('Hello, World!');
\`\`\`

测试完成！
`;

  try {
    // 1. 测试写入文档
    console.log('📝 测试写入文档...');
    const writeResult = await adapter.writeFile(testPath, testContent);
    console.log('✅ 写入结果:', writeResult.success ? '成功' : '失败');
    if (!writeResult.success) {
      console.error('❌ 写入错误:', writeResult.error);
      return;
    }
    console.log('📊 元数据:', writeResult.metadata);
    console.log('');
    
    // 2. 测试检查文件存在
    console.log('🔍 测试检查文件存在...');
    const exists = await adapter.exists(testPath);
    console.log('✅ 文件存在:', exists ? '是' : '否');
    console.log('');
    
    // 3. 测试读取文档
    console.log('📖 测试读取文档...');
    const content = await adapter.readFile(testPath);
    console.log('✅ 读取成功:', typeof content === 'string' ? '是' : '否');
    console.log('📄 内容长度:', typeof content === 'string' ? content.length : 0, '字符');
    console.log('');
    
    // 4. 测试获取元数据
    console.log('📋 测试获取元数据...');
    const metadata = await adapter.getMetadata(testPath);
    console.log('✅ 元数据获取:', metadata ? '成功' : '失败');
    if (metadata) {
      console.log('📊 文件大小:', metadata.size, '字节');
      console.log('📅 最后修改:', metadata.lastModified);
      console.log('🏷️  内容类型:', metadata.contentType);
      console.log('🔐 哈希值:', metadata.hash?.substring(0, 16) + '...');
    }
    console.log('');
    
    // 5. 测试文档存储接口
    console.log('💾 测试文档存储接口...');
    const docResult = await adapter.loadDocument(testPath);
    console.log('✅ 文档加载:', docResult ? '成功' : '失败');
    if (docResult) {
      console.log('📄 内容长度:', docResult.content.length, '字符');
      console.log('🔢 版本号:', docResult.version);
      console.log('📊 元数据:', Object.keys(docResult.metadata).join(', '));
    }
    console.log('');
    
    // 6. 测试更新文档
    console.log('✏️  测试更新文档...');
    const updatedContent = testContent + '\n\n## 更新内容\n\n这是更新后的内容。';
    const updateResult = await adapter.writeFile(testPath, updatedContent);
    console.log('✅ 更新结果:', updateResult.success ? '成功' : '失败');
    console.log('');
    
    // 7. 测试版本管理
    console.log('📚 测试版本管理...');
    const versions = await adapter.getVersions(testPath);
    console.log('✅ 版本数量:', versions.length);
    for (const version of versions) {
      console.log(`   版本 ${version.version}: ${version.createdAt.toISOString()}, ${version.size} 字节`);
    }
    console.log('');
    
    // 8. 测试列出文件
    console.log('📂 测试列出文件...');
    const listResult = await adapter.listFiles('/', { recursive: true });
    console.log('✅ 文件列表:', listResult.files.length, '个文件');
    for (const file of listResult.files.slice(0, 5)) {
      console.log(`   ${file.path} (${file.metadata.size} 字节)`);
    }
    if (listResult.files.length > 5) {
      console.log(`   ... 还有 ${listResult.files.length - 5} 个文件`);
    }
    console.log('');
    
    // 9. 测试复制文档
    console.log('📋 测试复制文档...');
    const copyPath = 'test/sample-document-copy.md';
    const copyResult = await adapter.copyFile(testPath, copyPath);
    console.log('✅ 复制结果:', copyResult.success ? '成功' : '失败');
    console.log('');
    
    // 10. 测试移动文档
    console.log('📦 测试移动文档...');
    const movePath = 'test/moved-document.md';
    const moveResult = await adapter.moveFile(copyPath, movePath);
    console.log('✅ 移动结果:', moveResult.success ? '成功' : '失败');
    console.log('');
    
    // 11. 测试存储统计
    console.log('📊 测试存储统计...');
    const stats = await adapter.getStats();
    console.log('✅ 统计信息:');
    console.log(`   总文件数: ${stats.totalFiles}`);
    console.log(`   总大小: ${stats.totalSize} 字节`);
    console.log(`   已用空间: ${stats.usedSpace} 字节`);
    console.log('');
    
    // 12. 清理测试数据
    console.log('🧹 清理测试数据...');
    const deleteResult1 = await adapter.deleteFile(testPath);
    const deleteResult2 = await adapter.deleteFile(movePath);
    console.log('✅ 清理结果:', (deleteResult1 && deleteResult2) ? '成功' : '部分失败');
    console.log('');
    
    console.log('🎉 所有测试完成！数据库适配器工作正常。');
    
  } catch (error) {
    console.error('💥 测试失败:', error);
    
    // 尝试清理
    try {
      await adapter.deleteFile(testPath);
      await adapter.deleteFile('test/sample-document-copy.md');
      await adapter.deleteFile('test/moved-document.md');
    } catch (cleanupError) {
      console.warn('⚠️  清理失败:', cleanupError);
    }
    
    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    await testDatabaseAdapter();
  } catch (error) {
    console.error('💥 测试脚本执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  main().catch(console.error);
}
