import { crowdLevelMeta } from "@/lib/attractions/crowdLevels";

export const HEATMAP_FILL_OPACITY = 0.4;
const FALLBACK_COLOR = "#888888";

export function heatmapFillColor(crowdLevel: string): string {
  return crowdLevelMeta(crowdLevel)?.markerColor ?? FALLBACK_COLOR;
}
