'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { DocFile } from '@/core/docs/docs';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => Promise<DocFile[]>;
}

export default function SearchDialog({ isOpen, onClose, onSearch }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const searchResults = await onSearch(query);
        setResults(searchResults);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, onSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200  ">
          {part}
        </mark>
      ) : part
    );
  };

  const getContentPreview = (content: string, query: string, maxLength = 150) => {
    if (!content || !query || !query.trim()) {
      return content ? content.substring(0, maxLength) + '...' : '';
    }

    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) {
      return content.substring(0, maxLength) + '...';
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + query.length + 100);
    const preview = content.substring(start, end);

    return (start > 0 ? '...' : '') + preview + (end < content.length ? '...' : '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl border border-gray-200  ">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200  ">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索文档..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
          />
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600  "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
              搜索中...
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docs/${doc.slug.join('/')}`}
                  onClick={onClose}
                  className="block p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {highlightText(doc.title, query)}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {highlightText(getContentPreview(doc.content, query), query)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        /{doc.slug.join('/')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>未找到相关文档</p>
              <p className="text-sm mt-1">尝试使用不同的关键词</p>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>输入关键词开始搜索</p>
              <p className="text-sm mt-1">支持标题和内容搜索</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500 flex items-center justify-between">
          <span>使用 ↑↓ 导航，Enter 选择</span>
          <span>ESC 关闭</span>
        </div>
      </div>
    </div>
  );
}
