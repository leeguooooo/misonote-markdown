'use client';

import { useState, useEffect } from 'react';
import { Edit3, Lock } from 'lucide-react';
import Link from 'next/link';

interface EditButtonProps {
  docPath: string;
  className?: string;
}

export default function EditButton({ docPath, className = '' }: EditButtonProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 检查是否已登录管理员
    const checkAuth = () => {
      const token = localStorage.getItem('admin-token');
      if (token) {
        try {
          // 简单验证 token 是否存在且未过期
          const payload = JSON.parse(atob(token.split('.')[1]));
          const isExpired = payload.exp * 1000 < Date.now();
          setIsAuthenticated(!isExpired);
        } catch {
          setIsAuthenticated(false);
        }
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
    
    // 监听存储变化
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // 定期检查认证状态
    const interval = setInterval(checkAuth, 60000); // 每分钟检查一次

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <Link
        href="/admin"
        className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200     text-gray-700   rounded-lg transition-colors ${className}`}
        title="需要管理员权限"
      >
        <Lock className="w-4 h-4" />
        管理员登录
      </Link>
    );
  }

  return (
    <Link
      href={`/admin?edit=${encodeURIComponent(docPath)}`}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors ${className}`}
      title="编辑此文档"
    >
      <Edit3 className="w-4 h-4" />
      编辑文档
    </Link>
  );
}
