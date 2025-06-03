-- 修复数据库表结构以匹配服务代码
-- 这个脚本会重新创建正确的表结构

-- 删除现有的不匹配的表
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS highlights CASCADE;
DROP TABLE IF EXISTS bookmarks CASCADE;

-- 创建 comments 表（匹配 comment-service.ts）
CREATE TABLE comments (
    id VARCHAR(36) PRIMARY KEY,
    document_path VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    author_role VARCHAR(20) DEFAULT 'guest',
    author_avatar VARCHAR(500),
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    parent_id VARCHAR(36),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- 创建 annotations 表（匹配 annotation-service.ts）
CREATE TABLE annotations (
    id VARCHAR(36) PRIMARY KEY,
    document_path VARCHAR(500) NOT NULL,
    annotation_type VARCHAR(20) NOT NULL CHECK (annotation_type IN ('highlight', 'note', 'bookmark')),
    selected_text TEXT NOT NULL,
    comment_text TEXT,
    position_data JSONB NOT NULL,
    author_name VARCHAR(100) NOT NULL,
    author_email VARCHAR(255),
    author_role VARCHAR(20) DEFAULT 'guest',
    likes INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    tags JSONB,
    color VARCHAR(20)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_comments_document_path ON comments(document_path);
CREATE INDEX idx_comments_author ON comments(author_name);
CREATE INDEX idx_comments_created_at ON comments(created_at);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE INDEX idx_annotations_document_path ON annotations(document_path);
CREATE INDEX idx_annotations_type ON annotations(annotation_type);
CREATE INDEX idx_annotations_author ON annotations(author_name);
CREATE INDEX idx_annotations_created_at ON annotations(created_at);

-- 创建更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为表添加更新时间戳触发器
CREATE TRIGGER update_comments_updated_at 
    BEFORE UPDATE ON comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at 
    BEFORE UPDATE ON annotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入一些测试数据
INSERT INTO comments (id, document_path, content, author_name, author_role, is_approved) VALUES
('test-comment-1', '/test-document.md', '这是一个测试评论', '测试用户', 'user', true),
('test-comment-2', '/test-document.md', '这是另一个测试评论', '管理员', 'admin', true);

INSERT INTO annotations (id, document_path, annotation_type, selected_text, comment_text, position_data, author_name, author_role, is_approved, color) VALUES
('test-annotation-1', '/test-document.md', 'highlight', '重要文本', '这段很重要', '{"start": 100, "end": 110}', '测试用户', 'user', true, '#ffeb3b'),
('test-annotation-2', '/test-document.md', 'note', '需要注意', '添加备注', '{"start": 200, "end": 210}', '管理员', 'admin', true, '#4caf50');

-- 显示创建的表
\dt
