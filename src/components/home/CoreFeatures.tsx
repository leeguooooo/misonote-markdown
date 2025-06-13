import { MessageSquare, Highlighter, Layers, MousePointer2, Search, Zap } from 'lucide-react';

const features = [
  {
    icon: MessageSquare,
    title: '协作评论',
    description: '支持文本选择评论、多人协作讨论、回复和点赞功能，让团队协作更加高效。',
    gradient: 'from-blue-500 to-blue-600',
    bgGradient: 'from-white to-blue-50/50',
    tags: ['实时协作', '多人讨论']
  },
  {
    icon: Highlighter,
    title: '文本标注',
    description: '支持高亮标记、添加笔记、创建书签，让重要内容一目了然，提升阅读效率。',
    gradient: 'from-green-500 to-emerald-600',
    bgGradient: 'from-white to-green-50/50',
    tags: ['高亮标记', '智能书签']
  },
  {
    icon: Layers,
    title: '多视图编辑',
    description: '支持编辑、预览、分屏、全屏四种模式，丰富的工具栏和快捷键，提升编辑体验。',
    gradient: 'from-purple-500 to-pink-600',
    bgGradient: 'from-white to-purple-50/50',
    tags: ['实时预览', '快捷键']
  },
  {
    icon: MousePointer2,
    title: '拖拽管理',
    description: '支持拖拽移动文件、双击重命名、右键菜单操作，让文件管理变得直观简单。',
    gradient: 'from-orange-500 to-red-600',
    bgGradient: 'from-white to-orange-50/50',
    tags: ['拖拽移动', '快速重命名']
  },
  {
    icon: Search,
    title: '智能搜索',
    description: '基于 Fuse.js 的模糊搜索引擎，支持标题和内容全文检索，实时高亮显示搜索结果。',
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-white to-cyan-50/50',
    tags: ['全文搜索', '实时过滤']
  },
  {
    icon: Zap,
    title: 'Mermaid 图表',
    description: '内置 Mermaid 图表引擎，支持流程图、时序图、甘特图、类图等多种图表类型。',
    gradient: 'from-indigo-500 to-purple-600',
    bgGradient: 'from-white to-indigo-50/50',
    tags: ['可视化图表', '实时渲染']
  }
];

export default function CoreFeatures() {
  return (
    <section className="mb-12 sm:mb-16 px-4">
      <div className="mb-8 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-3 sm:mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          强大功能特性
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-16 text-base sm:text-lg">
          企业级文档管理系统，集成协作、编辑、管理于一体
        </p>
      </div>

      {/* 功能亮点展示 - 移动端优化 */}
      <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-8 sm:mb-16 border border-gray-200/50">
        <div className="text-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-4">🚀 功能亮点</h3>
          <p className="text-sm sm:text-base text-gray-600">体验企业级文档管理系统的强大功能</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">协作评论</h4>
            <p className="text-xs sm:text-sm text-gray-600">选择文本即可添加评论，支持多人讨论和回复</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <Highlighter className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">智能标注</h4>
            <p className="text-xs sm:text-sm text-gray-600">高亮重要内容，添加笔记和书签，提升阅读效率</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-lg sm:rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <MousePointer2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1 sm:mb-2 text-sm sm:text-base">拖拽管理</h4>
            <p className="text-xs sm:text-sm text-gray-600">拖拽移动文件，双击重命名，右键菜单操作</p>
          </div>
        </div>
      </div>

      {/* 主要功能特性 - 6个核心功能 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={index} className={`group relative bg-gradient-to-br ${feature.bgGradient} p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2`}>
              <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-gray-600/5 rounded-2xl sm:rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.gradient} rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 text-center leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 sm:mt-6 flex justify-center gap-2">
                  {feature.tags.map((tag, tagIndex) => (
                    <span key={tagIndex} className={`px-2 sm:px-3 py-1 bg-gradient-to-r ${feature.gradient} bg-opacity-10 text-xs sm:text-sm rounded-full font-medium`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}