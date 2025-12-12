-- PostgreSQL schema (community + enterprise baseline)
-- Safe to run multiple times (uses IF NOT EXISTS / guarded triggers).

-- 更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ---------------------------------------------------------------------------
-- System settings
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  type VARCHAR(20) DEFAULT 'string' CHECK (type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key_unique ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  display_name VARCHAR(255),
  avatar_url VARCHAR(500),
  user_type VARCHAR(20) NOT NULL DEFAULT 'guest' CHECK (user_type IN ('admin', 'user', 'guest')),
  account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'banned', 'pending')),
  can_comment BOOLEAN DEFAULT true,
  can_create_annotations BOOLEAN DEFAULT true,
  can_edit_documents BOOLEAN DEFAULT false,
  comment_count INTEGER DEFAULT 0,
  annotation_count INTEGER DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON users(account_status);

-- ---------------------------------------------------------------------------
-- Workspaces & members (enterprise baseline)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(36),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- ---------------------------------------------------------------------------
-- Organizations (shared by community/enterprise)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB DEFAULT '{}'
);

-- Ensure workspaces.organization_id FK exists only once
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_workspace_organization'
  ) THEN
    ALTER TABLE workspaces
      ADD CONSTRAINT fk_workspace_organization
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_organization_roles (
  id VARCHAR(36) PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id VARCHAR(36) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user_id ON user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org_id ON user_organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_organization_id ON workspaces(organization_id);

-- ---------------------------------------------------------------------------
-- Documents & contents
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) UNIQUE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  workspace_id INTEGER,
  content_hash VARCHAR(128),
  file_size INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  is_public BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  annotation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_file_path_unique ON documents(file_path);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_is_public ON documents(is_public);
CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at);

CREATE TABLE IF NOT EXISTS document_contents (
  id UUID PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL,
  content_data BYTEA,
  content_text TEXT,
  encoding VARCHAR(20) DEFAULT 'utf8',
  version_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  metadata JSONB DEFAULT '{}',
  UNIQUE (document_id, content_type, version_number)
);

CREATE INDEX IF NOT EXISTS idx_document_contents_document_id ON document_contents(document_id);
CREATE INDEX IF NOT EXISTS idx_document_contents_type_version ON document_contents(document_id, content_type, version_number);

-- ---------------------------------------------------------------------------
-- Collaboration state + sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS collaboration_states (
  id UUID PRIMARY KEY,
  document_id INTEGER UNIQUE NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  yjs_state BYTEA NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  active_users JSONB,
  last_update_vector BYTEA
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_collaboration_states_document_id_unique ON collaboration_states(document_id);

CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id VARCHAR(36) PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cursor_position INTEGER,
  selection_start INTEGER,
  selection_end INTEGER,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS yjs_updates (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(255) NOT NULL,
  update_data BYTEA NOT NULL,
  client_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collab_sessions_document_id ON collaboration_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_user_id ON collaboration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_active ON collaboration_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_heartbeat ON collaboration_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_yjs_updates_document_id ON yjs_updates(document_id);
CREATE INDEX IF NOT EXISTS idx_yjs_updates_created_at ON yjs_updates(created_at);

CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
  UPDATE collaboration_sessions
  SET is_active = false
  WHERE last_heartbeat < NOW() - INTERVAL '5 minutes'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_old_yjs_updates()
RETURNS void AS $$
BEGIN
  DELETE FROM yjs_updates
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY,
  document_path VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255),
  author_role VARCHAR(20) DEFAULT 'guest' CHECK (author_role IN ('admin', 'user', 'guest')),
  author_avatar VARCHAR(500),
  likes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  parent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_comments_document_path ON comments(document_path);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ---------------------------------------------------------------------------
-- Annotations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY,
  document_path VARCHAR(500) NOT NULL,
  annotation_type VARCHAR(20) NOT NULL CHECK (annotation_type IN ('highlight', 'note', 'bookmark')),
  selected_text TEXT NOT NULL,
  comment_text TEXT,
  position_data JSONB NOT NULL,
  author_name VARCHAR(100) NOT NULL,
  author_email VARCHAR(255),
  author_role VARCHAR(20) DEFAULT 'guest' CHECK (author_role IN ('admin', 'user', 'guest')),
  likes INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  color VARCHAR(20) DEFAULT '#ffeb3b',
  tags JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_annotations_document_path ON annotations(document_path);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);

-- ---------------------------------------------------------------------------
-- API keys
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(32) NOT NULL,
  permissions TEXT DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  rate_limit INTEGER DEFAULT 1000,
  created_by VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_prefix_unique ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- ---------------------------------------------------------------------------
-- User sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT,
  session_token VARCHAR(255),
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ---------------------------------------------------------------------------
-- Migration history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS migration_history (
  id TEXT PRIMARY KEY,
  migration_name VARCHAR(255) NOT NULL,
  migration_version VARCHAR(50) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  records_migrated INTEGER DEFAULT 0,
  migration_status VARCHAR(20) NOT NULL CHECK (migration_status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  source_info TEXT,
  migration_log TEXT
);

CREATE INDEX IF NOT EXISTS idx_migration_history_name_version ON migration_history(migration_name, migration_version);

-- ---------------------------------------------------------------------------
-- Trigger setup (guarded)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at') THEN
    CREATE TRIGGER update_documents_updated_at
      BEFORE UPDATE ON documents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at') THEN
    CREATE TRIGGER update_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_annotations_updated_at') THEN
    CREATE TRIGGER update_annotations_updated_at
      BEFORE UPDATE ON annotations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_api_keys_updated_at') THEN
    CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON api_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at') THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON system_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_organizations_updated_at') THEN
    CREATE TRIGGER update_organizations_updated_at
      BEFORE UPDATE ON organizations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_organization_roles_updated_at') THEN
    CREATE TRIGGER update_user_organization_roles_updated_at
      BEFORE UPDATE ON user_organization_roles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- 统计更新触发器（仅在存在时创建）
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
$$ LANGUAGE 'plpgsql';

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
$$ LANGUAGE 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_comment_count_trigger') THEN
    CREATE TRIGGER update_user_comment_count_trigger
      AFTER INSERT OR DELETE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_user_comment_count();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_annotation_count_trigger') THEN
    CREATE TRIGGER update_user_annotation_count_trigger
      AFTER INSERT OR DELETE ON annotations
      FOR EACH ROW EXECUTE FUNCTION update_user_annotation_count();
  END IF;
END $$;

-- 单管理员约束
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
$$ LANGUAGE 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'check_single_admin_trigger') THEN
    CREATE TRIGGER check_single_admin_trigger
      BEFORE INSERT OR UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION check_single_admin();
  END IF;
END $$;

-- 默认系统设置
INSERT INTO system_settings (key, value, type, description, is_public) VALUES
  ('site_name', 'MisoNote', 'string', '网站名称', true),
  ('site_description', '智能文档协作平台', 'string', '网站描述', true),
  ('allow_registration', 'true', 'boolean', '是否允许用户注册', false),
  ('allow_anonymous_comments', 'true', 'boolean', '是否允许匿名评论', false),
  ('max_file_size', '10485760', 'number', '最大文件大小（字节）', false),
  ('supported_file_types', '["md", "txt", "json"]', 'json', '支持的文件类型', false)
ON CONFLICT (key) DO NOTHING;

-- 全文检索索引（新架构）
DO $$
BEGIN
  IF to_regclass('public.documents') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_documents_title_fts
      ON documents
      USING GIN (to_tsvector('simple', COALESCE(title, '')))
    $sql$;
  END IF;

  IF to_regclass('public.document_contents') IS NOT NULL THEN
    EXECUTE $sql$
      CREATE INDEX IF NOT EXISTS idx_document_contents_fts
      ON document_contents
      USING GIN (to_tsvector('simple', COALESCE(content_text, '')))
      WHERE content_type = 'markdown'
    $sql$;
  END IF;
END $$;
