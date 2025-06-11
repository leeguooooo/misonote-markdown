'use client';

import { useEffect, useRef } from 'react';

interface MobileOptimizedContentProps {
  children: React.ReactNode;
}

export default function MobileOptimizedContent({ children }: MobileOptimizedContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;

    // 优化表格显示
    const tables = contentRef.current.querySelectorAll('table');
    tables.forEach((table) => {
      // 为移动端添加数据标签
      const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent || '');
      const rows = table.querySelectorAll('tbody tr');
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        cells.forEach((cell, index) => {
          if (headers[index]) {
            cell.setAttribute('data-label', headers[index]);
          }
        });
      });

      // 添加移动端滚动提示
      if (window.innerWidth <= 768) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper relative';
        wrapper.innerHTML = `
          <div class="table-scroll-hint text-xs text-gray-500 mb-2 md:hidden">
            ← 左右滑动查看更多 →
          </div>
        `;
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // 优化代码块
    const codeBlocks = contentRef.current.querySelectorAll('pre code');
    codeBlocks.forEach((codeBlock) => {
      const pre = codeBlock.parentElement;
      if (pre && window.innerWidth <= 768) {
        // 添加复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-white rounded opacity-75 hover:opacity-100';
        copyButton.textContent = '复制';
        copyButton.onclick = () => {
          navigator.clipboard.writeText(codeBlock.textContent || '');
          copyButton.textContent = '已复制';
          setTimeout(() => {
            copyButton.textContent = '复制';
          }, 2000);
        };
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);

        // 添加滚动提示
        if (codeBlock.scrollWidth > codeBlock.clientWidth) {
          const scrollHint = document.createElement('div');
          scrollHint.className = 'text-xs text-gray-500 mt-1 md:hidden';
          scrollHint.textContent = '← 左右滑动查看完整代码 →';
          pre.parentNode?.insertBefore(scrollHint, pre.nextSibling);
        }
      }
    });

    // 优化图片
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      // 添加点击放大功能
      if (window.innerWidth <= 768) {
        img.style.cursor = 'pointer';
        img.onclick = () => {
          const modal = document.createElement('div');
          modal.className = 'fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4';
          modal.onclick = () => modal.remove();
          
          const modalImg = document.createElement('img');
          modalImg.src = img.src;
          modalImg.alt = img.alt;
          modalImg.className = 'max-w-full max-h-full object-contain';
          
          modal.appendChild(modalImg);
          document.body.appendChild(modal);
        };
      }
    });

    // 优化长链接
    const links = contentRef.current.querySelectorAll('a[href]');
    links.forEach((link) => {
      if (link.textContent && link.textContent.length > 50) {
        link.setAttribute('title', link.textContent);
        if (window.innerWidth <= 768) {
          link.style.wordBreak = 'break-all';
        }
      }
    });

  }, [children]);

  return (
    <div ref={contentRef} className="mobile-optimized-content">
      {children}
    </div>
  );
}

// 移动端专用的代码高亮组件
export function MobileCodeBlock({ 
  children, 
  language, 
  filename 
}: { 
  children: string; 
  language?: string; 
  filename?: string; 
}) {
  const codeRef = useRef<HTMLPreElement>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(children);
      // 可以添加 toast 提示
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group">
      {filename && (
        <div className="bg-gray-800 text-gray-300 px-4 py-2 text-sm rounded-t-lg border-b border-gray-700">
          {filename}
        </div>
      )}
      <pre 
        ref={codeRef}
        className={`bg-gray-900 text-gray-100 p-4 overflow-x-auto ${filename ? 'rounded-t-none' : 'rounded-lg'} relative`}
      >
        <code className={language ? `language-${language}` : ''}>
          {children}
        </code>
        <button
          onClick={copyToClipboard}
          className="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-700 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity md:opacity-75"
        >
          复制
        </button>
      </pre>
      <div className="text-xs text-gray-500 mt-1 md:hidden">
        ← 左右滑动查看完整代码 →
      </div>
    </div>
  );
}

// 移动端专用的表格组件
export function MobileTable({ 
  headers, 
  rows 
}: { 
  headers: string[]; 
  rows: string[][]; 
}) {
  return (
    <div className="mobile-table-wrapper">
      <div className="text-xs text-gray-500 mb-2 md:hidden">
        ← 左右滑动查看更多 →
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="hidden md:table-header-group">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-4 py-2 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="md:table-row block border border-gray-200 mb-2 md:mb-0 rounded md:rounded-none">
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex}
                    data-label={headers[cellIndex]}
                    className="md:table-cell block px-4 py-2 md:border-0 border-b border-gray-100 last:border-b-0"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
