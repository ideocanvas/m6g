/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';

interface BuyMeACoffeeProps {
  language: 'en' | 'zh-TW';
}

export default function BuyMeACoffee({ language }: BuyMeACoffeeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <a
        href="https://buymeacoffee.com/ideocanvas"
        target="_blank"
        rel="noopener noreferrer"
        className={`
          block p-3 rounded-lg shadow-lg transition-all duration-300
          bg-yellow-500 hover:bg-yellow-600
          ${isHovered ? 'translate-x-0' : 'translate-x-32 hover:translate-x-0'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src="/bmc-brand-logo.svg"
          alt="Buy Me a Coffee"
          className="w-32 h-auto"
        />
      </a>
    </div>
  );
}