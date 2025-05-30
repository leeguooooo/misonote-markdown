import { getDocBySlug } from '@/lib/docs';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// 强制动态渲染，确保每次请求都重新读取文件系统
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: '文档中心',
  description: '浏览所有可用的文档，包括教程、API 文档、指南等。支持 Markdown 格式和 Mermaid 图表。',
  keywords: ['文档', '教程', 'API', '指南', 'Markdown', 'Mermaid'],
  openGraph: {
    title: '文档中心 - 浏览所有文档',
    description: '浏览所有可用的文档，包括教程、API 文档、指南等。支持 Markdown 格式和 Mermaid 图表。',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '文档中心 - 浏览所有文档',
    description: '浏览所有可用的文档，包括教程、API 文档、指南等。',
  },
};

export default function DocsHomePage() {
  // Try to get the main README.md file
  const doc = getDocBySlug(['README']);

  if (!doc) {
    return (
      <div className="bg-white   rounded-lg shadow-sm border border-gray-200   p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900   mb-4">
            欢迎来到文档中心
          </h1>
          <p className="text-gray-600   mb-6">
            这里是你的文档主页。请在 docs 目录下添加 README.md 文件来自定义此页面。
          </p>

          <div className="bg-gray-50   rounded-lg p-6 text-left">
            <h2 className="text-lg font-semibold text-gray-900   mb-3">
              快速开始：
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700  ">
              <li>在项目根目录的 <code className="bg-gray-200   px-2 py-1 rounded">docs/</code> 文件夹中创建 Markdown 文件</li>
              <li>使用文件夹来组织文档结构</li>
              <li>支持 Mermaid 图表语法</li>
              <li>使用顶部搜索框快速查找内容</li>
            </ol>
          </div>

          <div className="mt-8 grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50   rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900   mb-2">
                📝 Markdown 支持
              </h3>
              <p className="text-blue-700   text-sm">
                完整支持 GitHub Flavored Markdown，包括表格、代码块、任务列表等。
              </p>
            </div>

            <div className="bg-green-50   rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900   mb-2">
                📊 Mermaid 图表
              </h3>
              <p className="text-green-700   text-sm">
                内置支持 Mermaid 图表，可以创建流程图、时序图、甘特图等。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white   rounded-lg shadow-sm border border-gray-200   p-8">
      <MarkdownRenderer content={doc.content} />
    </div>
  );
}
