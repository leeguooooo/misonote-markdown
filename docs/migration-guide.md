# 文档存储迁移指南

## 📋 概述

本指南将帮助您将现有的文件系统文档迁移到数据库存储，实现更好的性能和协同编辑支持。

## 🎯 迁移目标

- **从**: 文件系统存储 (`docs/` 目录)
- **到**: PostgreSQL 数据库存储
- **优势**: 
  - 更好的性能和缓存
  - 支持协同编辑
  - 版本管理
  - 权限控制
  - 审计日志

## 🔧 迁移步骤

### 1. 准备工作

确保您已经完成了数据库初始化：

```bash
# 初始化数据库（社区版）
pnpm db:init

# 或初始化企业版数据库
pnpm db:init:enterprise
```

### 2. 预览迁移

在实际迁移之前，建议先进行预览：

```bash
# 预览迁移（不会实际修改数据）
pnpm db:migrate:docs:dry

# 详细预览（显示每个文件的处理过程）
pnpm db:migrate:docs:dry --verbose
```

### 3. 执行迁移

确认预览结果无误后，执行实际迁移：

```bash
# 执行迁移
pnpm db:migrate:docs

# 强制迁移（覆盖已存在的文档）
pnpm db:migrate:docs:force

# 详细模式迁移
pnpm db:migrate:docs --verbose
```

### 4. 验证迁移

迁移完成后，验证结果：

```bash
# 验证迁移结果
pnpm db:migrate:docs:verify
```

## 📊 迁移过程详解

### 文档处理流程

1. **扫描文件**: 递归扫描 `docs/` 目录下的所有 `.md` 文件
2. **解析内容**: 解析 frontmatter 和 markdown 内容
3. **提取元数据**: 提取标题、状态、创建时间等信息
4. **写入数据库**: 将文档内容和元数据存储到数据库
5. **版本管理**: 自动创建版本记录

### Frontmatter 处理

迁移过程会自动处理和标准化 frontmatter：

```yaml
---
title: "文档标题"           # 自动提取或使用文件名
status: "published"        # 默认为 published
public: true              # 默认为 true（公开）
created: "2024-01-01T00:00:00.000Z"  # 文件创建时间
updated: "2024-01-01T00:00:00.000Z"  # 文件修改时间
---
```

### 数据库表结构

迁移后的数据存储在以下表中：

- `documents`: 文档基本信息
- `document_contents`: 文档内容和版本
- `collaboration_states`: 协作状态（如果启用）

## 🔍 迁移验证

### 自动验证

```bash
pnpm db:migrate:docs:verify
```

验证内容包括：
- 文件数量对比
- 缺失文件检查
- 额外文件检查

### 手动验证

1. **检查文档列表**:
   ```bash
   curl http://localhost:3001/api/docs
   ```

2. **检查单个文档**:
   ```bash
   curl http://localhost:3001/api/documents/your-doc-path
   ```

3. **检查数据库**:
   ```sql
   SELECT COUNT(*) FROM documents;
   SELECT title, file_path, created_at FROM documents LIMIT 10;
   ```

## ⚠️ 注意事项

### 迁移前备份

**强烈建议在迁移前备份您的文档**：

```bash
# 备份 docs 目录
cp -r docs docs_backup_$(date +%Y%m%d_%H%M%S)

# 备份数据库（如果已有数据）
pg_dump misonote > misonote_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 文件命名规范

- 文件路径将作为文档的唯一标识符
- 确保文件路径不包含特殊字符
- 建议使用英文文件名和路径

### 权限考虑

- 迁移后的文档默认为公开状态
- 可以通过 frontmatter 中的 `public: false` 设置为私有
- 企业版支持更细粒度的权限控制

## 🚨 故障排除

### 常见问题

1. **数据库连接失败**
   ```
   错误: 无法连接到数据库
   解决: 检查数据库配置和连接状态
   ```

2. **文件读取失败**
   ```
   错误: 无法读取文件 xxx.md
   解决: 检查文件权限和编码格式
   ```

3. **内容解析失败**
   ```
   错误: frontmatter 解析失败
   解决: 检查 YAML 格式是否正确
   ```

### 回滚方案

如果迁移出现问题，可以：

1. **清空数据库表**:
   ```sql
   TRUNCATE TABLE document_contents, documents CASCADE;
   ```

2. **恢复备份**:
   ```bash
   rm -rf docs
   mv docs_backup_YYYYMMDD_HHMMSS docs
   ```

3. **重新迁移**:
   ```bash
   pnpm db:migrate:docs:force
   ```

## 📈 迁移后优化

### 性能优化

1. **启用缓存**:
   ```typescript
   // 在配置中启用缓存
   cache: {
     enabled: true,
     ttl: 1800, // 30分钟
     maxSize: 1000
   }
   ```

2. **数据库索引**:
   ```sql
   -- 已自动创建的索引
   CREATE INDEX idx_documents_file_path ON documents(file_path);
   CREATE INDEX idx_document_contents_document_id ON document_contents(document_id);
   ```

### 功能启用

1. **协同编辑**: 迁移后自动支持
2. **版本管理**: 每次编辑自动创建版本
3. **搜索优化**: 数据库全文搜索
4. **权限控制**: 企业版细粒度权限

## 🔄 持续同步

### 开发环境

在开发过程中，如果需要同时支持文件系统和数据库：

```typescript
// 混合模式配置
const config = {
  strategy: 'hybrid',
  database: { enabled: true },
  filesystem: { enabled: true }
};
```

### 生产环境

生产环境建议使用纯数据库模式：

```typescript
// 生产环境配置
const config = {
  strategy: 'database_only',
  database: { enabled: true },
  filesystem: { enabled: false }
};
```

## 📞 支持

如果在迁移过程中遇到问题：

1. 查看日志输出
2. 检查数据库状态
3. 验证文件权限
4. 联系技术支持

---

**迁移完成后，您的文档系统将具备更强的性能和协作能力！** 🎉
