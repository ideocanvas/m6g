'use client';

import { useState, useEffect } from 'react';
import MarkSixGenerator from '@/components/MarkSixGenerator';
import BuyMeACoffee from '@/components/BuyMeACoffee';
import { LanguageCode } from '@/lib/i18n';

interface ClientHomeProps {
  language: LanguageCode;
}

export default function ClientHome({ language }: ClientHomeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Mark Six Generator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <MarkSixGenerator language={language} />
      <BuyMeACoffee language={language} />
    </div>
  );
}