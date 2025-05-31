'use client';

import React from 'react';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  requiredLicense?: string[];
  upgradeUrl?: string;
}

export function UpgradePrompt({
  feature,
  description,
  requiredLicense = ['professional', 'enterprise'],
  upgradeUrl = '/pricing'
}: UpgradePromptProps) {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-9a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          升级解锁 {feature}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-600 mb-4">
            {description}
          </p>
        )}
        
        <p className="text-sm text-gray-500 mb-4">
          此功能需要 {requiredLicense.join(' 或 ')} 版本
        </p>
        
        <div className="space-y-2">
          <a
            href={upgradeUrl}
            className="w-full inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            查看升级选项
          </a>
          
          <button
            onClick={() => window.history.back()}
            className="w-full inline-flex justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
}
