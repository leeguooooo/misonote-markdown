-- Full PostgreSQL schema alignment migration (idempotent)
-- Brings existing databases up to date with current code expectations.

-- Ensure common updated_at trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

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

ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'guest';
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_comment BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_create_annotations BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_edit_documents BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS annotation_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB;

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

ALTER TABLE documents ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workspace_id INTEGER;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content_hash VARCHAR(128);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS annotation_count INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_file_path_unique ON documents(file_path);
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

ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS document_id INTEGER;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS content_type VARCHAR(50);
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS content_data BYTEA;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS content_text TEXT;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS encoding VARCHAR(20) DEFAULT 'utf8';
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE document_contents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_document_contents_document_id ON document_contents(document_id);
CREATE INDEX IF NOT EXISTS idx_document_contents_type_version ON document_contents(document_id, content_type, version_number);

-- ---------------------------------------------------------------------------
-- Collaboration state (for Yjs snapshots)
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

ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS id UUID;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS document_id INTEGER;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS yjs_state BYTEA;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS active_users JSONB;
ALTER TABLE collaboration_states ADD COLUMN IF NOT EXISTS last_update_vector BYTEA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_collaboration_states_document_id_unique ON collaboration_states(document_id);

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.comments') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'comments' AND column_name = 'id' AND data_type <> 'text'
    ) THEN
      ALTER TABLE comments ALTER COLUMN id TYPE TEXT USING id::text;
    END IF;
  END IF;
END $$;

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

ALTER TABLE comments ADD COLUMN IF NOT EXISTS document_path VARCHAR(500);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(100);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_role VARCHAR(20) DEFAULT 'guest';
ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_avatar VARCHAR(500);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_comments_document_path ON comments(document_path);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- ---------------------------------------------------------------------------
-- Annotations (includes highlights/notes/bookmarks)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.annotations') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'annotations' AND column_name = 'id' AND data_type <> 'text'
    ) THEN
      ALTER TABLE annotations ALTER COLUMN id TYPE TEXT USING id::text;
    END IF;
  END IF;
END $$;

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

ALTER TABLE annotations ADD COLUMN IF NOT EXISTS document_path VARCHAR(500);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS annotation_type VARCHAR(20);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS selected_text TEXT;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS comment_text TEXT;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS position_data JSONB;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS author_name VARCHAR(100);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS author_role VARCHAR(20) DEFAULT 'guest';
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT true;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS color VARCHAR(20) DEFAULT '#ffeb3b';
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE annotations ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE INDEX IF NOT EXISTS idx_annotations_document_path ON annotations(document_path);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);

-- ---------------------------------------------------------------------------
-- API keys
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.api_keys') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'api_keys' AND column_name = 'id' AND data_type <> 'text'
    ) THEN
      ALTER TABLE api_keys ALTER COLUMN id TYPE TEXT USING id::text;
    END IF;
  END IF;
END $$;

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

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS user_id INTEGER;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_hash VARCHAR(255);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS key_prefix VARCHAR(32);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS rate_limit INTEGER DEFAULT 1000;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_key_prefix_unique ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

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

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS key VARCHAR(100);
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'string';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  -- Migrate from legacy column names if present
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'setting_key'
  ) THEN
    EXECUTE 'UPDATE system_settings SET key = setting_key WHERE key IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'setting_value'
  ) THEN
    EXECUTE 'UPDATE system_settings SET value = setting_value WHERE value IS NULL';
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'system_settings' AND column_name = 'setting_type'
  ) THEN
    EXECUTE 'UPDATE system_settings SET type = setting_type WHERE type IS NULL';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key_unique ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_public ON system_settings(is_public);

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

ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS token_hash TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS session_token VARCHAR(255);
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- ---------------------------------------------------------------------------
-- Migration history
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.migration_history') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'migration_history' AND column_name = 'id' AND data_type <> 'text'
    ) THEN
      ALTER TABLE migration_history ALTER COLUMN id TYPE TEXT USING id::text;
    END IF;
  END IF;
END $$;

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

ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS migration_name VARCHAR(255);
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS migration_version VARCHAR(50);
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS target_type VARCHAR(50);
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS records_migrated INTEGER DEFAULT 0;
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS migration_status VARCHAR(20);
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS source_info TEXT;
ALTER TABLE migration_history ADD COLUMN IF NOT EXISTS migration_log TEXT;

CREATE INDEX IF NOT EXISTS idx_migration_history_name_version ON migration_history(migration_name, migration_version);

-- ---------------------------------------------------------------------------
-- Workspaces & members (baseline for enterprise)
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

ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);

CREATE TABLE IF NOT EXISTS workspace_members (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(workspace_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Updated-at triggers (create only if missing)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF to_regclass('public.documents') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_documents_updated_at
      BEFORE UPDATE ON documents
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF to_regclass('public.comments') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_comments_updated_at'
  ) THEN
    CREATE TRIGGER update_comments_updated_at
      BEFORE UPDATE ON comments
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF to_regclass('public.annotations') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_annotations_updated_at'
  ) THEN
    CREATE TRIGGER update_annotations_updated_at
      BEFORE UPDATE ON annotations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF to_regclass('public.api_keys') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_api_keys_updated_at'
  ) THEN
    CREATE TRIGGER update_api_keys_updated_at
      BEFORE UPDATE ON api_keys
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF to_regclass('public.system_settings') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_system_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_system_settings_updated_at
      BEFORE UPDATE ON system_settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF to_regclass('public.collaboration_states') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_collaboration_states_updated_at'
  ) THEN
    CREATE TRIGGER update_collaboration_states_updated_at
      BEFORE UPDATE ON collaboration_states
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
