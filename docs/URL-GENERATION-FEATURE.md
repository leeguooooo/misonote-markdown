---
title: "文档地址生成功能完整说明"
---

# 🔗 文档地址生成功能

## 🎯 功能概述

我们成功为 misonote-markdown 系统添加了完整的文档地址生成功能，让用户可以方便地获取和分享文档的在线观看地址。

## ✅ 已实现功能

### 1. **服务端地址生成**
- ✅ **API 增强**: 所有文档相关 API 都返回地址信息
- ✅ **地址格式**: 
  - `viewUrl`: `/docs/{path}` (相对地址)
  - `fullUrl`: `http://localhost:3000/docs/{path}` (完整地址)
- ✅ **URL 编码**: 自动处理特殊字符的编码

### 2. **MCP 客户端集成**
- ✅ **新工具**: `get_document_url` - 专门获取文档地址
- ✅ **自动显示**: 所有文档操作都自动包含地址信息
- ✅ **搜索结果**: 搜索结果中包含文档地址

### 3. **功能覆盖**
- ✅ **文档创建**: 创建后立即显示访问地址
- ✅ **文档更新**: 更新后显示最新地址
- ✅ **文档获取**: 获取内容时包含地址
- ✅ **文档搜索**: 搜索结果包含地址
- ✅ **记忆系统**: 记忆文档也支持地址生成

## 🌐 地址示例

### 普通文档
- 文档路径: `README`
- 在线地址: `http://localhost:3000/docs/README`

### 嵌套文档
- 文档路径: `test/mcp-demo`
- 在线地址: `http://localhost:3000/docs/test%2Fmcp-demo`

### 记忆文档
- 文档路径: `memories/misonote/habits`
- 在线地址: `http://localhost:3000/docs/memories%2Fmisonote%2Fhabits`

## 🎯 使用场景

### 1. **文档分享**
```
用户: 请创建一个 API 文档
AI: 文档创建成功！
    在线地址: http://localhost:3000/docs/api-guide
    📖 点击地址即可在浏览器中查看文档。
```

### 2. **搜索结果**
```
用户: 搜索包含 "配置" 的文档
AI: 找到 3 个相关文档:
    1. **config.md**
       在线地址: http://localhost:3000/docs/config
       ...
```

### 3. **专门获取地址**
```
用户: 获取 README.md 的在线地址
AI: 🔗 文档地址
    文档路径: README.md
    在线地址: http://localhost:3000/docs/README
    📖 点击地址即可在浏览器中查看文档内容。
```

## 🔧 技术实现

### 服务端 API 增强
```typescript
// 生成在线观看地址
const viewUrl = `/docs/${encodeURIComponent(path)}`;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const fullUrl = `${baseUrl}${viewUrl}`;

return {
  // ... 其他数据
  viewUrl: viewUrl,
  fullUrl: fullUrl
};
```

### MCP 客户端工具
```javascript
{
  name: 'get_document_url',
  description: '获取文档的在线观看地址',
  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: '文档路径',
      }
    },
    required: ['path']
  }
}
```

## 🎉 用户体验提升

### 之前
- 用户创建文档后不知道如何访问
- 搜索到文档后需要手动构建地址
- 分享文档需要复杂的操作

### 现在
- ✅ 创建文档后立即获得访问地址
- ✅ 搜索结果直接包含访问链接
- ✅ 一键复制分享地址
- ✅ 支持所有类型的文档（普通文档、记忆文档等）

## 🚀 下一步优化

### 1. **短链接支持**
- 生成短链接便于分享
- 支持自定义域名

### 2. **批量地址生成**
- 支持批量获取多个文档地址
- 生成文档索引页面

### 3. **地址管理**
- 地址历史记录
- 访问统计分析

## 🎯 总结

文档地址生成功能的添加让 misonote-markdown 系统更加完整和用户友好：

1. **无缝集成** - 所有文档操作都自动包含地址
2. **便于分享** - 用户可以轻松分享文档链接
3. **提升效率** - 减少手动构建地址的工作
4. **增强体验** - 让文档系统更像现代化的知识库

现在用户可以：
- 📝 创建文档并立即获得分享链接
- 🔍 搜索文档并直接访问
- 🔗 专门获取任何文档的地址
- 📖 在浏览器中查看所有文档

这个功能让 misonote-markdown 真正成为了一个完整的在线文档系统！🎉