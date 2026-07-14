import { rowsToHeatmapPoints } from "@/lib/map/heatmapMappers";
import {
  listDistinctHeatmapTargetTimes,
  listHeatmapPredictions,
} from "@/lib/map/heatmapQueries";
import { resolveHeatmapTargetTime } from "@/lib/map/heatmapTargetTimeResolve";
import { HEATMAP_LIMIT } from "@/lib/map/fetchHeatmap";
import { logger } from "@/lib/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const NAIVE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;

function parseLimit(value: string | null): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return HEATMAP_LIMIT;
  }

  return Math.min(Math.floor(parsed), HEATMAP_LIMIT);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetTime = (searchParams.get("targetTime") ?? "").trim();
  const limit = parseLimit(searchParams.get("limit"));

  if (!NAIVE_ISO_PATTERN.test(targetTime)) {
    return NextResponse.json(
      { error: "targetTime must be a naive ISO date-time (YYYY-MM-DDTHH:mm:ss)." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const distinctTargetTimes = await listDistinctHeatmapTargetTimes(supabase);
    const resolvedTargetTime = resolveHeatmapTargetTime(
      targetTime,
      distinctTargetTimes,
    );
    const rows = resolvedTargetTime
      ? await listHeatmapPredictions(supabase, resolvedTargetTime, limit)
      : [];

    return NextResponse.json({
      targetTime,
      resolvedTargetTime,
      source: "heatmap_predictions",
      points: rowsToHeatmapPoints(rows),
    });
  } catch (error) {
    logger.error("Could not load heatmap predictions", { error, targetTime });
    return NextResponse.json(
      { error: "Could not load crowd heatmap." },
      { status: 500 },
    );
  }
}
