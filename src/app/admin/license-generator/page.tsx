'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle,
  Copy,
  Download,
  Key,
  Mail,
  Shield,
  Users
} from 'lucide-react';
import React, { useState } from 'react';

const LicenseGeneratorPage: React.FC = () => {
  const [formData, setFormData] = useState({
    type: 'professional',
    organization: '',
    email: '',
    maxUsers: '50',
    duration: '12', // 月数
    features: [] as string[],
    notes: ''
  });

  const [generatedLicense, setGeneratedLicense] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const licenseTypes = {
    professional: {
      name: '专业版',
      defaultUsers: 50,
      defaultFeatures: ['multi_user', 'advanced_permissions', 'cloud_sync', 'priority_support']
    },
    enterprise: {
      name: '企业版',
      defaultUsers: -1,
      defaultFeatures: ['multi_user', 'advanced_permissions', 'cloud_sync', 'sso', 'audit_logs', 'api_access', 'custom_development']
    }
  };

  const availableFeatures = {
    'multi_user': '多用户协作',
    'advanced_permissions': '高级权限管理',
    'cloud_sync': '云端同步',
    'priority_support': '优先技术支持',
    'sso': '单点登录',
    'audit_logs': '审计日志',
    'api_access': 'API访问',
    'custom_development': '定制开发',
    'data_export': '数据导出',
    'custom_themes': '自定义主题'
  };

  const generateLicense = async () => {
    if (!formData.organization || !formData.email) {
      setError('请填写组织名称和邮箱');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // 生成许可证数据
      const licenseData = {
        id: `${formData.type}-${Date.now()}`,
        type: formData.type,
        organization: formData.organization,
        email: formData.email,
        maxUsers: formData.maxUsers === '-1' ? -1 : parseInt(formData.maxUsers),
        features: formData.features.length > 0 ? formData.features : licenseTypes[formData.type as keyof typeof licenseTypes].defaultFeatures,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + parseInt(formData.duration) * 30 * 24 * 60 * 60 * 1000).toISOString(),
        signature: `admin_generated_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        metadata: {
          generatedBy: 'admin',
          notes: formData.notes,
          generatedAt: new Date().toISOString()
        }
      };

      // 编码许可证
      const licenseKey = 'misonote_' + Buffer.from(JSON.stringify(licenseData)).toString('base64');
      setGeneratedLicense(licenseKey);

    } catch (err) {
      setError('生成许可证失败，请重试');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedLicense) {
      await navigator.clipboard.writeText(generatedLicense);
      // 这里可以添加一个toast提示
    }
  };

  const downloadLicense = () => {
    if (!generatedLicense) return;

    const licenseInfo = {
      licenseKey: generatedLicense,
      organization: formData.organization,
      email: formData.email,
      type: formData.type,
      maxUsers: formData.maxUsers,
      expiresAt: new Date(Date.now() + parseInt(formData.duration) * 30 * 24 * 60 * 60 * 1000).toISOString(),
      generatedAt: new Date().toISOString(),
      notes: formData.notes
    };

    const blob = new Blob([JSON.stringify(licenseInfo, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `misonote-license-${formData.organization}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendByEmail = () => {
    if (!generatedLicense) return;

    const subject = `Misonote ${licenseTypes[formData.type as keyof typeof licenseTypes].name} 许可证`;
    const body = `
亲爱的 ${formData.organization} 用户，

感谢您购买 Misonote ${licenseTypes[formData.type as keyof typeof licenseTypes].name}！

您的许可证信息：
- 许可证类型: ${licenseTypes[formData.type as keyof typeof licenseTypes].name}
- 最大用户数: ${formData.maxUsers === '-1' ? '无限制' : formData.maxUsers}
- 有效期: ${formData.duration} 个月
- 到期时间: ${new Date(Date.now() + parseInt(formData.duration) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}

许可证密钥：
${generatedLicense}

使用方法：
1. 登录 Misonote 系统
2. 进入许可证管理页面
3. 输入上述许可证密钥
4. 点击验证即可激活

如有任何问题，请联系我们的技术支持。

祝您使用愉快！
Misonote 团队
    `.trim();

    const mailtoUrl = `mailto:${formData.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleTypeChange = (type: string) => {
    const typeConfig = licenseTypes[type as keyof typeof licenseTypes];
    setFormData(prev => ({
      ...prev,
      type,
      maxUsers: typeConfig.defaultUsers.toString(),
      features: typeConfig.defaultFeatures
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">许可证生成器</h1>
        <p className="text-gray-600">为客户生成和管理 Misonote 许可证</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 生成表单 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                许可证配置
              </CardTitle>
              <CardDescription>
                配置许可证的基本信息和权限
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 许可证类型 */}
              <div className="space-y-2">
                <Label>许可证类型</Label>
                <Select value={formData.type} onValueChange={handleTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">专业版</SelectItem>
                    <SelectItem value="enterprise">企业版</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 组织信息 */}
              <div className="space-y-2">
                <Label htmlFor="organization">
                  <Building className="h-4 w-4 inline mr-1" />
                  组织名称 *
                </Label>
                <Input
                  id="organization"
                  required
                  placeholder="客户的公司或组织名称"
                  value={formData.organization}
                  onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                />
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="h-4 w-4 inline mr-1" />
                  联系邮箱 *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="客户的邮箱地址"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              {/* 用户数 */}
              <div className="space-y-2">
                <Label htmlFor="maxUsers">
                  <Users className="h-4 w-4 inline mr-1" />
                  最大用户数
                </Label>
                <Input
                  id="maxUsers"
                  type="number"
                  placeholder="最大用户数，-1表示无限制"
                  value={formData.maxUsers}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
                />
              </div>

              {/* 有效期 */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  有效期（月）
                </Label>
                <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1个月</SelectItem>
                    <SelectItem value="3">3个月</SelectItem>
                    <SelectItem value="6">6个月</SelectItem>
                    <SelectItem value="12">12个月</SelectItem>
                    <SelectItem value="24">24个月</SelectItem>
                    <SelectItem value="36">36个月</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 功能选择 */}
              <div className="space-y-2">
                <Label>功能权限</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(availableFeatures).map(([key, name]) => {
                    const isSelected = formData.features.includes(key);
                    return (
                      <div
                        key={key}
                        className="cursor-pointer"
                        onClick={() => handleFeatureToggle(key)}
                      >
                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className="justify-center p-2 w-full"
                        >
                          {isSelected && <CheckCircle className="h-3 w-3 mr-1" />}
                          {name}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="notes">备注</Label>
                <Textarea
                  id="notes"
                  placeholder="内部备注信息（可选）"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={generateLicense}
                disabled={generating}
                className="w-full"
              >
                {generating ? '生成中...' : '生成许可证'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 生成结果 */}
        <div className="space-y-6">
          {generatedLicense && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  生成的许可证
                </CardTitle>
                <CardDescription>
                  许可证已生成，请妥善保管并发送给客户
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 许可证密钥 */}
                <div className="space-y-2">
                  <Label>许可证密钥</Label>
                  <div className="relative">
                    <Textarea
                      value={generatedLicense}
                      readOnly
                      className="font-mono text-xs"
                      rows={4}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={copyToClipboard}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* 许可证信息摘要 */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold">许可证信息</h4>
                  <div className="text-sm space-y-1">
                    <p><strong>类型:</strong> {licenseTypes[formData.type as keyof typeof licenseTypes].name}</p>
                    <p><strong>组织:</strong> {formData.organization}</p>
                    <p><strong>邮箱:</strong> {formData.email}</p>
                    <p><strong>用户数:</strong> {formData.maxUsers === '-1' ? '无限制' : formData.maxUsers}</p>
                    <p><strong>有效期:</strong> {formData.duration} 个月</p>
                    <p><strong>到期时间:</strong> {new Date(Date.now() + parseInt(formData.duration) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <Copy className="h-4 w-4 mr-1" />
                    复制
                  </Button>
                  <Button onClick={downloadLicense} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                  <Button onClick={sendByEmail} variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    邮件发送
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 使用说明 */}
          <Card>
            <CardHeader>
              <CardTitle>使用说明</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>1. 生成许可证:</strong> 填写客户信息并点击生成</p>
              <p><strong>2. 发送给客户:</strong> 通过邮件或其他方式发送许可证密钥</p>
              <p><strong>3. 客户激活:</strong> 客户在系统中输入许可证密钥激活</p>
              <p><strong>4. 验证状态:</strong> 系统会自动验证许可证的有效性</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LicenseGeneratorPage;
