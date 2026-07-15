import { Clock } from "lucide-react";
import {
  busynessLevelBadgeClass,
  formatBusynessLevel,
} from "@/lib/activity/busynessDisplay";
import { toForecastTimeLabel } from "@/lib/map/fetchPredictions";
import type { QuietTime } from "@/lib/recommendations/types";
import { QUIET_TIME_MAX_BUSYNESS_SCORE } from "@/lib/recommendations/quietTimes";

type QuieterTimesSectionProps = {
  originalScore: number;
  originalLevel: string;
  quietTimes: QuietTime[];
};

export function QuieterTimesSection({
  originalScore,
  originalLevel,
  quietTimes,
}: QuieterTimesSectionProps) {
  if (quietTimes.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <p className="text-sm text-white/55">
          No quiet windows with a score of {QUIET_TIME_MAX_BUSYNESS_SCORE} or
          below were found in the next 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.15em] text-accent/70">
          Score {QUIET_TIME_MAX_BUSYNESS_SCORE} or below
        </span>
        <span className="text-[10px] text-white/40">
          Now: {originalScore}{" "}
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] uppercase ${busynessLevelBadgeClass(originalLevel)}`}
          >
            {formatBusynessLevel(originalLevel)}
          </span>
        </span>
      </div>

      <ul className="space-y-2">
        {quietTimes.map((quietTime, index) => (
          <li
            key={`${quietTime.targetTime}-${index}`}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-accent/70" aria-hidden />
              <span className="text-sm text-white">
                {toForecastTimeLabel(quietTime.targetTime)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-accent">
                {quietTime.busynessScore}
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] uppercase ${busynessLevelBadgeClass(quietTime.busynessLevel)}`}
              >
                {formatBusynessLevel(quietTime.busynessLevel)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
