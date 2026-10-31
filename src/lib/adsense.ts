// Google AdSense. The publisher id is public: it appears in every page that shows ads.

export const ADSENSE_CLIENT = "ca-pub-6275697857126948";

/** Display ad unit for the free plan banner. Unset: no banner. */
export const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT;

export const ADSENSE_SCRIPT = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
