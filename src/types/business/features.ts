/**
 * 功能标志和权限定义
 */

export enum FeatureFlag {
  // 用户管理
  MULTI_USER = 'multi_user',
  ADVANCED_PERMISSIONS = 'advanced_permissions',
  SSO_INTEGRATION = 'sso_integration',
  
  // 数据管理
  ADVANCED_BACKUP = 'advanced_backup',
  DATA_MIGRATION = 'data_migration',
  AUDIT_LOGS = 'audit_logs',
  
  // 集成功能
  WEBHOOK_INTEGRATION = 'webhook_integration',
  API_RATE_LIMITING = 'api_rate_limiting',
  CUSTOM_PLUGINS = 'custom_plugins',
  
  // 企业功能
  ENTERPRISE_SUPPORT = 'enterprise_support',
  CUSTOM_BRANDING = 'custom_branding',
  COMPLIANCE_TOOLS = 'compliance_tools'
}

export interface FeatureRequirement {
  license: string[];
  description: string;
  upgradeUrl?: string;
}
