'use client';

import { useState, useEffect } from 'react';
import MarkSixGenerator from '@/components/MarkSixGenerator';
import BuyMeACoffee from '@/components/BuyMeACoffee';
import Disclaimer from '@/components/Disclaimer';
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
      {/* Header Disclaimer */}
      <div className="w-full bg-yellow-50 border-b border-yellow-200 py-2 px-4">
        <Disclaimer language={language} variant="inline" className="text-center" />
      </div>

      <MarkSixGenerator language={language} />
      <BuyMeACoffee language={language} />

      {/* Footer Disclaimer */}
      <div className="w-full bg-blue-50 border-t border-blue-200 py-4 px-4">
        <Disclaimer language={language} variant="compact" className="max-w-7xl mx-auto" />
      </div>
    </div>
  );
}