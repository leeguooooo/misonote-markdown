import Link from 'next/link';
import { BookOpen, Heart } from 'lucide-react';
import GitHubLink from '@/components/GitHubLink';

export default function HomeFooter() {
  return (
    <footer className="relative bg-gradient-to-r from-white/90 via-blue-50/90 to-purple-50/90 backdrop-blur-xl border-t border-gray-200/50 py-8 sm:py-16">
      <div className="absolute inset-0 bg-grid-3d opacity-40"></div>
      <div className="absolute inset-0 bg-grid-dots opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 移动端简化版 */}
        <div className="sm:hidden">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Misonote
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              AI 原生文档管理系统
            </p>
            <GitHubLink variant="footer" showStats={true} />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-center mb-6">
            <Link href="/docs" className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-2">
              📖 浏览文档
            </Link>
            <Link href="/admin" className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-2">
              ⚙️ 管理后台
            </Link>
          </div>

          <div className="border-t border-gray-200/50 pt-4">
            <div className="text-center text-xs text-gray-500">
              <p>© 2024 leeguoo • MIT License</p>
              <p className="mt-1">Made with ❤️ by @leeguoo</p>
            </div>
          </div>
        </div>

        {/* 桌面端完整版 */}
        <div className="hidden sm:block">
          {/* 主要内容 */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 mb-12">
            {/* Logo 和描述 */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left max-w-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <BookOpen className="w-10 h-10 text-blue-600" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Misonote Markdown 2.0
                  </span>
                  <div className="text-sm text-gray-500">AI 原生文档系统</div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                通过 MCP 协议与 AI 深度集成的智能文档系统，让 AI 成为您的文档管理助手。
              </p>
            </div>

            {/* GitHub 信息 */}
            <div className="flex flex-col items-center gap-6">
              <GitHubLink variant="footer" showStats={true} />
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full border border-green-200/50">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">Made with ❤️</span>
                </div>
                <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-medium border border-blue-200/50">
                  Open Source
                </span>
              </div>
            </div>

            {/* 快速链接 */}
            <div className="flex flex-col items-center lg:items-end gap-4">
              <h4 className="font-semibold text-gray-900 mb-2">快速链接</h4>
              <div className="flex flex-col gap-2 text-center lg:text-right">
                <Link href="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">
                  📖 浏览文档
                </Link>
                <Link href="/admin" className="text-gray-600 hover:text-blue-600 transition-colors">
                  ⚙️ 管理后台
                </Link>
                <a href="https://github.com/leeguooooo/markdown-site" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
                  🚀 GitHub 仓库
                </a>
                <a href="https://github.com/leeguooooo" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600 transition-colors">
                  👨‍💻 关于作者
                </a>
              </div>
            </div>
          </div>

          {/* 分割线 */}
          <div className="border-t border-gray-200/50 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* 版权信息 */}
              <div className="flex items-center gap-6 text-sm text-gray-500">
                <span>© 2024 leeguoo</span>
                <span>•</span>
                <span>MIT License</span>
                <span>•</span>
                <a
                  href="https://github.com/leeguooooo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors font-medium"
                >
                  @leeguoo
                </a>
              </div>

              {/* 技术栈 */}
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">Powered by</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-black text-white rounded text-xs font-medium">Next.js</span>
                  <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium">TypeScript</span>
                  <span className="px-2 py-1 bg-cyan-500 text-white rounded text-xs font-medium">Tailwind</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}