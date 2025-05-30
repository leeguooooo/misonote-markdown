'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Folder } from 'lucide-react';

interface CreateFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFile: (fileName: string, filePath: string, template: string) => void;
  initialPath?: string;
  availablePaths: string[];
}

const templates = {
  empty: {
    name: '空白文档',
    content: '# 标题\n\n在这里编写内容...\n',
  },
  readme: {
    name: 'README 文档',
    content: `# 项目名称

## 简介

项目的简要描述。

## 安装

\`\`\`bash
npm install
\`\`\`

## 使用方法

\`\`\`bash
npm start
\`\`\`

## 贡献

欢迎提交 Pull Request。

## 许可证

MIT
`,
  },
  api: {
    name: 'API 文档',
    content: `# API 文档

## 概述

API 的基本信息和使用说明。

## 认证

\`\`\`bash
Authorization: Bearer <token>
\`\`\`

## 端点

### GET /api/example

获取示例数据。

**参数：**

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | string | 是 | 示例ID |

**响应：**

\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`
`,
  },
  tutorial: {
    name: '教程文档',
    content: `# 教程标题

## 前置要求

- 要求1
- 要求2

## 步骤

### 步骤 1: 准备工作

详细说明...

### 步骤 2: 具体操作

详细说明...

## 总结

总结要点...

## 下一步

推荐的后续学习内容...
`,
  },
  faq: {
    name: '常见问题',
    content: `# 常见问题

## 一般问题

### Q: 问题1？

A: 答案1...

### Q: 问题2？

A: 答案2...

## 技术问题

### Q: 技术问题1？

A: 技术答案1...

## 故障排除

### 问题现象

解决方案...
`,
  },
};

export default function CreateFileDialog({
  isOpen,
  onClose,
  onCreateFile,
  initialPath = '',
  availablePaths,
}: CreateFileDialogProps) {
  const [fileName, setFileName] = useState('');
  const [filePath, setFilePath] = useState(initialPath);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates>('empty');
  const [showPathDropdown, setShowPathDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFileName('');
      setFilePath(initialPath);
      setSelectedTemplate('empty');
    }
  }, [isOpen, initialPath]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!fileName.trim()) return;

    const finalFileName = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
    const finalPath = filePath.trim() ? `${filePath}/${fileName.replace('.md', '')}` : fileName.replace('.md', '');
    const template = templates[selectedTemplate];

    onCreateFile(finalFileName, finalPath, template.content);
    onClose();
  };

  const handlePathSelect = (path: string) => {
    setFilePath(path);
    setShowPathDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 对话框 */}
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-200  ">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200  ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900  ">
                创建新文档
              </h2>
              <p className="text-sm text-gray-500  ">
                选择模板并设置文件信息
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 文件名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件名
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="例: getting-started.md"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500  "
              required
            />
            <p className="mt-1 text-xs text-gray-500  ">
              如果不以 .md 结尾，会自动添加
            </p>
          </div>

          {/* 文件路径 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              存放路径
            </label>
            <div className="relative">
              <input
                type="text"
                value={filePath}
                onChange={(e) => setFilePath(e.target.value)}
                onFocus={() => setShowPathDropdown(true)}
                placeholder="例: api/endpoints 或留空放在根目录"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500  "
              />

              {showPathDropdown && availablePaths.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => handlePathSelect('')}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Folder className="w-4 h-4" />
                    根目录
                  </button>
                  {availablePaths.map((path, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePathSelect(path)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <Folder className="w-4 h-4" />
                      {path}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 模板选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择模板
            </label>
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(templates).map(([key, template]) => (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedTemplate === key
                    ? 'border-blue-500 bg-blue-50  '
                    : 'border-gray-200 hover:bg-gray-50  '
                    }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={key}
                    checked={selectedTemplate === key}
                    onChange={(e) => setSelectedTemplate(e.target.value as keyof typeof templates)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900  ">
                      {template.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {template.content.split('\n').slice(0, 2).join(' ').substring(0, 80)}...
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!fileName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              创建文档
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
