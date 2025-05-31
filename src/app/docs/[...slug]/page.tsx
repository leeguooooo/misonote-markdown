import { getDocBySlug } from '@/core/docs/docs';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { notFound } from 'next/navigation';
import { Clock, Calendar } from 'lucide-react';
import EditButton from '@/components/EditButton';
import DocPageClient from '@/components/DocPageClient';
import TextAnnotation from '@/components/TextAnnotation';
import ImmersiveWrapper from '@/components/ImmersiveWrapper';
import { Metadata } from 'next';

// 使用智能缓存的动态渲染
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

// 注释掉静态生成，改为服务端渲染以支持实时文档更新
// export async function generateStaticParams() {
// const docs = getAllDocs();
// return docs.map((doc) => ({
//   slug: doc.slug,
// }));
// }

export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = slug.map(segment => decodeURIComponent(segment));
  const doc = getDocBySlug(decodedSlug);

  if (!doc) {
    return {
      title: '文档未找到',
      description: '请求的文档不存在',
    };
  }

  // 提取文档摘要（前200个字符）
  const excerpt = doc.content.replace(/[#*`]/g, '').substring(0, 200).trim() + '...';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  const docUrl = `${baseUrl}/docs/${slug.join('/')}`;

  return {
    title: doc.title,
    description: excerpt,
    keywords: [doc.title, ...decodedSlug, 'Markdown', '文档', '教程'],
    authors: [{ name: '文档中心团队' }],
    alternates: {
      canonical: docUrl,
    },
    openGraph: {
      type: 'article',
      locale: 'zh_CN',
      url: docUrl,
      title: doc.title,
      description: excerpt,
      siteName: '文档中心',
      publishedTime: doc.lastModified.toISOString(),
      modifiedTime: doc.lastModified.toISOString(),
      section: decodedSlug[0] || '文档',
      tags: decodedSlug,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: doc.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: doc.title,
      description: excerpt,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
    },
  };
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
    <ImmersiveWrapper>
      <div className="space-y-8">
        {/* Document Content */}
        <div className="bg-white rounded-lg">
          {/* Document Header */}
          <div className="border-b border-gray-200 px-8 py-6">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {doc.title}
              </h1>
              <EditButton docPath={decodedSlug.join('/')} />
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-500">
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
                  <a href="/docs" className="text-blue-600 hover:text-blue-800  ">
                    文档
                  </a>
                </li>
                {decodedSlug.map((segment, index) => (
                  <li key={index} className="flex items-center">
                    <span className="mx-2 text-gray-400">/</span>
                    {index === decodedSlug.length - 1 ? (
                      <span className="text-gray-500  ">{segment}</span>
                    ) : (
                      <a
                        href={`/docs/${decodedSlug.slice(0, index + 1).map(s => encodeURIComponent(s)).join('/')}`}
                        className="text-blue-600 hover:text-blue-800  "
                      >
                        {segment}
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          {/* Document Content with Text Annotation */}
          <div className="px-8 py-6">
            <TextAnnotation docPath={decodedSlug.join('/')}>
              <MarkdownRenderer content={doc.content} />
            </TextAnnotation>
          </div>

          {/* Document Footer */}
          <div className="border-t border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                文档路径：<code className="bg-gray-100 px-2 py-1 rounded text-xs">
                  /{decodedSlug.join('/')}
                </code>
              </div>

              <div className="flex items-center gap-4">
                <button className="text-blue-600 hover:text-blue-800">
                  编辑此页
                </button>
                <button className="text-blue-600 hover:text-blue-800">
                  报告问题
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 功能测试区域 */}
        {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
    <h3 className="text-lg font-semibold text-blue-900 mb-4">
    🎯 功能测试区域
    </h3>
    <div className="space-y-3 text-blue-800  ">
    <p>✅ <strong>用户登录</strong>：右上角登录选择身份（管理员/用户）</p>
    <p>✅ <strong>划词标注</strong>：登录后选中文档文字，会出现标注菜单</p>
    <p>✅ <strong>右侧评论栏</strong>：在右侧可以看到评论区域（大屏幕显示）</p>
    <p>✅ <strong>沉浸式阅读</strong>：左下角书本图标进入全屏阅读模式</p>
    <p>👑 <strong>管理员权限</strong>：管理员登录后左下角显示清空功能</p>
    <p>💾 <strong>数据持久化</strong>：评论和标注数据自动保存，刷新不丢失</p>
    <p>📝 <strong>测试文本</strong>：这是一段可以用来测试划词标注功能的文本，请尝试选中这段文字。</p>
    </div>
  </div> */}

        {/* Debug Panel */}
        {/* <DebugPanel /> */}

        {/* Admin Controls */}
        {/* <AdminControls docPath={decodedSlug.join('/')} /> */}

        {/* Immersive Reader */}
        {/* <ImmersiveReader /> */}

        {/* Right Sidebar Comments */}
        <DocPageClient docPath={decodedSlug.join('/')} />
      </div>
    </ImmersiveWrapper>
  );
}
