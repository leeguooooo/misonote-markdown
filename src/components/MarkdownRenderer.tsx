'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import MermaidDiagram from './MermaidDiagram';
import { Link } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
  content: string;
}

// 生成锚点ID的函数
function generateAnchorId(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u4e00-\u9fa5]/g, '') // 支持中文字符
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// 锚点链接组件
function AnchorLink({ id, showToast }: { id: string; showToast: (message: string, type?: 'success' | 'error' | 'info') => void }) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      // 更新URL hash
      const newUrl = `${window.location.pathname}${window.location.search}#${id}`;
      window.history.pushState(null, '', newUrl);

      // 复制链接到剪贴板
      const fullUrl = `${window.location.origin}${newUrl}`;
      navigator.clipboard.writeText(fullUrl).then(() => {
        showToast('锚点链接已复制到剪贴板', 'success');
      }).catch(err => {
        console.error('复制链接失败:', err);
        showToast('复制链接失败', 'error');
      });
    }
  };

  return (
    <a
      href={`#${id}`}
      onClick={handleClick}
      className="anchor-link opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2 text-gray-400 hover:text-blue-600"
      aria-label="点击复制锚点链接"
      title="点击复制锚点链接"
    >
      <Link className="w-4 h-4" />
    </a>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const { showToast } = useToast();

  return (
    <div className="prose prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            // 检查是否为代码块（有语言类名）还是内联代码
            const isCodeBlock = className && className.startsWith('language-');

            if (isCodeBlock && language === 'mermaid') {
              return <MermaidDiagram chart={String(children).replace(/\n$/, '')} />;
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          pre({ children }) {
            return (
              <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                {children}
              </pre>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200  ">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900  ">
                {children}
              </td>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 my-4">
                {children}
              </blockquote>
            );
          },
          h1({ children }) {
            const text = typeof children === 'string' ? children : children?.toString() || '';
            const id = generateAnchorId(text);
            return (
              <h1 id={id} className="group text-3xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b border-gray-200 flex items-center">
                {children}
                <AnchorLink id={id} showToast={showToast} />
              </h1>
            );
          },
          h2({ children }) {
            const text = typeof children === 'string' ? children : children?.toString() || '';
            const id = generateAnchorId(text);
            return (
              <h2 id={id} className="group text-2xl font-semibold text-gray-900 mt-6 mb-3 flex items-center">
                {children}
                <AnchorLink id={id} showToast={showToast} />
              </h2>
            );
          },
          h3({ children }) {
            const text = typeof children === 'string' ? children : children?.toString() || '';
            const id = generateAnchorId(text);
            return (
              <h3 id={id} className="group text-xl font-medium text-gray-900 mt-5 mb-2 flex items-center">
                {children}
                <AnchorLink id={id} showToast={showToast} />
              </h3>
            );
          },
          h4({ children }) {
            const text = typeof children === 'string' ? children : children?.toString() || '';
            const id = generateAnchorId(text);
            return (
              <h4 id={id} className="group text-lg font-medium text-gray-900 mt-4 mb-2 flex items-center">
                {children}
                <AnchorLink id={id} showToast={showToast} />
              </h4>
            );
          },
          h5({ children }) {
            const text = typeof children === 'string' ? children : children?.toString() || '';
            const id = generateAnchorId(text);
            return (
              <h5 id={id} className="group text-base font-medium text-gray-900 mt-3 mb-2 flex items-center">
                {children}
                <AnchorLink id={id} showToast={showToast} />
              </h5>
            );
          },
          h6({ children }) {
            const text = typeof children === 'string' ? children : children?.toString() || '';
            const id = generateAnchorId(text);
            return (
              <h6 id={id} className="group text-sm font-medium text-gray-900 mt-3 mb-2 flex items-center">
                {children}
                <AnchorLink id={id} showToast={showToast} />
              </h6>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            );
          },
          ul({ children }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-4">
                {children}
              </ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-4">
                {children}
              </ol>
            );
          },
          li({ children }) {
            return (
              <li className="text-gray-700  ">
                {children}
              </li>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
