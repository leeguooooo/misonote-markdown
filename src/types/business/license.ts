/**
 * 许可证相关类型定义
 */

export interface License {
  id: string;
  type: 'community' | 'professional' | 'enterprise';
  organization: string;
  email: string;
  maxUsers: number;
  features: string[];
  issuedAt: Date;
  expiresAt: Date | null;
  signature: string;
  metadata?: Record<string, any>;
}

export interface LicenseValidation {
  valid: boolean;
  license?: License;
  error?: string;
  warnings?: string[];
}

export enum LicenseType {
  COMMUNITY = 'community',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}
