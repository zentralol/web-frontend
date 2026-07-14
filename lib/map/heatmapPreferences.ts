export const HEATMAP_ENABLED_KEY = "zentra-map-heatmap-enabled";

export function readHeatmapEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return window.localStorage.getItem(HEATMAP_ENABLED_KEY) === "1";
}

export function writeHeatmapEnabled(enabled: boolean): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(HEATMAP_ENABLED_KEY, enabled ? "1" : "0");
}
