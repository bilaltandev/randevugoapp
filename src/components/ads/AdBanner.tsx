"use client";

import React, { useEffect } from "react";
import Script from "next/script";
import { ADSENSE_CLIENT, ADSENSE_SCRIPT, ADSENSE_SLOT } from "@/lib/adsense";

declare global {
  interface Window {
    adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
  }
}

/**
 * One responsive AdSense banner. Only the free plan shows it, and only on calm screens (Özet, İstatistikler): never on
 * a customer's booking page or where work gets done. Non-personalized, so no tracking consent is needed.
 * The box hides itself while Google has no ad for it (.dash-ad in globals.css).
 */
export function AdBanner() {
  useEffect(() => {
    try {
      const ads = (window.adsbygoogle = window.adsbygoogle || []);
      ads.requestNonPersonalizedAds = 1;
      ads.push({});
    } catch {
      // An ad blocker or a failed script must never affect the panel.
    }
  }, []);

  return (
    <aside aria-label="Reklam" className="dash-ad ios-group p-3">
      <p className="pb-1.5 text-[11px] text-ink-3">Reklam</p>
      <Script src={ADSENSE_SCRIPT} crossOrigin="anonymous" strategy="afterInteractive" />
      <ins className="adsbygoogle block" data-ad-client={ADSENSE_CLIENT} data-ad-slot={ADSENSE_SLOT} data-ad-format="auto" data-full-width-responsive="true" />
    </aside>
  );
}
