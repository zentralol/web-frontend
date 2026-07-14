"use client";

import { useState } from "react";
import type { ForecastPoint } from "@/lib/map/fetchPredictions";
import {
  busynessLevelBadgeClass,
  busynessScoreBarClass,
  formatBusynessLevel,
} from "@/lib/activity/busynessDisplay";

type ForecastTimelineProps = {
  points: ForecastPoint[];
  variant?: "full" | "compact";
  interactive?: boolean;
  showGrid?: boolean;
  showSummary?: boolean;
  selectedIndex?: number;
  onSelect?: (index: number) => void;
};

function formatCompactTimeLabel(timestamp: string): string {
  return timestamp.replace(/:\d{2}\s/, " ");
}

export function ForecastTimeline({
  points,
  variant = "full",
  interactive = true,
  showGrid = variant === "full",
  showSummary = variant === "full",
  selectedIndex: controlledIndex,
  onSelect,
}: ForecastTimelineProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const selectedIndex = controlledIndex ?? internalIndex;
  const selectedPoint = points[selectedIndex];
  const isCompact = variant === "compact";
  const chartHeightClass = isCompact ? "h-[7rem]" : "h-[11rem]";

  const handleSelect = (index: number) => {
    if (!interactive) {
      return;
    }
    onSelect?.(index);
    if (controlledIndex === undefined) {
      setInternalIndex(index);
    }
  };

  if (points.length === 0) {
    return null;
  }

  const columnClassName =
    "group relative flex h-full min-w-0 flex-1 flex-col items-center";

  return (
    <>
      <div
        className={`relative flex w-full ${chartHeightClass} items-stretch justify-between gap-1 rounded-lg border border-white/5 bg-[#0d0e0f]/80 px-3 pb-3 ${
          isCompact ? "mt-3 pt-2" : "flex-1 pt-8"
        }`}
      >
        {showGrid && (
          <>
            <div className="pointer-events-none absolute left-3 right-3 top-[20%] border-t border-white/5" />
            <div className="pointer-events-none absolute left-3 right-3 top-[50%] border-t border-white/5" />
            <div className="pointer-events-none absolute left-3 right-3 top-[80%] border-t border-white/5" />
          </>
        )}

        {points.map((point, index) => {
          const isSelected = interactive && index === selectedIndex;
          const barHeight = `${Math.min(Math.max(point.score, 4), 100)}%`;
          const barClassName = isCompact ? "max-w-6" : "max-w-10";

          const columnContent = (
            <>
              <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-end">
                <span
                  className={`mb-1 shrink-0 font-mono leading-none ${
                    isCompact ? "text-[8px]" : "text-[9px]"
                  } ${
                    isSelected
                      ? "font-bold text-accent"
                      : "text-white/65"
                  }`}
                >
                  {point.score}
                </span>
                <div
                  style={{ height: barHeight }}
                  className={`w-full rounded-t-sm transition-all duration-300 ${barClassName} ${
                    isSelected
                      ? "bg-accent/80"
                      : `${busynessScoreBarClass(point.score)} ${
                          interactive ? "hover:bg-accent/50" : ""
                        }`
                  }`}
                />
              </div>
              <span
                className={`mt-2 shrink-0 font-mono transition-colors ${
                  isCompact ? "text-[8px]" : "text-[9px]"
                } ${isSelected ? "text-accent" : "text-white/40"}`}
              >
                {formatCompactTimeLabel(point.timestamp)}
              </span>
            </>
          );

          if (interactive) {
            return (
              <button
                key={`${point.rawTimestamp}-${index}`}
                type="button"
                onClick={() => handleSelect(index)}
                className={columnClassName}
              >
                {columnContent}
              </button>
            );
          }

          return (
            <div key={`${point.rawTimestamp}-${index}`} className={columnClassName}>
              {columnContent}
            </div>
          );
        })}
      </div>

      {showSummary && selectedPoint && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-xs">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-white/40">
              Selected window
            </span>
            <strong className="text-sm text-white">
              {selectedPoint.timestamp}
            </strong>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm text-accent">
              {selectedPoint.score}
            </span>
            <span
              className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] uppercase ${busynessLevelBadgeClass(selectedPoint.level)}`}
            >
              {formatBusynessLevel(selectedPoint.level)}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
