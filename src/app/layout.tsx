import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "现代化 Markdown 文档系统 | 支持 Mermaid 图表和全局搜索",
    template: "%s | 文档中心"
  },
  description: "开源的现代化 Markdown 文档预览系统，支持 Mermaid 图表、全局搜索、目录导航、拖拽管理。基于 Next.js 14 构建，提供完整的文档管理解决方案。",
  keywords: ["Markdown", "文档系统", "Mermaid", "Next.js", "开源", "文档预览", "全局搜索", "图表", "文档管理"],
  authors: [{ name: "leeguoo", url: "https://github.com/leeguooooo" }],
  creator: "leeguoo",
  publisher: "leeguoo",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    title: '现代化 Markdown 文档系统',
    description: '开源的现代化 Markdown 文档预览系统，支持 Mermaid 图表、全局搜索、目录导航、拖拽管理',
    siteName: '文档中心',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '现代化 Markdown 文档系统',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '现代化 Markdown 文档系统',
    description: '开源的现代化 Markdown 文档预览系统，支持 Mermaid 图表、全局搜索、目录导航',
    images: ['/og-image.png'],
    creator: '@leeguoo',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData
          type="website"
          data={{
            url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001'
          }}
        />
        {children}
      </body>
    </html>
  );
}
