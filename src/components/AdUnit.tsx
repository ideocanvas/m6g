
// AdComponent.tsx

"use client";
import { useEffect, useRef } from "react";
import Router from "next/router";
interface AdUnitProps {
adSlot: string;
adFormat?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
style?: React.CSSProperties;
}

const formatStyles = {
auto: { display: "block" },
fluid: { display: "block" },
rectangle: { display: "inline-block", width: "300px", height: "250px" },
horizontal: { display: "inline-block", width: "728px", height: "90px" },
vertical: { display: "inline-block", width: "160px", height: "600px" },
};

declare global {
interface Window {
adsbygoogle: unknown[];
}
}
export function AdUnit({ adSlot, adFormat = "auto", style }: AdUnitProps) {
const adRef = useRef<HTMLModElement>(null);

useEffect(() => {
const handleRouteChange = () => {
const intervalId = setInterval(() => {
try {
if (window.adsbygoogle) {
window.adsbygoogle.push({});
clearInterval(intervalId);
}
} catch (err) {
if (process.env.NODE_ENV === "development") {
console.error("Error pushing ads: ", err);
}
clearInterval(intervalId);
}
}, 100);
return () => clearInterval(intervalId);
};

  handleRouteChange();

  if (typeof window !== "undefined") {
    Router.events.on("routeChangeComplete", handleRouteChange);

    return () => {
      Router.events.off("routeChangeComplete", handleRouteChange);
    };
  }

}, []);

return (

<div className="ad-container my-4">
<ins
  ref={adRef}
  className="adsbygoogle"
  style={{
    ...formatStyles[adFormat],
    ...style,
  }}
  data-ad-client={process.env.NEXT_PUBLIC_YOUR_ADSENSE_ID} // Your Client ID
  data-ad-slot={adSlot}
  data-ad-format={adFormat}
  data-full-width-responsive="true"
/>
</div>
); }

