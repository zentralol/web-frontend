import { buildFutureHourOptions } from "@/lib/map/fetchPredictions";
import { formatInNewYork } from "@/lib/time/manhattanTime";

export type HeatmapTimeOption = {
  id: string;
  label: string;
  targetTime: string;
};

export function buildHeatmapTimeOptions(now: Date = new Date()): HeatmapTimeOption[] {
  const nowOption: HeatmapTimeOption = {
    id: "now",
    label: "Now",
    targetTime: formatInNewYork(now),
  };

  const futureOptions = buildFutureHourOptions(now).map((option) => ({
    id: `future-${option.hoursAhead}`,
    label: option.label,
    targetTime: option.targetTime,
  }));

  return [nowOption, ...futureOptions];
}
