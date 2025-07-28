-- 组织表
CREATE TABLE IF NOT EXISTS organizations (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- 为组织添加工作区关联
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS organization_id VARCHAR(36);
ALTER TABLE workspaces ADD CONSTRAINT fk_workspace_organization 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- 用户组织角色表
CREATE TABLE IF NOT EXISTS user_organization_roles (
    id VARCHAR(36) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    organization_id VARCHAR(36) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    UNIQUE(user_id, organization_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user_id ON user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org_id ON user_organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_role ON user_organization_roles(role);
CREATE INDEX IF NOT EXISTS idx_workspaces_organization_id ON workspaces(organization_id);

-- 添加更新时间触发器
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organization_roles_updated_at 
    BEFORE UPDATE ON user_organization_roles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();