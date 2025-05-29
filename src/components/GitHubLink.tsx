'use client';

import { Github, Star, GitFork, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';

interface GitHubStats {
  stars: number;
  forks: number;
  watchers: number;
}

interface GitHubLinkProps {
  variant?: 'button' | 'badge' | 'header' | 'footer';
  showStats?: boolean;
  className?: string;
}

export default function GitHubLink({ 
  variant = 'button', 
  showStats = false, 
  className = '' 
}: GitHubLinkProps) {
  const [stats, setStats] = useState<GitHubStats | null>(null);
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL;
  const authorName = process.env.NEXT_PUBLIC_AUTHOR_NAME;

  useEffect(() => {
    if (showStats && githubUrl) {
      // 从 GitHub URL 提取仓库信息
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\#]+)/);
      if (match) {
        const [, owner, repo] = match;
        fetchGitHubStats(owner, repo);
      }
    }
  }, [showStats, githubUrl]);

  const fetchGitHubStats = async (owner: string, repo: string) => {
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          stars: data.stargazers_count,
          forks: data.forks_count,
          watchers: data.watchers_count,
        });
      }
    } catch (error) {
      console.log('Failed to fetch GitHub stats:', error);
    }
  };

  if (!githubUrl) return null;

  const baseClasses = "inline-flex items-center gap-2 transition-all duration-200";

  switch (variant) {
    case 'button':
      return (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 font-medium ${className}`}
        >
          <Github className="w-5 h-5" />
          <span>GitHub</span>
          {showStats && stats && (
            <div className="flex items-center gap-3 ml-2 pl-2 border-l border-gray-600 dark:border-gray-400">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span className="text-sm">{stats.stars}</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                <span className="text-sm">{stats.forks}</span>
              </div>
            </div>
          )}
          <ExternalLink className="w-4 h-4" />
        </a>
      );

    case 'badge':
      return (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 ${className}`}
        >
          <Github className="w-4 h-4" />
          <span>开源项目</span>
        </a>
      );

    case 'header':
      return (
        <a
          href={githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${baseClasses} text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 ${className}`}
          title="查看源代码"
        >
          <Github className="w-5 h-5" />
          {showStats && stats && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span className="text-sm">{stats.stars}</span>
              </div>
            </div>
          )}
        </a>
      );

    case 'footer':
      return (
        <div className={`${baseClasses} flex-col text-center ${className}`}>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Github className="w-5 h-5" />
            <span>开源项目</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          {showStats && stats && (
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4" />
                <span>{stats.stars} Stars</span>
              </div>
              <div className="flex items-center gap-1">
                <GitFork className="w-4 h-4" />
                <span>{stats.forks} Forks</span>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Made with ❤️ by{' '}
            <a
              href={process.env.NEXT_PUBLIC_AUTHOR_GITHUB}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {authorName}
            </a>
          </p>
        </div>
      );

    default:
      return null;
  }
}
