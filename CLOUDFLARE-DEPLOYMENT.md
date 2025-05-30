# ☁️ Cloudflare 部署支持计划

## 🎯 目标

支持两种部署方式：
1. **传统服务器部署** (现有方式)
2. **Cloudflare Pages + Workers** (新增)

## 🏗️ 架构设计

### 适配器模式

```typescript
// src/lib/storage/index.ts
interface StorageAdapter {
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  deleteFile(path: string): Promise<void>
  listFiles(dir: string): Promise<string[]>
  exists(path: string): Promise<boolean>
}

// 服务器模式
class FileSystemAdapter implements StorageAdapter {
  // 使用 fs 模块
}

// Cloudflare 模式
class CloudflareAdapter implements StorageAdapter {
  // 使用 KV + R2
}
```

## 📋 实现计划

### Phase 1: 核心适配器 (1-2天)

1. **存储适配器**
   ```typescript
   // src/lib/storage/filesystem.ts - 现有方式
   // src/lib/storage/cloudflare.ts - 新增
   // src/lib/storage/factory.ts - 工厂模式
   ```

2. **配置检测**
   ```typescript
   const isCloudflare = typeof caches !== 'undefined'
   const storage = createStorageAdapter(isCloudflare ? 'cloudflare' : 'filesystem')
   ```

### Phase 2: 数据存储迁移 (1天)

1. **文档存储**
   - 服务器: `docs/` 文件夹
   - Cloudflare: R2 Bucket

2. **元数据存储**
   - 服务器: JSON 文件
   - Cloudflare: KV Store

3. **评论系统**
   - 服务器: `data/comments.json`
   - Cloudflare: D1 数据库

### Phase 3: 认证适配 (半天)

```typescript
// src/lib/auth/index.ts
interface AuthAdapter {
  verifyPassword(password: string): Promise<boolean>
  generateToken(user: any): string
  verifyToken(token: string): any
}
```

### Phase 4: 构建配置 (半天)

1. **Next.js 配置**
   ```javascript
   // next.config.js
   const isCloudflare = process.env.DEPLOY_TARGET === 'cloudflare'
   
   module.exports = {
     output: isCloudflare ? 'export' : 'standalone',
     // Cloudflare 特定配置
   }
   ```

2. **部署脚本**
   ```bash
   # scripts/deploy-cloudflare.sh
   pnpm build:cloudflare
   wrangler pages deploy
   ```

## 🔧 技术实现

### 1. 存储适配器实现

```typescript
// src/lib/storage/cloudflare.ts
export class CloudflareStorageAdapter implements StorageAdapter {
  constructor(
    private kv: KVNamespace,
    private r2: R2Bucket
  ) {}

  async readFile(path: string): Promise<string> {
    if (path.endsWith('.md')) {
      // 文档存储在 R2
      const object = await this.r2.get(path)
      return await object?.text() || ''
    } else {
      // 元数据存储在 KV
      return await this.kv.get(path) || ''
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (path.endsWith('.md')) {
      await this.r2.put(path, content)
    } else {
      await this.kv.put(path, content)
    }
  }
}
```

### 2. 环境变量适配

```typescript
// src/lib/config.ts
export const config = {
  storage: {
    type: process.env.STORAGE_TYPE || 'filesystem',
    cloudflare: {
      kvNamespace: process.env.KV_NAMESPACE,
      r2Bucket: process.env.R2_BUCKET,
      d1Database: process.env.D1_DATABASE
    }
  }
}
```

### 3. API 路由适配

```typescript
// src/app/api/docs/route.ts
import { getStorageAdapter } from '@/lib/storage'

export async function GET() {
  const storage = getStorageAdapter()
  const docs = await storage.listFiles('docs/')
  return Response.json(docs)
}
```

## 📦 部署配置

### Cloudflare 配置文件

```toml
# wrangler.toml
name = "markdown-preview"
compatibility_date = "2024-01-01"

[env.production]
kv_namespaces = [
  { binding = "DOCS_KV", id = "your-kv-id" }
]

[[env.production.r2_buckets]]
binding = "DOCS_R2"
bucket_name = "markdown-docs"

[[env.production.d1_databases]]
binding = "DOCS_DB"
database_name = "markdown-comments"
database_id = "your-d1-id"
```

### 环境变量

```bash
# .env.cloudflare
DEPLOY_TARGET=cloudflare
STORAGE_TYPE=cloudflare
KV_NAMESPACE=DOCS_KV
R2_BUCKET=DOCS_R2
D1_DATABASE=DOCS_DB
```

## 🚀 部署命令

### 新增的 package.json 脚本

```json
{
  "scripts": {
    "build:cloudflare": "DEPLOY_TARGET=cloudflare next build",
    "deploy:cloudflare": "pnpm build:cloudflare && wrangler pages deploy",
    "dev:cloudflare": "wrangler pages dev .next",
    
    "cf:setup": "bash scripts/setup-cloudflare.sh",
    "cf:deploy": "bash scripts/deploy-cloudflare.sh"
  }
}
```

## 📋 迁移指南

### 从服务器迁移到 Cloudflare

```bash
# 1. 导出现有数据
pnpm export:data

# 2. 设置 Cloudflare 资源
pnpm cf:setup

# 3. 导入数据到 Cloudflare
pnpm import:cloudflare

# 4. 部署
pnpm deploy:cloudflare
```

## 🎯 优势

### Cloudflare 部署优势
- ✅ **全球 CDN**: 更快的访问速度
- ✅ **无服务器**: 无需管理服务器
- ✅ **自动扩展**: 自动处理流量峰值
- ✅ **成本效益**: 按使用量付费
- ✅ **高可用**: 99.9% 可用性

### 保持兼容性
- ✅ **现有部署不受影响**: 服务器部署继续工作
- ✅ **渐进式迁移**: 可以逐步迁移
- ✅ **统一代码库**: 一套代码支持两种部署

## 📊 工作量评估

| 任务 | 预估时间 | 难度 |
|------|----------|------|
| 存储适配器 | 1-2天 | 中等 |
| 数据迁移 | 1天 | 简单 |
| 认证适配 | 0.5天 | 简单 |
| 构建配置 | 0.5天 | 简单 |
| 测试调试 | 1天 | 中等 |
| **总计** | **4-5天** | **中等** |

## 🤔 是否值得实现？

### 建议：**值得实现**

**理由**：
1. **市场需求**: 很多用户喜欢 Serverless 部署
2. **技术趋势**: Cloudflare Pages 越来越流行
3. **差异化**: 支持双模式部署的 Markdown 系统不多
4. **学习价值**: 掌握现代部署技术

**实施建议**：
1. 先实现核心适配器
2. 创建 MVP 版本测试
3. 逐步完善功能
4. 更新文档和示例

你觉得这个方案如何？要不要我们先从存储适配器开始实现？
