import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import GitHubLink from '@/components/GitHubLink';

export default function HomeHeader() {
  return (
    <header className="relative bg-white/70 backdrop-blur-xl border-b border-gray-200/50 safe-area-top">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div>
              <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Misonote <span className="hidden sm:inline">Markdown 2.0</span>
              </span>
              <div className="text-[10px] sm:text-xs text-gray-500">AI 原生文档系统</div>
            </div>
          </div>
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-4">
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

          {/* Mobile Actions */}
          <div className="sm:hidden flex items-center gap-2">
            <Link
              href="/docs"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg font-medium"
            >
              开始
            </Link>
            <Link
              href="/admin"
              className="px-4 py-2 bg-white/80 border border-gray-200 text-gray-700 text-sm rounded-lg font-medium"
            >
              管理
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}