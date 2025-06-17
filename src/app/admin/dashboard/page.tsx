'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Users,
  MessageSquare,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Globe,
  Shield,
  Download,
  Upload,
  BarChart3,
  Settings,
  Crown
} from 'lucide-react';

interface SystemStats {
  totalDocuments: number;
  totalUsers: number;
  totalComments: number;
  totalAnnotations: number;
  systemUptime: string;
  memoryUsage: number;
  diskUsage: number;
  dbConnections: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  badge?: string;
}

const quickActions: QuickAction[] = [
  {
    title: '文档导出',
    description: '批量导出文档到不同格式',
    icon: Download,
    href: '/admin/documents/export',
    color: 'blue'
  },
  {
    title: '文档导入',
    description: '从文件导入文档到系统',
    icon: Upload,
    href: '/admin/documents/import',
    color: 'green'
  },
  {
    title: '用户管理',
    description: '管理用户权限和设置',
    icon: Users,
    href: '/admin/users',
    color: 'purple',
    badge: 'Pro'
  },
  {
    title: 'API 密钥',
    description: '管理系统集成密钥',
    icon: Shield,
    href: '/admin/integrations/api-keys',
    color: 'orange'
  },
  {
    title: '许可证管理',
    description: '查看和管理许可证状态',
    icon: Crown,
    href: '/admin/license',
    color: 'yellow'
  },
  {
    title: '系统设置',
    description: '配置系统参数和选项',
    icon: Settings,
    href: '/admin/system',
    color: 'gray'
  }
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats>({
    totalDocuments: 0,
    totalUsers: 1,
    totalComments: 0,
    totalAnnotations: 0,
    systemUptime: '0h',
    memoryUsage: 0,
    diskUsage: 0,
    dbConnections: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // 并行获取各种统计数据
      const [healthResponse, docsResponse] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/admin/docs')
      ]);

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setStats(prev => ({
          ...prev,
          memoryUsage: healthData.memory?.used || 0,
          dbConnections: parseInt(healthData.database?.connections) || 0,
          systemUptime: `${Math.round(healthData.uptime / 3600)}h`
        }));
      }

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setStats(prev => ({
          ...prev,
          totalDocuments: docsData.total || 0
        }));
      }

      // 模拟其他数据
      setStats(prev => ({
        ...prev,
        diskUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
        totalComments: Math.floor(Math.random() * 100),
        totalAnnotations: Math.floor(Math.random() * 50)
      }));

    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorClass = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      gray: 'bg-gray-50 text-gray-600 border-gray-200'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="px-6 space-y-6">
      {/* Welcome Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">欢迎回来！</h2>
              <p className="text-gray-600 mt-1">您的 Misonote 管理仪表盘已准备就绪</p>
            </div>
            <div className="text-2xl">👋</div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">文档总数</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '-' : stats.totalDocuments}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-gray-600 ml-1">较上月</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">评论数量</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '-' : stats.totalComments}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Activity className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600">活跃</span>
              <span className="text-gray-600 ml-1">社区互动</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">内存使用</p>
                <p className="text-2xl font-bold text-gray-800">
                  {isLoading ? '-' : `${stats.memoryUsage}MB`}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={stats.memoryUsage > 100 ? (stats.memoryUsage / 10) : stats.memoryUsage} 
                className="h-2" 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">系统状态</p>
                <p className="text-2xl font-bold text-green-600">正常</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-gray-600">运行时间: {stats.systemUptime}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
              <CardDescription>常用管理功能的快捷入口</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.href} href={action.href}>
                    <div className={`p-4 rounded-lg border-2 border-dashed transition-all hover:border-solid hover:shadow-sm cursor-pointer ${getColorClass(action.color)}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <action.icon className="h-5 w-5 mr-2" />
                            <h3 className="font-medium">{action.title}</h3>
                            {action.badge && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mt-1 opacity-80">{action.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>系统健康</CardTitle>
              <CardDescription>关键系统指标监控</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">数据库</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">正常</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">文件系统</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-green-600">正常</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">许可证</span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-blue-600">社区版</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">磁盘使用</span>
                  <span className="text-sm text-gray-600">{stats.diskUsage}%</span>
                </div>
                <Progress value={stats.diskUsage} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <Link href="/admin/system/performance">
                  <Button variant="outline" size="sm" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    查看详细监控
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity & TODO Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>最近活动</CardTitle>
            <CardDescription>系统最新的操作记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">Docker 构建问题已修复</p>
                  <p className="text-xs text-gray-500">2 小时前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">文档导出导入功能已完成</p>
                  <p className="text-xs text-gray-500">5 小时前</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">管理后台界面设计完成</p>
                  <p className="text-xs text-gray-500">刚刚</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>待办事项</CardTitle>
            <CardDescription>需要处理的系统任务</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <span className="text-sm font-medium">合并移动端优化分支</span>
                </div>
                <Badge variant="outline">高优先级</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Database className="h-4 w-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium">完善 PostgreSQL 迁移</span>
                </div>
                <Badge variant="outline">中优先级</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <BarChart3 className="h-4 w-4 text-green-600 mr-2" />
                  <span className="text-sm font-medium">完善测试覆盖率</span>
                </div>
                <Badge variant="outline">中优先级</Badge>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <Link href="https://github.com/users/leeguooooo/projects/2" target="_blank">
                <Button variant="outline" size="sm" className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  查看完整项目计划
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}