import { Heart } from 'lucide-react';
import GitHubLink from '@/components/GitHubLink';

export default function TechBadges() {
  return (
    <section className="mb-12 sm:mb-20 px-4">
      <div className="flex flex-col items-center gap-4 sm:gap-6">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <GitHubLink variant="badge" />
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full border border-green-200/50">
            <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="font-medium text-xs sm:text-sm">Made by leeguoo</span>
          </div>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700 rounded-full font-medium border border-purple-200/50 text-xs sm:text-sm">
            Next.js 15
          </span>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-medium border border-blue-200/50 text-xs sm:text-sm">
            TypeScript
          </span>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-medium border border-green-200/50 text-xs sm:text-sm">
            MCP 协议
          </span>
          <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full font-medium border border-orange-200/50 text-xs sm:text-sm">
            AI 原生
          </span>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-3xl mx-auto">
          <p className="text-gray-700 text-sm sm:text-lg leading-relaxed text-center">
            🚀 <span className="font-semibold">如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！</span>
            <br />
            <span className="text-gray-600 text-xs sm:text-base">你的每一个 Star 都是我继续优化的动力！</span>
          </p>
        </div>
      </div>
    </section>
  );
}