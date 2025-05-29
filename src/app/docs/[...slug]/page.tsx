import { getDocBySlug, getAllDocs } from '@/lib/docs';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { Clock, Calendar } from 'lucide-react';
import EditButton from '@/components/EditButton';

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateStaticParams() {
  const docs = getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;

  // 解码 URL 编码的中文字符
  const decodedSlug = slug.map(segment => decodeURIComponent(segment));

  console.log('Original slug:', slug);
  console.log('Decoded slug:', decodedSlug);

  const doc = getDocBySlug(decodedSlug);

  if (!doc) {
    console.log('Document not found for slug:', decodedSlug);
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Document Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {doc.title}
          </h1>
          <EditButton docPath={decodedSlug.join('/')} />
        </div>

        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>最后更新：{formatDate(doc.lastModified)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>阅读时间：约 {Math.ceil(doc.content.length / 500)} 分钟</span>
          </div>
        </div>

        {/* Breadcrumb */}
        <nav className="mt-4">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <a href="/docs" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                文档
              </a>
            </li>
            {decodedSlug.map((segment, index) => (
              <li key={index} className="flex items-center">
                <span className="mx-2 text-gray-400">/</span>
                {index === decodedSlug.length - 1 ? (
                  <span className="text-gray-500 dark:text-gray-400">{segment}</span>
                ) : (
                  <a
                    href={`/docs/${decodedSlug.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {segment}
                  </a>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Document Content */}
      <div className="px-8 py-6">
        <MarkdownRenderer content={doc.content} />
      </div>

      {/* Document Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-8 py-4">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div>
            文档路径：<code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
              /{decodedSlug.join('/')}
            </code>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              编辑此页
            </button>
            <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
              报告问题
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
