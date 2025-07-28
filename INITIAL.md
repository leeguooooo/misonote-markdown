## 功能特性：

### Misonote Markdown - 企业级文档管理系统

一个现代化的企业级Markdown文档管理系统，具备实时协作、MCP（模型上下文协议）集成和全面的许可证功能。该系统提供混合存储模型（文件系统 + PostgreSQL）、高级搜索和移动端优化。

**需要实现/完成的核心功能：**
1. **实时协作增强** - 完成基于Yjs的协作编辑，包括用户状态、光标同步和会话管理
2. **版本控制系统** - 实现类似Git的版本控制，包括分支、合并和差异可视化
3. **多租户企业功能** - 完成多组织支持，包括RBAC权限和工作区隔离
4. **RSA许可证签名验证** - 用适当的加密验证替换占位符实现
5. **AI驱动功能套件** - 实现AI任务管理、代码审查和文档生成功能

## 示例：

### 项目结构示例
- `examples/` - 包含各种实现示例和模板
- `docs/` - 展示分层组织的示例文档结构
- `scripts/` - 数据库迁移和部署脚本
- `tests/` - 使用Testing Library模式的Vitest测试示例

### 关键实现模式：
1. **服务层**：查看`src/core/services/`中的AuthService、DocumentService模式
2. **存储适配器**：查看`lib/storage/`中的混合文件系统/数据库适配器模式
3. **API路由**：查看`src/app/api/`中的Next.js 15路由处理程序模式
4. **组件结构**：查看`src/components/`中的TypeScript React组件模式
5. **MCP集成**：检查`misonote-mcp-client/`中的模型上下文协议实现

## 文档：

### 内部文档
- `/CLAUDE.md` - 代码库的AI助手指导
- `/README.md` - 项目概览和设置说明
- `/deployment/` - 各种平台的部署指南
- 数据库架构位于`/scripts/migrations/`

### 外部资源
- Next.js 15 App Router: https://nextjs.org/docs/app
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Yjs Collaborative Editing: https://docs.yjs.dev/
- MCP Protocol: https://modelcontextprotocol.io/
- Tailwind CSS v4: https://tailwindcss.com/docs/
- TipTap Editor: https://tiptap.dev/docs
- Mermaid Diagrams: https://mermaid.js.org/

### API文档
- 认证端点：`/api/auth/*`
- 文档管理：`/api/documents/*`
- 管理操作：`/api/admin/*`
- MCP服务器端点：`/api/mcp/*`

## 其他考虑因素：

### 关键实现注意事项：
1. **包管理器**：必须使用`pnpm`，不能使用npm或yarn
2. **子模块**：私有商业子模块需要`git clone --recursive`
3. **环境变量**：
   - 必须设置`ADMIN_PASSWORD_HASH_BASE64`以获取管理员访问权限
   - 数据库连接变量（DB_HOST、DB_PORT等）
   - 用于身份验证的`JWT_SECRET`
4. **数据库**：需要PostgreSQL（最近从SQLite迁移）
5. **端口**：开发服务器在端口3001上运行，不是3000

### 安全考虑：
- 密码使用bcrypt哈希，配合适当的盐轮数
- JWT令牌存储在httpOnly cookies中
- 许可证验证的基于时间的安全检查
- 许可证绑定的硬件指纹识别
- 敏感端点的速率限制

### 性能优化：
- 频繁访问文档的LRU缓存
- 文档树的懒加载
- 大型文档列表的虚拟滚动
- 快速开发构建的Turbopack
- 优化包大小的代码拆分

### 移动端特定要求：
- 触摸手势支持（滑动导航）
- 虚拟键盘适配
- 移动设备的底部导航
- 响应式排版和间距
- 低端设备的性能优化

### 测试策略：
- 使用jsdom的Vitest进行单元测试
- 使用Testing Library进行组件测试
- 使用c8的覆盖率报告
- E2E测试设置（待实现）

### 部署考虑：
- 支持多阶段构建的Docker
- 进程管理的PM2
- 独立的Next.js输出模式
- 环境特定配置
- 许可证服务器的Cloudflare Workers

### 已知问题和待办事项：
1. **P0 - RSA签名验证**：当前使用占位符（src/business/license/manager.ts:626）
2. **P0 - 移动端PR #10**：功能分支需要审查和合并
3. **P1 - 数据库快照/恢复**：数据库适配器中的占位符实现
4. **P1 - 多用户协作**：WebSocket基础设施就绪但功能不完整
5. **P2 - AI功能**：整个AI功能套件尚未实现

### 开发工作流程：
1. 拉取更改后始终运行`pnpm install`
2. 首次设置时使用`pnpm db:init`初始化数据库
3. 提交前运行`pnpm typecheck`
4. 使用`pnpm test:run`进行测试
5. 在实际设备上检查移动端响应性
6. 更新子模块：`git submodule update --init --recursive`