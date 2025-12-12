name: "Misonote关键功能实现PRP"
description: |

## 目的
为Misonote Markdown实现关键的P0和P1功能，包括RSA（SHA-256）签名验证、基于Yjs的实时协作和多租户企业功能。此PRP为AI代理提供全面的上下文，以遵循现有模式实现这些功能。

## 核心原则
1. **上下文为王**：包含所有必要的文档、模式和注意事项
2. **验证循环**：使用pnpm命令的可执行测试
3. **信息密集**：使用现有代码库模式和约定
4. **渐进式成功**：从简单修复开始，验证后再处理复杂功能
5. **全局规则**：遵循CLAUDE.md中的所有规则

---

## 目标
实现三个关键功能以完成Misonote Markdown企业文档管理系统：
1. 修复许可证验证的RSA（SHA-256）签名验证
2. 完成具有用户状态和光标同步的实时协作
3. 实现具有RBAC的多租户企业功能

## 为什么
- **许可证安全**：当前占位符允许任何签名，存在安全漏洞
- **协作**：WebSocket基础设施存在但未连接，阻塞实时编辑
- **企业**：数据库架构就绪但无实现，阻塞多组织部署
- **用户影响**：这些功能启用安全许可证、团队协作和企业规模

## 什么
### 成功标准
- [ ] 许可证签名验证能验证服务器响应完整性
- [ ] 多个用户可以编辑文档，显示光标和状态
- [ ] 组织可以管理用户、工作区和权限
- [ ] 所有功能与现有认证和服务集成
- [ ] 测试通过：`pnpm test:run`
- [ ] 类型检查通过：`pnpm typecheck`

## 所需的全部上下文

### 文档和参考资料
```yaml
# 必读 - 在上下文窗口中包含这些
- url: https://docs.yjs.dev/
  why: 协作实现的Yjs CRDT文档
  
- url: https://github.com/yjs/y-websocket
  why: WebSocket提供程序服务器实现示例
  
- url: https://nodejs.org/api/crypto.html#cryptocreatehashalgoritm-options
  why: SHA-256哈希验证的Node.js crypto
  
- file: src/business/license/manager.ts
  why: 第626行有需要修复的占位符RSA验证
  
- file: src/components/editor/CollaborativeEditor.tsx
  why: 要连接的前端协作设置模式
  
- file: lib/collaboration/performance-optimizer.ts
  why: 现有协作优化模式
  
- file: src/core/services/annotation-service.ts
  why: 新服务要遵循的服务模式
  
- file: src/app/api/admin/documents/route.ts
  why: 带错误处理的API路由模式
  
- file: scripts/migrations/
  why: 组织、角色、工作区的数据库架构
  
- doc: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  section: Route Handlers
  critical: Next.js 15不支持API路由中的WebSocket
```

### 当前代码库结构
```bash
misonote-markdown/
├── src/
│   ├── app/
│   │   ├── api/             # Next.js API路由
│   │   └── (routes)/        # 页面路由
│   ├── components/
│   │   ├── editor/          # CollaborativeEditor.tsx在这里
│   │   └── admin/           # 管理UI组件
│   ├── core/
│   │   ├── services/        # 业务逻辑服务
│   │   └── database/        # SQLite数据库（需要迁移）
│   └── business/
│       └── license/         # 带RSA问题的许可证管理器
├── lib/
│   ├── db/                  # PostgreSQL连接
│   ├── storage/             # 存储适配器
│   └── collaboration/       # 协作工具
├── scripts/
│   └── migrations/          # PostgreSQL迁移
└── tests/                   # Vitest测试
```

### 新文件的期望结构
```bash
misonote-markdown/
├── src/
│   ├── core/
│   │   └── services/
│   │       ├── organization-service.ts  # 新：多租户组织管理
│   │       ├── permission-service.ts    # 新：RBAC权限
│   │       └── collaboration-service.ts # 新：实时协作
│   └── app/
│       └── api/
│           ├── organizations/           # 新：组织管理端点
│           └── collaboration/           # 新：协作端点
├── lib/
│   └── websocket/
│       ├── server.ts                    # 新：WebSocket服务器
│       └── handlers.ts                  # 新：WebSocket事件处理程序
└── tests/
    └── services/
        ├── organization.test.ts         # 新：组织服务测试
        └── collaboration.test.ts        # 新：协作测试
```

### 已知陷阱和关键信息
```typescript
// 关键：项目使用pnpm，不是npm
// 关键：开发服务器在端口3001运行，不是3000
// 关键：服务期望SQLite但项目使用PostgreSQL
// 关键：私有子模块可能无法访问

// 数据库不匹配问题：
// 旧服务从'../database'导入（SQLite 实现）
// 但项目在 lib/db/ 中已迁移到 PostgreSQL
// 新服务应使用 lib/db/ 的 PostgreSQL 模式

// Next.js的WebSocket：
// Next.js API路由不支持WebSocket
// 必须创建单独的WebSocket服务器或自定义服务器

// 环境变量：
// ADMIN_PASSWORD_HASH_BASE64 - 必须base64编码
// JWT_SECRET - 认证必需
// DB_* - PostgreSQL连接

// Yjs细节：
// 文档通过房间名称标识（使用文档ID）
// 感知更新与文档更新分离
// 二进制编码以提高效率
```

## 实现蓝图

### 数据模型和结构

```typescript
// 组织模型（已在数据库架构中）
interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface Workspace {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  organization_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

// 协作模型
interface CollaborationSession {
  document_id: string;
  user_id: string;
  cursor_position?: number;
  selection?: { start: number; end: number };
  connected_at: string;
  last_heartbeat: string;
}
```

### 任务列表（按顺序）

```yaml
任务1 - 修复RSA签名验证：
修改 src/business/license/manager.ts:
  - 查找：第626行附近的"verifyServerResponseSignature"方法
  - 替换：占位符为实际SHA-256验证
  - 使用：Node.js crypto.createHash('sha256')
  - 模式：哈希字符串化数据，与签名比较

任务2 - 迁移数据库服务：
创建 src/core/database/postgres-adapter.ts:
  - 镜像：lib/db/index.ts的模式
  - 导出：返回PostgreSQL池的getDatabase()函数
  - 更新：现有服务中的导入
  
任务3 - 创建组织服务：
创建 src/core/services/organization-service.ts:
  - 遵循：annotation-service.ts的模式
  - 实现：组织的CRUD
  - 实现：工作区管理
  - 使用：lib/db/的PostgreSQL

任务4 - 创建权限服务：
创建 src/core/services/permission-service.ts:
  - 实现：checkPermission(userId, orgId, resource, action)
  - 实现：角色分配
  - 缓存：使用lru-cache的权限

任务5 - 创建WebSocket服务器：
创建 lib/websocket/server.ts:
  - 使用：ws或socket.io库
  - 集成：用于Yjs的y-websocket
  - 添加：JWT认证
  - 实现：房间管理

任务6 - 创建协作服务：
创建 src/core/services/collaboration-service.ts:
  - 跟踪：活动会话
  - 管理：用户状态
  - 持久化：Yjs更新到数据库
  - 处理：断开连接

任务7 - 创建API端点：
创建 src/app/api/organizations/route.ts:
  - 遵循：api/admin/documents/route.ts的模式
  - 添加：认证中间件
  - 实现：GET、POST、PUT、DELETE

任务8 - 更新协作编辑器：
修改 src/components/editor/CollaborativeEditor.tsx:
  - 更新：WebSocket URL到实际服务器
  - 添加：连接的认证令牌
  - 确保：适当的错误处理

任务9 - 添加测试：
为每个新服务创建测试：
  - 遵循：现有测试模式
  - 使用：Vitest和Testing Library
  - 模拟：数据库调用
  - 测试：错误情况
```

### 任务实现细节

```typescript
// 任务1：修复RSA签名验证
import crypto from 'crypto';

private verifyServerResponseSignature(response: any): boolean {
  if (!response.signature || !response.data) {
    return false;
  }
  
  // 服务器使用字符串化数据的SHA-256哈希
  const dataString = JSON.stringify(response.data);
  const computedHash = crypto
    .createHash('sha256')
    .update(dataString)
    .digest('hex');
  
  return computedHash === response.signature;
}

// 任务3：组织服务模式
import { getPool } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import type { Organization } from '@/types';

export async function createOrganization(
  name: string,
  ownerId: string
): Promise<Organization> {
  const pool = getPool();
  const id = uuidv4();
  
  try {
    // 开始事务
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // 创建组织
      const orgResult = await client.query(
        `INSERT INTO organizations (id, name, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING *`,
        [id, name]
      );
      
      // 分配所有者角色
      await client.query(
        `INSERT INTO user_organization_roles (user_id, organization_id, role)
         VALUES ($1, $2, 'owner')`,
        [ownerId, id]
      );
      
      await client.query('COMMIT');
      return orgResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    log.error('Failed to create organization:', error);
    throw new Error('Failed to create organization');
  }
}

// 任务5：WebSocket服务器设置
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';
import jwt from 'jsonwebtoken';

const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', async (ws, req) => {
  // 提取并验证JWT
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    ws.close(1008, 'Missing authentication');
    return;
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.sub;
    
    // 设置Yjs连接
    setupWSConnection(ws, req, {
      docName: req.url?.slice(1) || 'default',
      gc: true
    });
    
    // 跟踪会话
    await createCollaborationSession(userId, docName);
    
  } catch (error) {
    ws.close(1008, 'Invalid authentication');
  }
});
```

### 集成点
```yaml
数据库：
  - 迁移：已存在于scripts/migrations/中
  - 表：organizations、workspaces、user_organization_roles
  
配置：
  - 添加到：.env
  - 值："WEBSOCKET_PORT=3002"
  
启动：
  - 修改：package.json脚本
  - 添加："ws:dev": "node lib/websocket/server.js"
  - 同时运行："dev": "concurrently \"pnpm next:dev\" \"pnpm ws:dev\""
```

## 验证循环

### 级别1：语法和类型检查
```bash
# 每次文件创建/修改后
pnpm typecheck              # 必须通过 - 无类型错误
pnpm lint                   # 修复任何lint问题

# 预期：无错误
```

### 级别2：单元测试
```typescript
// 测试RSA修复
describe('License Manager', () => {
  it('should verify valid server signature', () => {
    const response = {
      data: { valid: true },
      signature: crypto.createHash('sha256')
        .update(JSON.stringify({ valid: true }))
        .digest('hex')
    };
    expect(verifyServerResponseSignature(response)).toBe(true);
  });
});

// 测试组织服务
describe('Organization Service', () => {
  it('should create organization with owner', async () => {
    const org = await createOrganization('Test Org', 'user-123');
    expect(org.name).toBe('Test Org');
    
    const role = await getUserRole('user-123', org.id);
    expect(role).toBe('owner');
  });
});
```

```bash
# 实现后运行测试
pnpm test:run

# 针对特定测试文件
pnpm test src/business/license/manager.test.ts
```

### 级别3：集成测试
```bash
# 启动服务
pnpm dev  # 在3001启动Next.js，在3002启动WebSocket

# 测试组织创建
curl -X POST http://localhost:3001/api/organizations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Organization"}'

# 测试WebSocket连接
wscat -c ws://localhost:3002/document-id \
  -H "Authorization: Bearer $TOKEN"

# 预期：成功连接
```

## 最终验证检查清单
- [ ] 所有测试通过：`pnpm test:run`
- [ ] 无类型错误：`pnpm typecheck`
- [ ] 许可证签名验证工作正常
- [ ] WebSocket服务器在端口3002运行
- [ ] 多个用户可以连接到同一文档
- [ ] 用户间光标可见
- [ ] 组织可以创建/管理
- [ ] 权限正确强制执行
- [ ] 浏览器中无控制台错误
- [ ] 优雅的错误处理

---

## 要避免的反模式
- ❌ 不要使用npm命令 - 使用pnpm
- ❌ 不要硬编码端口3000 - 使用3001
- ❌ 不要使用SQLite模式 - 使用PostgreSQL
- ❌ 不要跳过PostgreSQL中的事务处理
- ❌ 不要忘记处理WebSocket认证
- ❌ 不要存储密码 - 使用bcrypt哈希
- ❌ 不要忽略现有模式 - 遵循约定

## 信心分数：8/10

高信心的原因：
- 要遵循的清晰现有模式
- 定义良好的数据库架构
- 提供具体的实现细节
- 全面的验证步骤

较低信心的领域：
- WebSocket服务器与Next.js的集成
- 私有子模块依赖
- 数据库适配器迁移复杂性
