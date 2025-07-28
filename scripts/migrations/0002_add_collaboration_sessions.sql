-- 协作会话表
CREATE TABLE IF NOT EXISTS collaboration_sessions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(255) NOT NULL,
    user_id INTEGER NOT NULL,
    cursor_position INTEGER,
    selection_start INTEGER,
    selection_end INTEGER,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Yjs 文档更新表（用于持久化）
CREATE TABLE IF NOT EXISTS yjs_updates (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) NOT NULL,
    update_data BYTEA NOT NULL,
    client_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_collab_sessions_document_id ON collaboration_sessions(document_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_user_id ON collaboration_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_active ON collaboration_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_collab_sessions_heartbeat ON collaboration_sessions(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_yjs_updates_document_id ON yjs_updates(document_id);
CREATE INDEX IF NOT EXISTS idx_yjs_updates_created_at ON yjs_updates(created_at);

-- 清理旧会话的函数
CREATE OR REPLACE FUNCTION cleanup_inactive_sessions()
RETURNS void AS $$
BEGIN
    UPDATE collaboration_sessions
    SET is_active = false
    WHERE last_heartbeat < NOW() - INTERVAL '5 minutes'
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 定期清理旧的 Yjs 更新（保留最近7天）
CREATE OR REPLACE FUNCTION cleanup_old_yjs_updates()
RETURNS void AS $$
BEGIN
    DELETE FROM yjs_updates
    WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;