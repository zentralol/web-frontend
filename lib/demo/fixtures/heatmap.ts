import { rowsToHeatmapPoints } from "@/lib/map/heatmapMappers";
import type { HeatmapPredictionRow } from "@/lib/map/heatmapTypes";
import { parseNaiveIsoMs } from "@/lib/map/heatmapTargetTimeResolve";
import { formatInNewYork } from "@/lib/time/manhattanTime";
import snapshot from "./heatmap.json";

const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_HOURS_AHEAD = 8;

type HeatmapSlotRow = {
  h3_cell: string;
  lat: number;
  lon: number;
  period: string | null;
  crowd_score: number;
  crowd_level: string;
  pedestrians_pred: number | null;
  crowd_category: string | null;
  source: string;
};

type HeatmapSlot = {
  hoursAhead: number;
  sourceTargetTime: string;
  rows: HeatmapSlotRow[];
};

const slots = (snapshot as { slots: HeatmapSlot[] }).slots;

function clampHoursAhead(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(MAX_HOURS_AHEAD, Math.max(0, Math.round(value)));
}

/** Map a UI-requested Manhattan wall-clock time onto fixture slot 0..8. */
export function resolveDemoHeatmapHoursAhead(
  requestedTargetTime: string,
  now: Date = new Date(),
): number {
  const nowNy = formatInNewYork(now);
  const hoursAhead =
    (parseNaiveIsoMs(requestedTargetTime) - parseNaiveIsoMs(nowNy)) /
    ONE_HOUR_MS;
  return clampHoursAhead(hoursAhead);
}

function rowsForHoursAhead(
  hoursAhead: number,
  requestedTargetTime: string,
): HeatmapPredictionRow[] {
  const slot = slots.find((entry) => entry.hoursAhead === hoursAhead);
  if (!slot) {
    return [];
  }

  return slot.rows.map((row) => ({
    h3_cell: row.h3_cell,
    lat: row.lat,
    lon: row.lon,
    period: row.period,
    target_time: requestedTargetTime,
    crowd_score: row.crowd_score,
    crowd_level: row.crowd_level,
    pedestrians_pred: row.pedestrians_pred,
    crowd_category: row.crowd_category,
    source: "demo",
  }));
}

export function demoHeatmapResponse(
  targetTime: string,
  now: Date = new Date(),
) {
  const hoursAhead = resolveDemoHeatmapHoursAhead(targetTime, now);
  const rows = rowsForHoursAhead(hoursAhead, targetTime);

  return {
    targetTime,
    resolvedTargetTime: targetTime,
    source: "demo",
    hoursAhead,
    points: rowsToHeatmapPoints(rows),
  };
}
