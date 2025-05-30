'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import RightSidebarComments from './RightSidebarComments';

interface DocPageClientProps {
  docPath: string;
}

export default function DocPageClient({ docPath }: DocPageClientProps) {
  const [sidebarElement, setSidebarElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // 等待 DOM 加载完成后查找侧边栏元素
    const timer = setTimeout(() => {
      const element = document.getElementById('comments-sidebar');
      if (element) {
        setSidebarElement(element);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 处理锚点滚动
  useEffect(() => {
    const handleAnchorScroll = () => {
      const hash = window.location.hash;
      if (hash) {
        const anchorId = hash.substring(1); // 移除 # 符号
        const element = document.getElementById(anchorId);
        if (element) {
          // 延迟滚动，确保页面完全加载
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }, 300);
        }
      }
    };

    // 页面加载时处理锚点
    handleAnchorScroll();

    // 监听 hash 变化
    window.addEventListener('hashchange', handleAnchorScroll);

    return () => {
      window.removeEventListener('hashchange', handleAnchorScroll);
    };
  }, [docPath]); // 当文档路径变化时重新执行

  // 如果侧边栏元素不存在，不渲染任何内容
  if (!sidebarElement) {
    return null;
  }

  return createPortal(
    <RightSidebarComments docPath={docPath} />,
    sidebarElement
  );
}
