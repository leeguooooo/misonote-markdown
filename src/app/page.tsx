import Link from 'next/link';
import {
  BookOpen, Search, FileText, Zap, Star, Users, Shield, Rocket, Code, Palette, Globe, Heart,
  MessageSquare, Highlighter, MousePointer2, FolderTree,
  Upload, Settings, Layers, Target,
  ArrowRight, CheckCircle, PlayCircle, Lightbulb, Brain, Bot, Link2, Sparkles
} from 'lucide-react';
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
                  Misonote Markdown 2.0
                </span>
                <div className="text-xs text-gray-500">AI 原生文档系统</div>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100/80 to-purple-100/80 backdrop-blur-sm rounded-full text-blue-700 text-sm font-medium mb-6 border border-blue-200/50">
              <Bot className="w-4 h-4" />
              <span>AI 原生文档管理系统 2.0</span>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                AI 原生的
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                智能文档
              </span>
              <br />
              <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                管理系统
              </span>
            </h1>
          </div>

          {/* 副标题 */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-5xl mx-auto leading-relaxed">
            通过 <span className="text-blue-600 font-semibold">MCP 协议</span> 与
            <span className="text-purple-600 font-semibold">Cursor 深度集成</span>，
            支持 <span className="text-green-600 font-semibold">智能记忆</span>、
            <span className="text-orange-600 font-semibold">自然语言交互</span> 的 AI 原生文档系统
            <br />
            <span className="text-lg text-gray-500">让 AI 成为您的智能文档助手，开启个性化知识管理新时代</span>
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
                Next.js 15
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full font-medium border border-blue-200/50">
                TypeScript
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full font-medium border border-green-200/50">
                MCP 协议
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full font-medium border border-orange-200/50">
                AI 原生
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

          {/* AI 功能亮点 */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🤖 AI 原生体验
              </h2>
              <p className="text-gray-600 text-lg">
                通过 MCP 协议与 Cursor 深度集成，让 AI 真正理解您的需求
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* MCP 集成 */}
              <div className="group relative bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Link2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    MCP 协议集成
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed mb-4">
                    与 Cursor 编辑器无缝集成，通过自然语言直接管理文档，AI 可以创建、搜索、更新文档。
                  </p>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700">
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
              <div className="group relative bg-gradient-to-br from-white to-purple-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Brain className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                    智能记忆系统
                  </h3>
                  <p className="text-gray-600 text-center leading-relaxed mb-4">
                    AI 自动记录您的习惯、偏好和经验，支持多项目记忆管理，让每次交互都更加个性化。
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-100 text-blue-700 rounded-lg p-2 text-center font-medium">
                      习惯记录
                    </div>
                    <div className="bg-green-100 text-green-700 rounded-lg p-2 text-center font-medium">
                      偏好管理
                    </div>
                    <div className="bg-orange-100 text-orange-700 rounded-lg p-2 text-center font-medium">
                      复盘记录
                    </div>
                    <div className="bg-purple-100 text-purple-700 rounded-lg p-2 text-center font-medium">
                      洞察学习
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              强大功能特性
            </h2>
            <p className="text-center text-gray-600 mb-16 text-lg">
              企业级文档管理系统，集成协作、编辑、管理于一体
            </p>
          </div>

          {/* 功能亮点展示 */}
          <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-3xl p-8 mb-16 border border-gray-200/50">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">🚀 功能亮点</h3>
              <p className="text-gray-600">体验企业级文档管理系统的强大功能</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">协作评论</h4>
                <p className="text-sm text-gray-600">选择文本即可添加评论，支持多人讨论和回复</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Highlighter className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">智能标注</h4>
                <p className="text-sm text-gray-600">高亮重要内容，添加笔记和书签，提升阅读效率</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <MousePointer2 className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">拖拽管理</h4>
                <p className="text-sm text-gray-600">拖拽移动文件，双击重命名，右键菜单操作</p>
              </div>
            </div>
          </div>

          {/* 主要功能特性 - 6个核心功能 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* 协作评论系统 */}
            <div className="group relative bg-gradient-to-br from-white to-blue-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  协作评论
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  支持文本选择评论、多人协作讨论、回复和点赞功能，让团队协作更加高效。
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    实时协作
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    多人讨论
                  </span>
                </div>
              </div>
            </div>

            {/* 文本标注功能 */}
            <div className="group relative bg-gradient-to-br from-white to-green-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Highlighter className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  文本标注
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  支持高亮标记、添加笔记、创建书签，让重要内容一目了然，提升阅读效率。
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    高亮标记
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                    智能书签
                  </span>
                </div>
              </div>
            </div>

            {/* 多视图编辑器 */}
            <div className="group relative bg-gradient-to-br from-white to-purple-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  多视图编辑
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  支持编辑、预览、分屏、全屏四种模式，丰富的工具栏和快捷键，提升编辑体验。
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    实时预览
                  </span>
                  <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                    快捷键
                  </span>
                </div>
              </div>
            </div>

            {/* 拖拽文件管理 */}
            <div className="group relative bg-gradient-to-br from-white to-orange-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <MousePointer2 className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  拖拽管理
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  支持拖拽移动文件、双击重命名、右键菜单操作，让文件管理变得直观简单。
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                    拖拽移动
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    快速重命名
                  </span>
                </div>
              </div>
            </div>

            {/* 智能搜索 */}
            <div className="group relative bg-gradient-to-br from-white to-cyan-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  智能搜索
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  基于 Fuse.js 的模糊搜索引擎，支持标题和内容全文检索，实时高亮显示搜索结果。
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-sm font-medium">
                    全文搜索
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    实时过滤
                  </span>
                </div>
              </div>
            </div>

            {/* Mermaid 图表 */}
            <div className="group relative bg-gradient-to-br from-white to-indigo-50/50 p-8 rounded-3xl shadow-xl hover:shadow-2xl border border-gray-200/50 transition-all duration-500 hover:-translate-y-2">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                  Mermaid 图表
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  内置 Mermaid 图表引擎，支持流程图、时序图、甘特图、类图等多种图表类型。
                </p>
                <div className="mt-6 flex justify-center gap-2">
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                    可视化图表
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    实时渲染
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 高级功能特性 */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center mb-4 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              高级功能
            </h3>
            <p className="text-center text-gray-600 mb-12 text-lg">
              更多强大功能，提升文档管理效率
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <FolderTree className="w-8 h-8 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">树形导航</h4>
              <p className="text-sm text-gray-600">层级文件结构、折叠展开、路径导航</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <Upload className="w-8 h-8 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">拖拽上传</h4>
              <p className="text-sm text-gray-600">支持文件拖拽上传、批量处理</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <FileText className="w-8 h-8 text-purple-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">文档模板</h4>
              <p className="text-sm text-gray-600">预设模板、快速创建、标准化文档</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <Settings className="w-8 h-8 text-orange-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">权限管理</h4>
              <p className="text-sm text-gray-600">文件隐藏、访问控制、安全管理</p>
            </div>
          </div>

          {/* 技术特性 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <Shield className="w-8 h-8 text-red-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">生产级安全</h4>
              <p className="text-sm text-gray-600">JWT 认证、路径验证、速率限制</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <Palette className="w-8 h-8 text-pink-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">现代化 UI</h4>
              <p className="text-sm text-gray-600">响应式设计、优雅界面、流畅动画</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <Rocket className="w-8 h-8 text-indigo-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">高性能</h4>
              <p className="text-sm text-gray-600">虚拟滚动、懒加载、缓存优化</p>
            </div>
            <div className="group bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-gray-200/50 text-center hover:bg-white/80 transition-all duration-300 hover:-translate-y-1">
              <Globe className="w-8 h-8 text-cyan-500 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h4 className="font-semibold text-gray-900 mb-2">SEO 优化</h4>
              <p className="text-sm text-gray-600">完整的 SEO 支持、社交分享</p>
            </div>
          </div>

          {/* 使用场景展示 */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">🎯 适用场景</h3>
              <p className="text-gray-600 text-lg">满足不同团队和个人的文档管理需求</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-200/50">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">团队协作</h4>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>技术文档管理</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>项目知识库</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>API 文档维护</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>培训材料整理</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-200/50">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">企业应用</h4>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>产品文档</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>操作手册</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>流程规范</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>技术标准</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-200/50">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">个人使用</h4>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>学习笔记</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>技术博客</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>项目文档</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>知识整理</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* 快速开始指引 */}
          <div className="bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 rounded-3xl p-8 text-white text-center">
            <h3 className="text-3xl font-bold mb-4">🚀 立即开始使用</h3>
            <p className="text-xl text-gray-300 mb-8">只需几分钟，即可搭建专业的文档管理系统</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/docs"
                className="group px-8 py-4 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                体验演示
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                href="/admin"
                className="group px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white hover:text-gray-900 transition-all duration-300 font-semibold flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                管理后台
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
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
      </footer>
    </div>
  );
}
