'use client';

import { useState } from 'react';
import { labels, LanguageCode } from '@/lib/i18n';

interface DisclaimerProps {
  language: LanguageCode;
  variant?: 'full' | 'compact' | 'inline';
  className?: string;
}

export default function Disclaimer({
  language,
  variant = 'full',
  className = ''
}: DisclaimerProps) {
  const [isExpanded, setIsExpanded] = useState(variant === 'full');

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (variant === 'inline') {
    return (
      <div className={`text-xs text-gray-600 dark:text-gray-400 ${className}`}>
        <span className="font-medium">{labels[language].for_entertainment}</span>
        {' '}
        {labels[language].no_guarantee}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm ${className}`}>
        <div className="flex items-start">
          <div className="shrink-0">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-yellow-800 font-medium">
              {labels[language].disclaimer_title}
            </p>
            <p className="text-yellow-700 mt-1">
              {labels[language].for_entertainment} {labels[language].no_guarantee}
            </p>
            <button
              onClick={toggleExpanded}
              className="text-yellow-600 hover:text-yellow-500 text-sm font-medium mt-1"
            >
              {isExpanded ? 'Show Less' : 'Show Full Disclaimer'}
            </button>
            {isExpanded && (
              <div className="mt-2 text-yellow-700 text-xs">
                <p>{labels[language].disclaimer_content}</p>
                <p className="mt-1">{labels[language].gambling_warning}</p>
                <p className="mt-1">{labels[language].legal_age_required}</p>
                <p className="mt-1">{labels[language].gamble_responsibly}</p>
                <p className="mt-1">{labels[language].seek_help_if_needed}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full variant (default)
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="shrink-0">
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-blue-800 font-medium">
            {labels[language].disclaimer_title}
          </h3>
          <div className="text-blue-700 mt-2 space-y-2 text-sm">
            <p>{labels[language].disclaimer_content}</p>
            <p className="font-medium">{labels[language].gambling_warning}</p>
            <p>{labels[language].no_guarantee}</p>
            <p>{labels[language].legal_age_required}</p>
            <p>{labels[language].gamble_responsibly}</p>
            <p className="text-blue-600 font-medium">{labels[language].seek_help_if_needed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}