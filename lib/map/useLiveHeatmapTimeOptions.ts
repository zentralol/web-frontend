import { useCallback, useEffect, useState } from "react";
import {
  buildHeatmapTimeOptions,
  type HeatmapTimeOption,
} from "@/lib/map/heatmapTimeOptions";

export const HEATMAP_OPTIONS_REFRESH_MS = 60_000;

export function useLiveHeatmapTimeOptions(heatmapEnabled: boolean): {
  options: HeatmapTimeOption[];
  refreshOptions: () => void;
} {
  const [options, setOptions] = useState<HeatmapTimeOption[]>(() =>
    buildHeatmapTimeOptions(),
  );

  const refreshOptions = useCallback(() => {
    setOptions(buildHeatmapTimeOptions(new Date()));
  }, []);

  useEffect(() => {
    if (!heatmapEnabled) {
      return;
    }

    refreshOptions();
    const intervalId = window.setInterval(refreshOptions, HEATMAP_OPTIONS_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [heatmapEnabled, refreshOptions]);

  return { options, refreshOptions };
}
