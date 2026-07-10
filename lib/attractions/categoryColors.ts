const MARKER_PALETTE = [
  "#00BFFF",
  "#34C759",
  "#FF9500",
  "#AF52DE",
  "#FF2D55",
  "#5856D6",
  "#FFD60A",
  "#64D2FF",
] as const;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable marker color derived from a category label. */
export function categoryMarkerColor(category: string): string {
  const normalized = category.trim().toLowerCase() || "default";
  const index = hashString(normalized) % MARKER_PALETTE.length;
  return MARKER_PALETTE[index] ?? MARKER_PALETTE[0];
}
