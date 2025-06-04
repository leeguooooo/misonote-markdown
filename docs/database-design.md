# 数据库设计文档

## 📊 概述

MisoNote 采用分层数据库架构，支持社区版和企业版两种模式：

- **社区版**: 支持普通用户注册、评论、标注等基础功能，单管理员模式
- **企业版**: 在社区版基础上扩展组织管理、权限控制、版本管理、实时协作等企业功能

## 🏗️ 架构设计

### 数据库技术栈
- **主数据库**: PostgreSQL 14+
- **连接池**: pg (Node.js PostgreSQL客户端)
- **特性**: JSONB、数组类型、触发器、索引优化

### 设计原则
1. **向后兼容**: 企业版扩展不影响社区版功能
2. **权限分层**: 组织 → 空间 → 文档的三级权限继承
3. **性能优先**: 合理的索引策略和查询优化
4. **数据安全**: 完整的审计日志和访问控制

## 📋 社区版表结构

### 核心表

#### 1. 用户表 (users)
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),
    
    -- 用户类型和状态
    user_type VARCHAR(20) NOT NULL DEFAULT 'guest' 
        CHECK (user_type IN ('admin', 'user', 'guest')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' 
        CHECK (account_status IN ('active', 'inactive', 'banned', 'pending')),
    
    -- 权限控制
    can_comment BOOLEAN DEFAULT true,
    can_create_annotations BOOLEAN DEFAULT true,
    can_edit_documents BOOLEAN DEFAULT false, -- 只有管理员可以编辑
    
    -- 统计信息
    comment_count INTEGER DEFAULT 0,
    annotation_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

**用户类型说明**:
- `admin`: 管理员（只能有一个），可以编辑文档、管理用户、系统设置
- `user`: 注册用户，可以评论、标注、收藏
- `guest`: 匿名用户，可以评论（如果允许）

#### 2. 文档表 (documents)
```sql
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_path VARCHAR(500) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    
    -- 文档状态
    status VARCHAR(20) DEFAULT 'published' 
        CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT true,
    
    -- 统计信息
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    annotation_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

#### 3. 评论表 (comments)
```sql
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    document_path VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    author_role VARCHAR(20) DEFAULT 'guest',
    author_avatar VARCHAR(500),
    
    -- 评论功能
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true, -- 社区版默认自动通过
    is_deleted BOOLEAN DEFAULT false,
    parent_id VARCHAR(36), -- 支持回复
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

#### 4. 标注表 (annotations)
```sql
CREATE TABLE annotations (
    id VARCHAR(36) PRIMARY KEY,
    document_path VARCHAR(500) NOT NULL,
    annotation_type VARCHAR(20) NOT NULL 
        CHECK (annotation_type IN ('highlight', 'note', 'bookmark')),
    selected_text TEXT NOT NULL,
    comment_text TEXT,
    position_data JSONB NOT NULL, -- 存储位置信息
    
    -- 作者信息
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    author_role VARCHAR(20) DEFAULT 'guest',
    
    -- 标注功能
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true,
    is_deleted BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false, -- 用于笔记类型
    
    -- 样式和分类
    color VARCHAR(20) DEFAULT '#ffeb3b',
    tags JSONB, -- 标签数组
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);
```

### 辅助表

- **system_settings**: 系统设置
- **api_keys**: API密钥管理
- **user_sessions**: 用户会话
- **migration_history**: 数据迁移历史

## 🏢 企业版扩展表结构

### 组织和权限管理

#### 1. 组织表 (organizations)
```sql
CREATE TABLE organizations (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(500),
    domain VARCHAR(255), -- 企业域名，用于SSO
    
    -- 订阅信息
    subscription_plan VARCHAR(50) NOT NULL DEFAULT 'enterprise',
    subscription_status VARCHAR(20) NOT NULL DEFAULT 'active',
    max_users INTEGER DEFAULT 100,
    max_storage_gb INTEGER DEFAULT 1000,
    
    -- 企业设置
    settings JSONB,
    sso_enabled BOOLEAN DEFAULT false,
    sso_config JSONB,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);
```

#### 2. 企业角色表 (enterprise_roles)
```sql
CREATE TABLE enterprise_roles (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- 权限配置
    permissions JSONB NOT NULL, -- 详细权限列表
    is_system_role BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    
    UNIQUE(organization_id, slug)
);
```

**预定义角色**:
- `org_admin`: 组织管理员，拥有所有权限
- `space_admin`: 空间管理员，可以管理特定空间
- `editor`: 编辑者，可以编辑文档
- `reviewer`: 审阅者，可以审阅和评论
- `viewer`: 查看者，只能查看和评论

#### 3. 工作空间表 (workspaces)
```sql
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    workspace_type VARCHAR(20) NOT NULL DEFAULT 'team' 
        CHECK (workspace_type IN ('personal', 'team', 'public')),
    visibility VARCHAR(20) NOT NULL DEFAULT 'private' 
        CHECK (visibility IN ('private', 'internal', 'public')),
    
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(organization_id, slug)
);
```

### 版本管理

#### 1. 文档版本表 (document_versions)
```sql
CREATE TABLE document_versions (
    id TEXT PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    structure_hash VARCHAR(64) NOT NULL,
    semantic_hash VARCHAR(64) NOT NULL,
    author_id INTEGER NOT NULL REFERENCES users(id),
    author_name VARCHAR(100) NOT NULL,
    commit_message TEXT,
    changes_summary JSONB, -- 变更摘要
    content_delta JSONB,   -- 增量变化
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 版本控制相关
    parent_version_id TEXT REFERENCES document_versions(id),
    is_major_version BOOLEAN DEFAULT false,
    is_snapshot BOOLEAN DEFAULT false,
    tags JSONB, -- 版本标签
    metadata JSONB,
    
    UNIQUE(document_id, version_number)
);
```

### 实时协作

#### 1. 协作会话表 (collaboration_sessions)
```sql
CREATE TABLE collaboration_sessions (
    id TEXT PRIMARY KEY,
    document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_name VARCHAR(100) NOT NULL,
    session_type VARCHAR(20) NOT NULL 
        CHECK (session_type IN ('edit', 'view', 'review', 'comment')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    
    -- 注意：光标位置和选择范围不存储在数据库中，只在内存中管理
    user_agent TEXT,
    ip_address INET
);
```

### 审计和监控

#### 1. 审计日志表 (audit_logs)
```sql
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id TEXT NOT NULL,
    action_details JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- 审计相关
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    compliance_tags JSONB,
    retention_until TIMESTAMP
);
```

## 🔧 数据库初始化

### 安装和配置

1. **安装依赖**:
```bash
pnpm install
```

2. **配置环境变量** (`.env`):
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=misonote
DB_USER=postgres
DB_PASSWORD=your_password
```

3. **初始化数据库**:
```bash
# 社区版初始化
pnpm db:init

# 企业版初始化
pnpm db:init:enterprise

# 强制重新初始化
pnpm db:init:force

# 查看数据库状态
pnpm db:status
```

### 默认管理员

初始化后会创建默认管理员账户：
- 用户名: `admin`
- 密码: `admin123` (可通过环境变量 `DEFAULT_ADMIN_PASSWORD` 修改)
- 邮箱: `admin@misonote.com`

## 🔐 权限系统

### 权限层级

```
组织权限 → 空间权限 → 文档权限
    ↓         ↓         ↓
最高优先级  中等优先级  最高精度
```

### 权限检查

```typescript
import { UserPermissionManager, Permission } from '@/lib/db/user-permissions';

// 检查用户权限
const result = await UserPermissionManager.checkPermission(
  userId, 
  Permission.DOCUMENT_EDIT, 
  documentId
);

if (result.allowed) {
  // 执行操作
} else {
  throw new Error(result.reason);
}
```

### 权限装饰器

```typescript
import { requirePermission, Permission } from '@/lib/db/user-permissions';

class DocumentController {
  @requirePermission(Permission.DOCUMENT_EDIT, 'documentId')
  async updateDocument(req: Request, res: Response) {
    // 自动进行权限检查
  }
}
```

## 📈 性能优化

### 索引策略

1. **主键索引**: 所有表都有主键索引
2. **外键索引**: 所有外键都有对应索引
3. **查询索引**: 根据常用查询模式创建复合索引
4. **JSONB索引**: 对JSONB字段的常用查询路径创建GIN索引

### 查询优化

1. **分页查询**: 使用LIMIT和OFFSET进行分页
2. **条件过滤**: 在WHERE子句中使用索引字段
3. **连接优化**: 合理使用JOIN和子查询
4. **缓存策略**: 对频繁查询的数据进行缓存

## 🔄 数据迁移

### 从文件存储迁移到数据库

```bash
# 迁移现有数据
pnpm db:migrate
```

### 版本升级

数据库架构变更通过迁移脚本管理，确保平滑升级。

## 📝 注意事项

1. **数据隐私**: 光标位置等实时数据不持久化存储
2. **许可证安全**: 企业版功能代码保持在私有仓库
3. **向后兼容**: 确保社区版用户正常使用
4. **性能优先**: 实时功能不能影响基础编辑体验
5. **扩展性**: 架构设计考虑未来功能扩展
