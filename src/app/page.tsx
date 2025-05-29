import Link from 'next/link';
import { BookOpen, Search, FileText, Zap, Star, Users, Shield, Rocket, Code, Palette, Globe, Heart } from 'lucide-react';
import GitHubLink from '@/components/GitHubLink';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 多层网格背景装饰 */}
      <div className="absolute inset-0 bg-grid-gradient opacity-60"></div>
      <div className="absolute inset-0 bg-grid-dots-blue opacity-40"></div>
      <div className="absolute inset-0 bg-grid-animated opacity-30"></div>

      {/* 浮动装饰球 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-indigo-400/15 rounded-full blur-2xl animate-float"></div>
      <div className="absolute top-1/4 right-0 w-80 h-80 bg-cyan-400/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <header className="relative bg-white/70 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <BookOpen className="w-10 h-10 text-blue-600" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  文档中心
                </span>
                <div className="text-xs text-gray-500">现代化文档系统</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/docs"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                开始使用
              </Link>
              <Link
                href="/admin"
                className="px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-700 rounded-xl hover:bg-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                管理文档
              </Link>
              <GitHubLink variant="header" showStats={true} />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          {/* 主标题 */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100/80 backdrop-blur-sm rounded-full text-blue-700 text-sm font-medium mb-6 border border-blue-200/50">
              <Rocket className="w-4 h-4" />
              <span>现代化文档管理解决方案</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                现代化的
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                Markdown
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                文档系统
              </span>
            </h1>
          </div>

          {/* 副标题 */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            支持 <span className="text-blue-600 font-semibold">Mermaid 图表</span>、
            <span className="text-green-600 font-semibold">全局搜索</span>、
            <span className="text-purple-600 font-semibold">拖拽管理</span> 的强大文档预览工具
            <br />
            <span className="text-lg text-gray-500">让你的文档更加生动和易于管理</span>
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/docs"
              className="group px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 font-semibold text-lg relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                立即体验
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/docs/%E7%A4%BA%E4%BE%8B%E6%96%87%E6%A1%A3/getting-started/README"
              className="group px-10 py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-2xl hover:bg-white hover:border-blue-300 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-semibold text-lg"
            >
              <span className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                快速开始
              </span>
            </Link>
            <GitHubLink variant="button" showStats={true} />
          </div>

          {/* 技术标签和作者信息 */}
          <div className="flex flex-col items-center gap-6 mb-20">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <GitHubLink variant="badge" />
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full border border-green-200/50">
                <Heart className="w-4 h-4" />
                <span className="font-medium">Made by leeguoo</span>
              </div>
              <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 rounded-full font-medium border border-purple-200/50">
                Next.js 14
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-medium border border-blue-200/50">
                TypeScript
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full font-medium border border-orange-200/50">
                生产级安全
              </span>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl p-6 max-w-3xl">
              <p className="text-gray-700 text-lg leading-relaxed">
                🚀 <span className="font-semibold">如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！</span>
                <br />
                <span className="text-gray-600">你的每一个 Star 都是我继续优化的动力！</span>
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              核心特性
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg">
              为现代开发者打造的完整文档解决方案
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {/* Markdown 支持 */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Markdown 支持
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  完整支持 GitHub Flavored Markdown，包括表格、代码高亮、任务列表、数学公式等现代化功能。
                </p>
                <div className="mt-6 flex justify-center">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    GFM 兼容
                  </span>
                </div>
              </div>
            </div>

            {/* 全局搜索 */}
            <div className="group relative bg-gradient-to-br from-white to-green-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  智能搜索
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  基于 Fuse.js 的模糊搜索引擎，支持标题和内容全文检索，实时高亮显示搜索结果。
                </p>
                <div className="mt-6 flex justify-center">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    实时搜索
                  </span>
                </div>
              </div>
            </div>

            {/* Mermaid 图表 */}
            <div className="group relative bg-gradient-to-br from-white to-purple-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Mermaid 图表
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  内置 Mermaid 图表引擎，支持流程图、时序图、甘特图、类图等多种图表类型。
                </p>
                <div className="mt-6 flex justify-center">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    可视化
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 更多特性 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300">
              <Shield className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">生产级安全</h4>
              <p className="text-sm text-gray-600">JWT 认证、路径验证、速率限制</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300">
              <Palette className="w-8 h-8 text-pink-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">现代化 UI</h4>
              <p className="text-sm text-gray-600">响应式设计、优雅界面</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300">
              <Users className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">团队协作</h4>
              <p className="text-sm text-gray-600">多用户管理、权限控制</p>
            </div>
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300">
              <Globe className="w-8 h-8 text-cyan-500 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">SEO 优化</h4>
              <p className="text-sm text-gray-600">完整的 SEO 支持、社交分享</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative bg-gradient-to-r from-white/90 via-blue-50/90 to-purple-50/90 backdrop-blur-xl border-t border-gray-200/50 py-16">
        <div className="absolute inset-0 bg-grid-3d opacity-40"></div>
        <div className="absolute inset-0 bg-grid-dots opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    文档中心
                  </span>
                  <div className="text-sm text-gray-500">现代化文档系统</div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                为现代开发者打造的完整文档解决方案，让文档管理变得简单而高效。
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
      </footer>
    </div>
  );
}
