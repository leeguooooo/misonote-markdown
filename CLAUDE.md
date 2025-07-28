# CLAUDE.md

此文件为Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概览

Misonote Markdown是一个现代化的企业级Markdown文档管理系统，基于Next.js 15、TypeScript和PostgreSQL构建。它具备实时协作编辑、全面搜索、MCP（模型上下文协议）集成和企业许可证功能。

**当前实现状态**：约85%完成，核心功能可运行。主要待完成项目包括完整的实时协作功能、版本控制系统和AI驱动功能。

**重要**：此项目使用**pnpm**作为包管理器，不是npm。始终使用pnpm命令。

## 仓库结构

此仓库包含商业功能的私有子模块：
- `misonote-mcp-client`：MCP（模型上下文协议）客户端实现
- `enterprise`：付费用户的企业功能
- `misonote-license-server`：许可证验证服务器

这些子模块包含专有商业代码，不可公开访问。克隆时使用：
```bash
git clone --recursive [repository-url]
# 或如果已经克隆：
git submodule update --init --recursive
```

## 关键命令

### 包管理
```bash
pnpm install         # 安装依赖
pnpm add [package]   # 添加新依赖
pnpm remove [package] # 移除依赖
pnpm update          # 更新依赖
```

### 开发
```bash
pnpm dev              # 在端口3001启动Turbopack开发服务器
pnpm build            # 生产构建
pnpm start            # 启动生产服务器
pnpm lint             # 运行ESLint
pnpm typecheck        # 运行TypeScript类型检查 (tsc --noEmit)
```

### 数据库操作
```bash
pnpm db:init          # 初始化PostgreSQL数据库
pnpm db:migrate       # 运行数据库迁移
pnpm db:status        # 检查数据库连接和状态
```

### 测试
```bash
pnpm test            # 使用Vitest在监视模式下运行测试
pnpm test:run        # 运行一次测试
pnpm test:coverage   # 生成覆盖率报告
```

### 部署
```bash
pnpm docker:build    # 构建Docker镜像
pnpm docker:run      # 运行Docker容器
pnpm pm2:start       # 使用PM2进程管理器启动
```

## 架构概览

### 技术栈
- **前端**：Next.js 15.3.2（App Router）、React 19.0.0、Tailwind CSS v4（PostCSS）
- **后端**：Next.js API路由、带原生SQL的PostgreSQL数据库
- **编辑器**：TipTap及丰富编辑扩展
- **实时**：Yjs配合y-websocket实现协作编辑（部分实现）
- **认证**：基于JWT的bcrypt密码哈希
- **搜索**：Fuse.js全文搜索
- **Markdown**：react-markdown配合remark-gfm、rehype-highlight、Mermaid图表
- **MCP集成**：完整的MCP客户端，具备14个AI助手集成工具
- **测试**：Vitest配合jsdom和Testing Library

### 核心架构模式

1. **混合存储模型**：文档可存储在文件系统（`/docs`目录）和PostgreSQL数据库中。系统通过存储适配器使用统一接口。

2. **服务层模式**：业务逻辑在`/src/core/services/`中组织，关注点清晰分离：
   - `AuthService`：认证和用户管理
   - `DocumentService`：文档CRUD操作
   - `LicenseService`：企业许可证逻辑
   - `McpService`：模型上下文协议集成

3. **数据库访问**：通过`/lib/db/`模块使用带参数化查询的原生SQL。无ORM，提供灵活性和性能。

4. **API路由结构**：`/src/app/api/`中的RESTful API路由遵循Next.js约定，每个端点都有路由处理程序。

5. **组件组织**：
   - `/src/components/ui/`中的基础UI组件
   - 各自目录中的功能特定组件
   - `/src/components/admin/`中隔离的管理界面组件

### 移动端优化

当前的feature/mobile-optimization分支包括：
- `MobileBottomNav`：移动设备的底部导航
- `MobileOptimizedContent`：具有移动端特定优化的内容包装器
- `useSwipeGesture`和`useMobileOptimization`钩子用于移动交互
- globals.css中的大量移动端特定CSS（第557-934行）

### 认证流程

1. 通过`/api/auth/login`登录返回JWT令牌
2. 令牌存储在带httpOnly标志的cookies中
3. 中间件在受保护路由上验证令牌
4. 管理员路由需要特定的管理员角色

### 文档管理

- 文档作为`.md`文件存储在文件系统或数据库中
- 具有无限嵌套的分层树结构
- 使用Yjs的实时协作编辑
- 自动语法高亮和Mermaid图表渲染

### 企业功能

- 许可证强制的硬件指纹识别（完成）
- 使用Cloudflare Workers + Hono + D1的许可证验证
- 具有50+可配置功能的特性标志系统
- 许可证的时间篡改保护
- 多工作区支持（数据库架构就绪，实现待完成）
- 外部集成的API密钥管理
- 性能监控和分析（框架就绪）
- 组织和角色管理（架构就绪，实现待完成）
- 审计日志系统（后端就绪，UI待完成）

## 重要考虑事项

1. **数据库迁移**：最近从SQLite迁移到PostgreSQL。运行前确保正确的数据库初始化。

2. **环境变量**：
   - `ADMIN_PASSWORD_HASH_BASE64`：必须设置以获取管理员访问权限（使用base64编码）
   - `JWT_SECRET`：认证所需
   - 数据库连接变量（DB_HOST、DB_PORT、DB_USER、DB_PASSWORD、DB_NAME）
   - `NODE_ENV`：生产构建设置为'production'
   - `LICENSE_SERVER_*`：企业许可证验证变量

3. **已知问题**：
   - **P0**：RSA签名验证使用占位符实现（src/business/license/manager.ts:626）
   - **P0**：移动端PR #10需要审查和合并
   - **P1**：数据库快照/恢复有占位符实现
   - **P1**：实时协作功能不完整（WebSocket就绪但无用户状态）

4. **构建过程**：
   - 开发：在端口3001使用Turbopack（`pnpm dev`）
   - 生产：标准Next.js构建（`pnpm build`）
   - Docker：针对不同部署场景的多个Dockerfile选项

5. **测试策略**：
   - 测试使用Vitest配合jsdom
   - 组件测试应使用Testing Library模式
   - 提交前运行`pnpm test:run`
   - 使用`pnpm test:coverage`生成覆盖率报告

6. **安全**：
   - 密码使用适当盐轮数的bcrypt哈希
   - JWT令牌存储在httpOnly cookies中
   - API路由通过中间件验证认证
   - 敏感端点的速率限制
   - 许可证绑定的硬件指纹识别
   - 基于时间的安全检查

7. **MCP集成**：
   - 具有14个工具的完整MCP客户端实现
   - 支持文档管理、搜索和AI记忆功能
   - 作为npm包`misonote-mcp-client`发布
   - 与Claude、Cursor和其他AI工具集成

## 开发工作流程

1. 使用子模块克隆仓库：`git clone --recursive [repo-url]`
2. 拉取更改后始终运行`pnpm install`
3. 更新子模块：`git submodule update --init --recursive`
4. 首次设置时使用`pnpm db:init`初始化数据库
5. 使用`pnpm dev`启动开发服务器
6. 提交前运行测试：`pnpm test:run`
7. 使用`pnpm typecheck`检查类型
8. 生产部署使用Docker或PM2

## 子模块集成

项目与商业功能的私有子模块集成：

1. **misonote-mcp-client**：完整的MCP客户端实现
   - 14个文档管理和AI集成工具
   - AI习惯、偏好、回顾的记忆系统
   - NPM包：`npm install misonote-mcp-client`
   - 在`/src/core/mcp/`模块中使用
   - 支持Claude、Cursor、Cline、Continue集成

2. **enterprise**：企业专用功能模块
   - 高级许可证验证逻辑
   - 企业UI组件
   - 高级功能实现
   - 多组织支持代码
   - SSO集成准备

3. **misonote-license-server**：基于Cloudflare Workers的许可证服务器
   - 使用Hono框架和D1数据库构建
   - 许可证密钥生成和验证
   - 硬件指纹验证
   - 使用跟踪和分析
   - 客户管理端点
   - 与主应用程序分别部署

这些模块根据用户许可证状态和构建配置有条件加载。

## 待实现任务

### 高优先级
1. **完成RSA签名验证**：替换占位符加密实现
2. **合并移动端优化**：审查并合并PR #10
3. **实时协作**：添加用户状态、光标同步、会话管理
4. **数据库备份/恢复**：实现快照功能

### 中优先级
1. **版本控制系统**：实现类似Git的版本控制，带差异可视化
2. **多租户支持**：完成组织/工作区实现
3. **RBAC权限**：实现基于角色的访问控制
4. **审计日志UI**：创建查看审计日志的界面

### 未来增强
1. **AI驱动功能**：任务管理、代码审查、文档生成
2. **SSO集成**：企业的SAML/OAuth支持
3. **高级分析**：使用指标和洞察仪表板
4. **API测试平台**：用于API测试的MCP扩展
5. **自动部署**：客户特定部署工具

## 常见任务

### 添加新API端点
1. 在`/src/app/api/[endpoint]/route.ts`中创建路由处理程序
2. 遵循RESTful约定，使用适当的HTTP方法
3. 如需要，包含认证中间件
4. 为请求/响应添加适当的TypeScript类型
5. 与现有模式一致地处理错误

### 创建数据库迁移
1. 向`/scripts/migrations/`添加SQL文件，格式：`XXXX_description.sql`
2. 如可逆，包含UP和DOWN迁移
3. 使用`pnpm db:migrate`测试迁移
4. 更新架构文档

### 添加新组件
1. 放置在`/src/components/`下的适当目录中
2. 为所有props使用TypeScript接口
3. 遵循现有命名约定（组件使用PascalCase）
4. 包含适当的客户端/服务器组件指令
5. 添加移动端响应式样式

### 修改文档存储
1. 更新`/lib/storage/`中的文件系统和数据库适配器
2. 在存储适配器中维护统一接口
3. 更新`/src/types/`中的TypeScript类型
4. 测试两种存储模式
5. 考虑迁移影响

### 使用企业功能
1. 启用功能前检查许可证状态
2. 使用许可证配置中的特性标志
3. 为社区版本实现优雅降级
4. 为高级功能添加适当的UI指示器

### 实现新MCP工具
1. 在`misonote-mcp-client/src/tools/`中添加工具定义
2. 遵循现有工具模式，带适当的错误处理
3. 更新工具注册表和文档
4. 使用MCP Inspector或类似工具测试

### 性能优化
1. 为频繁访问的数据使用LRU缓存
2. 为大列表实现懒加载
3. 为文档树考虑虚拟滚动
4. 使用Chrome DevTools分析
5. 特别检查移动端性能