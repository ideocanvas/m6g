// GoogleAdSense.tsx


export const GoogleAdSense = () => {
  return (
    <script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_YOUR_ADSENSE_ID}`}
      crossOrigin="anonymous"
    />
  );
};
