import { useCallback, useEffect, useMemo, useState } from "react";
import {
  buildHeatmapTimeOptions,
  type HeatmapTimeOption,
} from "@/lib/map/heatmapTimeOptions";

export const HEATMAP_OPTIONS_REFRESH_MS = 60_000;

export function useLiveHeatmapTimeOptions(heatmapEnabled: boolean): {
  options: HeatmapTimeOption[];
  refreshOptions: () => void;
} {
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshOptions = useCallback(() => {
    setRefreshTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (!heatmapEnabled) {
      return;
    }

    const intervalId = window.setInterval(refreshOptions, HEATMAP_OPTIONS_REFRESH_MS);
    return () => window.clearInterval(intervalId);
  }, [heatmapEnabled, refreshOptions]);

  const options = useMemo(
    () => buildHeatmapTimeOptions(new Date()),
    [heatmapEnabled, refreshTick],
  );

  return { options, refreshOptions };
}
