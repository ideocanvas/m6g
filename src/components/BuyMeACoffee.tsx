/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';

interface BuyMeACoffeeProps {
  language: 'en' | 'zh-TW';
}

export default function BuyMeACoffee({ language }: BuyMeACoffeeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`
          flex items-center gap-2 p-3 rounded-lg shadow-lg transition-all duration-300 cursor-pointer
          bg-yellow-500 hover:bg-yellow-600
          ${isExpanded ? 'translate-x-0' : 'translate-x-40'}
        `}
        onClick={toggleExpanded}
      >
        <img
          src={language === 'zh-TW' ? "/bmc-brand-logo-zh.png" : "/bmc-brand-logo.svg"}
          alt="Buy Me a Coffee"
          className="w-32 h-auto"
        />
        <a
          href="https://buymeacoffee.com/ideocanvas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-700 hover:text-gray-900 transition-colors"
          onClick={(e) => e.stopPropagation()} // Prevent toggle when clicking the link
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  );
}