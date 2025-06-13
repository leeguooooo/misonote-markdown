import Link from 'next/link';
import { Rocket, Code, Bot, Sparkles } from 'lucide-react';
import GitHubLink from '@/components/GitHubLink';

export default function HeroSection() {
  return (
    <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
      <div className="text-center">
        {/* 主标题 */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm rounded-full text-blue-700 text-xs sm:text-sm font-medium mb-4 sm:mb-6 border border-blue-200/50">
            <Bot className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>AI 原生文档管理系统 2.0</span>
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight px-2">
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              AI 原生的
            </span>
            <br className="hidden sm:block" />
            <span className="inline sm:hidden"> </span>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
              智能文档
            </span>
            <br className="hidden sm:block" />
            <span className="inline sm:hidden"> </span>
            <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              管理系统
            </span>
          </h1>
        </div>

        {/* 副标题 */}
        <p className="text-base sm:text-xl lg:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-5xl mx-auto leading-relaxed px-4">
          通过 <span className="text-blue-600 font-semibold">MCP 协议</span> 与
          <span className="text-purple-600 font-semibold">Cursor 深度集成</span>，
          支持 <span className="text-green-600 font-semibold">智能记忆</span>、
          <span className="text-orange-600 font-semibold">自然语言交互</span> 的 AI 原生文档系统
          <br className="hidden sm:block" />
          <span className="block mt-2 text-sm sm:text-lg text-gray-500">让 AI 成为您的智能文档助手，开启个性化知识管理新时代</span>
        </p>

        {/* CTA 按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-8 sm:mb-16 px-4">
          <Link
            href="/docs"
            className="group px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl sm:shadow-2xl hover:shadow-blue-500/25 transform hover:-translate-y-1 font-semibold text-base sm:text-lg relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4 sm:w-5 sm:h-5" />
              立即体验
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          </Link>
          <Link
            href="/docs/%E7%A4%BA%E4%BE%8B%E6%96%87%E6%A1%A3/getting-started/README"
            className="group px-6 sm:px-10 py-3 sm:py-4 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-white hover:border-blue-300 transition-all duration-300 shadow-lg sm:shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-semibold text-base sm:text-lg"
          >
            <span className="flex items-center justify-center gap-2">
              <Code className="w-4 h-4 sm:w-5 sm:h-5" />
              快速开始
            </span>
          </Link>
          <div className="hidden sm:block">
            <GitHubLink variant="button" showStats={true} />
          </div>
        </div>

        {/* 移动端 GitHub 链接 */}
        <div className="sm:hidden mb-8">
          <GitHubLink variant="button" showStats={true} />
        </div>
      </div>
    </section>
  );
}