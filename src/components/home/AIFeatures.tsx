import { Link2, Brain } from 'lucide-react';

export default function AIFeatures() {
  return (
    <section className="mb-12 sm:mb-20 px-4">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🤖 AI 原生体验
        </h2>
        <p className="text-gray-600 text-base sm:text-lg">
          通过 MCP 协议与 Cursor 深度集成，让 AI 真正理解您的需求
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-6xl mx-auto">
        {/* MCP 集成 */}
        <div className="group relative bg-gradient-to-br from-white to-blue-50/50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Link2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
              MCP 协议集成
            </h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed mb-3 sm:mb-4">
              与 Cursor 编辑器无缝集成，通过自然语言直接管理文档，AI 可以创建、搜索、更新文档。
            </p>
            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 text-xs sm:text-sm text-gray-700">
              <div className="font-mono">
                <div className="text-blue-600">你:</div>
                <div className="mb-2">"帮我创建一个 API 文档"</div>
                <div className="text-green-600">AI:</div>
                <div>"文档创建成功！<br/>📖 在线地址: localhost:3000/docs/api-guide"</div>
              </div>
            </div>
          </div>
        </div>

        {/* 智能记忆 */}
        <div className="group relative bg-gradient-to-br from-white to-purple-50/50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
              智能记忆系统
            </h3>
            <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed mb-3 sm:mb-4">
              AI 自动记录您的习惯、偏好和经验，支持多项目记忆管理，让每次交互都更加个性化。
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-100 text-blue-700 rounded-lg p-1.5 sm:p-2 text-center font-medium">
                习惯记录
              </div>
              <div className="bg-green-100 text-green-700 rounded-lg p-1.5 sm:p-2 text-center font-medium">
                偏好管理
              </div>
              <div className="bg-orange-100 text-orange-700 rounded-lg p-1.5 sm:p-2 text-center font-medium">
                复盘记录
              </div>
              <div className="bg-purple-100 text-purple-700 rounded-lg p-1.5 sm:p-2 text-center font-medium">
                洞察学习
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}