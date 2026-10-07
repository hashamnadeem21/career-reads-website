import { adPlacementStyles, getAdsConfig, type AdPlacement } from "@/lib/ads";
import { cn } from "@/lib/utils";
import { AdUnit } from "./AdUnit";

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
}

/**
 * Reusable, clearly-labeled advertisement container.
 * - Renders nothing unless ads are enabled + configured (or dev placeholders are on).
 * - Reserves vertical space to minimize Cumulative Layout Shift.
 * - Visually separated from editorial content with a label and generous margins
 *   to avoid accidental clicks.
 */
export function AdSlot({ placement, className }: AdSlotProps) {
  const config = getAdsConfig();
  const slot = config.slots[placement];
  const style = adPlacementStyles[placement];
  const live = config.enabled && config.clientId && slot;

  if (!live && !config.showPlaceholders) return null;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className={cn("not-prose my-10 w-full", className)}
    >
      <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
        Advertisement
      </p>
      <div
        className={cn(
          "flex w-full items-center justify-center overflow-hidden rounded-2xl",
          style.minHeight,
          live ? "bg-surface" : "border-2 border-dashed border-border bg-surface/60",
        )}
      >
        {live ? (
          <AdUnit clientId={config.clientId!} slot={slot} format={style.format} layout={style.layout} />
        ) : (
          <span className="px-4 text-center text-xs text-muted">
            Ad placement: <strong>{placement}</strong> (placeholder)
          </span>
        )}
      </div>
    </aside>
  );
}
