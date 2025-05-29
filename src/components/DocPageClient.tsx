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

  // 如果侧边栏元素不存在，不渲染任何内容
  if (!sidebarElement) {
    return null;
  }

  return createPortal(
    <RightSidebarComments docPath={docPath} />,
    sidebarElement
  );
}
