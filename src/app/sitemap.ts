import { MetadataRoute } from 'next'
import { getAllDocs } from '@/core/docs/docs'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'

  // 获取所有文档
  const docs = await getAllDocs()

  // 静态页面
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ]

  // 动态文档页面
  const docPages = docs.map((doc) => ({
    url: `${baseUrl}/docs/${doc.slug.join('/')}`,
    lastModified: new Date(doc.lastModified),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...docPages]
}
