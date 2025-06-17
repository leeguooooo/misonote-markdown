'use client';

import React, { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/Badge';
import {
  Star,
  Crown,
  CheckCircle,
  Users,
  Shield,
  Mail,
  Building,
  CreditCard
} from 'lucide-react';

const PurchasePageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || 'professional');
  const [formData, setFormData] = useState({
    organization: '',
    email: '',
    users: '',
    requirements: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const licenseTypes = {
    professional: {
      name: '专业版',
      icon: Star,
      price: 299,
      period: '月',
      maxUsers: 50,
      features: [
        '多用户协作',
        '高级权限管理',
        '云端同步',
        '优先技术支持',
        '数据导出',
        '自定义主题'
      ],
      description: '适合中小团队，提供专业级功能和支持'
    },
    enterprise: {
      name: '企业版',
      icon: Crown,
      price: 999,
      period: '月',
      maxUsers: -1,
      features: [
        '无限用户',
        '企业级权限管理',
        '单点登录 (SSO)',
        '审计日志',
        'API访问',
        '专属客户经理',
        '定制开发',
        '本地部署支持',
        '7x24技术支持'
      ],
      description: '为大型企业提供完整的解决方案'
    }
  };

  const currentLicense = licenseTypes[selectedType as keyof typeof licenseTypes];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 模拟提交购买申请
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 这里应该调用实际的购买API
      console.log('购买申请:', {
        licenseType: selectedType,
        ...formData
      });

      setSubmitted(true);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">申请已提交</h1>
            <p className="text-gray-600 mb-6">
              我们已收到您的{currentLicense.name}购买申请，我们的销售团队将在24小时内与您联系。
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-2">下一步：</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 销售团队将通过邮件联系您</li>
                <li>• 确认具体需求和配置</li>
                <li>• 提供正式报价和合同</li>
                <li>• 完成付款后立即发放许可证</li>
              </ul>
            </div>
            <Button onClick={() => window.close()}>
              关闭页面
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">购买 Misonote 许可证</h1>
        <p className="text-gray-600">选择适合您团队的许可证类型</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 许可证选择 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">选择许可证类型</h2>

          {Object.entries(licenseTypes).map(([type, config]) => {
            const IconComp = config.icon;
            const isSelected = selectedType === type;

            return (
              <div
                key={type}
                className="cursor-pointer transition-all"
                onClick={() => setSelectedType(type)}
              >
                <Card className={isSelected ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300'}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComp className="h-6 w-6" />
                        <div>
                          <h3 className="font-semibold text-lg">{config.name}</h3>
                          <p className="text-sm text-gray-600">{config.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">¥{config.price}</div>
                        <div className="text-sm text-gray-500">/{config.period}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {config.maxUsers === -1 ? '无限用户' : `最多${config.maxUsers}用户`}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">包含功能：</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {config.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                        {config.features.length > 4 && (
                          <div className="text-sm text-gray-500">
                            +{config.features.length - 4} 更多功能...
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* 购买表单 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                购买申请
              </CardTitle>
              <CardDescription>
                填写以下信息，我们的销售团队将与您联系
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="organization">
                    <Building className="h-4 w-4 inline mr-1" />
                    组织名称 *
                  </Label>
                  <Input
                    id="organization"
                    required
                    placeholder="请输入您的公司或组织名称"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-1" />
                    联系邮箱 *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="请输入您的邮箱地址"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="users">
                    <Users className="h-4 w-4 inline mr-1" />
                    预计用户数
                  </Label>
                  <Input
                    id="users"
                    type="number"
                    placeholder="请输入预计的用户数量"
                    value={formData.users}
                    onChange={(e) => handleInputChange('users', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">特殊需求</Label>
                  <Textarea
                    id="requirements"
                    placeholder="请描述您的特殊需求或问题（可选）"
                    value={formData.requirements}
                    onChange={(e) => handleInputChange('requirements', e.target.value)}
                    rows={3}
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    我们承诺保护您的隐私信息，仅用于许可证购买和服务提供。
                  </AlertDescription>
                </Alert>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? '提交中...' : `申请购买 ${currentLicense.name}`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 联系信息 */}
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">需要帮助？</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>📧 邮箱: sales@misonote.com</p>
                <p>📞 电话: 400-123-4567</p>
                <p>💬 微信: misonote-sales</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PurchasePage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    }>
      <PurchasePageContent />
    </Suspense>
  );
};

export default PurchasePage;
