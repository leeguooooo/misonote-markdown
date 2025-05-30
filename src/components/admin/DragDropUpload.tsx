'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, X, Check } from 'lucide-react';

interface DragDropUploadProps {
  onFilesUpload: (files: FileList) => void;
  uploadStatus: string;
  accept?: string;
  multiple?: boolean;
  className?: string;
}

export default function DragDropUpload({
  onFilesUpload,
  uploadStatus,
  accept = '.md',
  multiple = true,
  className = '',
}: DragDropUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);

    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // 过滤只允许的文件类型
      const allowedFiles = Array.from(files).filter(file => {
        if (accept === '.md') {
          return file.name.endsWith('.md') || file.type === 'text/markdown';
        }
        return true;
      });

      if (allowedFiles.length > 0) {
        const fileList = new DataTransfer();
        allowedFiles.forEach(file => fileList.items.add(file));
        onFilesUpload(fileList.files);
      } else {
        alert('请上传 Markdown (.md) 文件');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesUpload(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getStatusIcon = () => {
    if (uploadStatus.includes('成功') || uploadStatus.includes('完成')) {
      return <Check className="w-5 h-5 text-green-600" />;
    }
    if (uploadStatus.includes('失败') || uploadStatus.includes('错误')) {
      return <X className="w-5 h-5 text-red-600" />;
    }
    if (uploadStatus.includes('上传')) {
      return (
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      );
    }
    return <Upload className="w-5 h-5 text-gray-500" />;
  };

  const getStatusColor = () => {
    if (uploadStatus.includes('成功') || uploadStatus.includes('完成')) {
      return 'text-green-600';
    }
    if (uploadStatus.includes('失败') || uploadStatus.includes('错误')) {
      return 'text-red-600';
    }
    if (uploadStatus.includes('上传')) {
      return 'text-blue-600';
    }
    return 'text-gray-600';
  };

  return (
    <div className={`relative ${className}`}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
    flex flex-col items-center justify-center w-full h-32 
    border-2 border-dashed rounded-lg cursor-pointer 
    transition-all duration-200 ease-in-out
    ${isDragOver
            ? 'border-blue-500 bg-blue-50 scale-105'
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100  '
          }
    `}
      >
        <div className="flex flex-col items-center justify-center pt-2 pb-3">
          <div className="mb-2">
            {getStatusIcon()}
          </div>

          {isDragOver ? (
            <div className="text-center">
              <p className="text-sm font-medium text-blue-600  ">
                释放文件以上传
              </p>
              <p className="text-xs text-blue-500  ">
                支持 Markdown (.md) 文件
              </p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600  ">
                <span className="font-medium">点击上传</span> 或拖拽文件到此处
              </p>
              <p className="text-xs text-gray-500 mt-1">
                支持 Markdown (.md) 文件{multiple ? '，可多选' : ''}
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 上传状态 */}
      {uploadStatus && (
        <div className={`mt-3 text-sm ${getStatusColor()} flex items-center gap-2`}>
          {getStatusIcon()}
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* 使用提示 */}
      <div className="mt-2 text-xs text-gray-400  ">
        💡 提示：
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>支持拖拽多个文件同时上传</li>
          <li>文件名将作为文档标题</li>
          <li>重复文件名会自动覆盖</li>
        </ul>
      </div>
    </div>
  );
}
