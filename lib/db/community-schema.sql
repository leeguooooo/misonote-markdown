-- 社区版数据库表结构
-- 支持普通用户注册、评论、标注等功能
-- 管理员可以编辑文档

-- 系统设置表
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT false, -- 是否对前端公开
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 社区版用户表（支持普通用户注册 + 单管理员）
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255), -- 可为空，支持匿名用户
    display_name VARCHAR(255),
    avatar_url VARCHAR(500),

    -- 用户类型和状态
    user_type VARCHAR(20) NOT NULL DEFAULT 'guest' CHECK (user_type IN ('admin', 'user', 'guest')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'banned', 'pending')),

    -- 权限控制
    can_comment BOOLEAN DEFAULT true,
    can_create_annotations BOOLEAN DEFAULT true,
    can_edit_documents BOOLEAN DEFAULT false, -- 只有管理员可以编辑

    -- 社区功能统计
    comment_count INTEGER DEFAULT 0,
    annotation_count INTEGER DEFAULT 0,
    last_login_at TIMESTAMP,
    email_verified BOOLEAN DEFAULT false,

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 元数据
    metadata JSONB -- 存储额外的用户偏好设置
);

-- API 密钥表
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    last_used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 文档表
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    file_path VARCHAR(500) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    workspace_id INTEGER, -- 为企业版预留

    -- 文档状态
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    is_public BOOLEAN DEFAULT true,

    -- 统计信息
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    annotation_count INTEGER DEFAULT 0,

    -- 时间戳
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 元数据
    metadata JSONB
);

-- 评论表（基于文档路径，不依赖文档ID）
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(36) PRIMARY KEY,
    document_path VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    author_role VARCHAR(20) DEFAULT 'guest' CHECK (author_role IN ('admin', 'user', 'guest')),
    author_avatar VARCHAR(500),

    -- 评论功能
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true, -- 社区版默认自动通过
    is_deleted BOOLEAN DEFAULT false,
    parent_id VARCHAR(36), -- 支持回复

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 元数据
    metadata JSONB
);

-- 标注表（统一管理高亮、笔记、书签）
CREATE TABLE IF NOT EXISTS annotations (
    id VARCHAR(36) PRIMARY KEY,
    document_path VARCHAR(500) NOT NULL,
    annotation_type VARCHAR(20) NOT NULL CHECK (annotation_type IN ('highlight', 'note', 'bookmark')),
    selected_text TEXT NOT NULL,
    comment_text TEXT,
    position_data JSONB NOT NULL, -- 存储位置信息

    -- 作者信息
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    author_role VARCHAR(20) DEFAULT 'guest' CHECK (author_role IN ('admin', 'user', 'guest')),

    -- 标注功能
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT true, -- 社区版默认自动通过
    is_deleted BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false, -- 用于笔记类型

    -- 样式和分类
    color VARCHAR(20) DEFAULT '#ffeb3b',
    tags JSONB, -- 标签数组

    -- 时间戳
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 元数据
    metadata JSONB
);

-- 用户会话表
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 数据迁移历史表
CREATE TABLE IF NOT EXISTS migration_history (
    id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    migration_type VARCHAR(50) NOT NULL, -- 'schema', 'data', 'cleanup'
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    metadata JSONB
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE INDEX IF NOT EXISTS idx_documents_file_path ON documents(file_path);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

CREATE INDEX IF NOT EXISTS idx_comments_document_path ON comments(document_path);
CREATE INDEX IF NOT EXISTS idx_comments_author_name ON comments(author_name);
CREATE INDEX IF NOT EXISTS idx_comments_author_role ON comments(author_role);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

CREATE INDEX IF NOT EXISTS idx_annotations_document_path ON annotations(document_path);
CREATE INDEX IF NOT EXISTS idx_annotations_type ON annotations(annotation_type);
CREATE INDEX IF NOT EXISTS idx_annotations_author_name ON annotations(author_name);
CREATE INDEX IF NOT EXISTS idx_annotations_author_role ON annotations(author_role);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);
CREATE INDEX IF NOT EXISTS idx_annotations_is_approved ON annotations(is_approved);
CREATE INDEX IF NOT EXISTS idx_annotations_is_deleted ON annotations(is_deleted);
CREATE INDEX IF NOT EXISTS idx_annotations_is_resolved ON annotations(is_resolved);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

CREATE INDEX IF NOT EXISTS idx_migration_history_name ON migration_history(migration_name);
CREATE INDEX IF NOT EXISTS idx_migration_history_status ON migration_history(status);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at
    BEFORE UPDATE ON annotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建统计更新触发器
CREATE OR REPLACE FUNCTION update_user_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET comment_count = comment_count + 1
        WHERE username = NEW.author_name;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET comment_count = GREATEST(comment_count - 1, 0)
        WHERE username = OLD.author_name;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_user_annotation_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET annotation_count = annotation_count + 1
        WHERE username = NEW.author_name;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET annotation_count = GREATEST(annotation_count - 1, 0)
        WHERE username = OLD.author_name;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 创建统计触发器
CREATE TRIGGER update_user_comment_count_trigger
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_user_comment_count();

CREATE TRIGGER update_user_annotation_count_trigger
    AFTER INSERT OR DELETE ON annotations
    FOR EACH ROW EXECUTE FUNCTION update_user_annotation_count();

-- 确保只有一个管理员的约束
CREATE OR REPLACE FUNCTION check_single_admin()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.user_type = 'admin' THEN
        IF EXISTS (SELECT 1 FROM users WHERE user_type = 'admin' AND id != NEW.id) THEN
            RAISE EXCEPTION '系统只能有一个管理员用户';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_single_admin_trigger
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION check_single_admin();

-- 插入默认系统设置
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'MisoNote', 'string', '网站名称', true),
('site_description', '智能文档协作平台', 'string', '网站描述', true),
('allow_registration', 'true', 'boolean', '是否允许用户注册', false),
('allow_anonymous_comments', 'true', 'boolean', '是否允许匿名评论', false),
('max_file_size', '10485760', 'number', '最大文件大小（字节）', false),
('supported_file_types', '["md", "txt", "json"]', 'json', '支持的文件类型', false)
ON CONFLICT (setting_key) DO NOTHING;
