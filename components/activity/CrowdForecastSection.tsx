"use client";

import { useState } from "react";
import { Loader2, Navigation, TrendingUp } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import type { CrowdForecastResult } from "@/lib/activity/fetchCrowdForecast";
import { formatBusynessLevel } from "@/lib/activity/busynessDisplay";
import { ForecastTimeline } from "@/components/shared/ForecastTimeline";

type SectionState = "idle" | "loading" | "ready" | "error" | "needs_location";

interface CrowdForecastSectionProps {
  state: SectionState;
  result: CrowdForecastResult;
  isLocating: boolean;
  locationError: string | null;
  onUseLocation: () => void;
}

export function CrowdForecastSection({
  state,
  result,
  isLocating,
  locationError,
  onUseLocation,
}: CrowdForecastSectionProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const forecast = result.forecast;

  return (
    <section className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
            Crowd forecast
          </p>
          <h2
            className={`${spaceGrotesk.className} mt-2 text-lg font-light text-white`}
          >
            Your location
          </h2>
        </div>
        {result.current && state === "ready" && (
          <div className="text-right">
            <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent">
              <TrendingUp className="h-3 w-3" aria-hidden />
              Now: {result.current.score} (
              {formatBusynessLevel(result.current.level)})
            </span>
          </div>
        )}
      </div>

      {state === "needs_location" && (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 text-center">
          <Navigation className="mx-auto h-5 w-5 text-accent/70" aria-hidden />
          <p className="mt-3 text-sm text-white/55">
            Enable location to see an 8-hour crowd forecast for where you are.
          </p>
          <button
            type="button"
            onClick={onUseLocation}
            disabled={isLocating}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-accent transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isLocating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Locating…
              </>
            ) : (
              "Use my location"
            )}
          </button>
          {locationError && (
            <p className="mt-3 text-xs text-red-400/90">{locationError}</p>
          )}
        </div>
      )}

      {state === "loading" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading forecast…
        </div>
      )}

      {state === "error" && (
        <p className="mt-6 text-sm text-red-400/90">
          {result.error ?? "Could not load crowd forecast."}
        </p>
      )}

      {state === "ready" && forecast.length > 0 && (
        <div className="mt-6 flex flex-1 flex-col">
          <ForecastTimeline
            points={forecast}
            variant="full"
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />
        </div>
      )}

      {state === "ready" && forecast.length === 0 && !result.error && (
        <p className="mt-6 text-sm text-white/50">
          No forecast data available for your location.
        </p>
      )}
    </section>
  );
}
