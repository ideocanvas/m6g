
// GoogleAdSense.tsx

import Script from 'next/script';

export const GoogleAdSense = () => {
if (process.env.ENV !== 'production') {
  return null;
}

return (
  <Script
    async
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_YOUR_ADSENSE_ID}`}
    crossOrigin="anonymous"
    strategy="afterInteractive"
  />
);
};

