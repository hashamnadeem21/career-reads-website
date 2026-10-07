import { isProduction, publicEnv } from "@/lib/env";
import { runtimeSettings } from "@/lib/settings";

export type AdPlacement = "in-article" | "sidebar" | "below-article" | "listing";

export interface AdsConfig {
  /** True only when ads should actually be requested from Google. */
  enabled: boolean;
  clientId?: string;
  /** Development aid: render labeled boxes where ads would appear. */
  showPlaceholders: boolean;
  slots: Partial<Record<AdPlacement, string>>;
}

/**
 * Ads are requested only when ALL of the following are true:
 *  - production build (`next build` / Vercel)
 *  - ads switched on (admin Settings, or NEXT_PUBLIC_ADS_ENABLED=true)
 *  - a valid AdSense client ID (admin Settings, or NEXT_PUBLIC_ADSENSE_CLIENT_ID)
 * Individual placements additionally need their slot ID.
 *
 * Values saved in the admin panel's Settings win; environment variables are the fallback.
 */
export function getAdsConfig(): AdsConfig {
  const saved = runtimeSettings().ads;
  const clientId = saved?.clientId || publicEnv.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slot = (placement: AdPlacement, fallback?: string) => saved?.slots[placement] || fallback;
  return {
    enabled: isProduction && (saved ? saved.enabled : publicEnv.NEXT_PUBLIC_ADS_ENABLED) && Boolean(clientId),
    clientId,
    // Placeholders from the admin are an explicit choice (visible to visitors); the env flag is dev-only.
    showPlaceholders: saved ? saved.showPlaceholders : !isProduction && publicEnv.NEXT_PUBLIC_ADS_SHOW_PLACEHOLDERS,
    slots: {
      "in-article": slot("in-article", publicEnv.NEXT_PUBLIC_ADSENSE_SLOT_IN_ARTICLE),
      sidebar: slot("sidebar", publicEnv.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR),
      "below-article": slot("below-article", publicEnv.NEXT_PUBLIC_ADSENSE_SLOT_BELOW_ARTICLE),
      listing: slot("listing", publicEnv.NEXT_PUBLIC_ADSENSE_SLOT_LISTING),
    },
  };
}

/** Reserved heights (px) prevent layout shift while ads load. */
export const adPlacementStyles: Record<AdPlacement, { minHeight: string; format: string; layout?: string }> = {
  "in-article": { minHeight: "min-h-[280px]", format: "fluid", layout: "in-article" },
  sidebar: { minHeight: "min-h-[600px]", format: "auto" },
  "below-article": { minHeight: "min-h-[280px]", format: "auto" },
  listing: { minHeight: "min-h-[250px]", format: "auto" },
};
