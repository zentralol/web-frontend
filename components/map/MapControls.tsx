"use client";

import { useEffect, useState } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { Layers, Loader2, LocateFixed } from "lucide-react";
import {
  requestCurrentPosition,
  type Coords,
} from "@/lib/geo/requestCurrentPosition";
import type { HeatmapTimeOption } from "@/lib/map/heatmapTimeOptions";

const LOCATION_ERROR_MESSAGE =
  "Couldn't get your location. Check location permissions.";

export type MapControlsProps = {
  heatmapEnabled: boolean;
  heatmapLoading: boolean;
  heatmapError: string | null;
  selectedHeatmapTimeId: string;
  heatmapTimeOptions: HeatmapTimeOption[];
  onHeatmapToggle: () => void;
  onHeatmapTimeChange: (optionId: string) => void;
  onHeatmapTimeSelectFocus: () => void;
  onLocate: (coords: Coords) => void;
};

export default function MapControls({
  heatmapEnabled,
  heatmapLoading,
  heatmapError,
  selectedHeatmapTimeId,
  heatmapTimeOptions,
  onHeatmapToggle,
  onHeatmapTimeChange,
  onHeatmapTimeSelectFocus,
  onLocate,
}: MapControlsProps) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationError) return;
    const timer = window.setTimeout(() => setLocationError(null), 5000);
    return () => window.clearTimeout(timer);
  }, [locationError]);

  const handleLocate = async () => {
    if (locating || !map) return;
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await requestCurrentPosition();
      map.panTo(coords);
      map.setZoom(15);
      onLocate(coords);
    } catch {
      setLocationError(LOCATION_ERROR_MESSAGE);
    } finally {
      setLocating(false);
    }
  };

  const stopMapClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      onPointerDown={stopMapClick}
      onClick={stopMapClick}
    >
      <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-1">
        <div className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-surface/95 shadow-lg backdrop-blur-sm">
          <button
            type="button"
            aria-label="Toggle crowd heatmap"
            aria-pressed={heatmapEnabled}
            title="Crowd heatmap"
            onClick={onHeatmapToggle}
            className={`flex h-9 items-center gap-2 px-3 text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-white/5 ${
              heatmapEnabled
                ? "bg-accent/15 text-accent"
                : "text-white/80"
            }`}
          >
            {heatmapLoading ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Layers className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>Heatmap</span>
          </button>
          {heatmapEnabled && (
            <div className="border-t border-white/10 px-2 py-1.5">
              <label className="sr-only" htmlFor="heatmap-time-select">
                Heatmap time
              </label>
              <select
                id="heatmap-time-select"
                value={selectedHeatmapTimeId}
                onChange={(event) => onHeatmapTimeChange(event.target.value)}
                onFocus={onHeatmapTimeSelectFocus}
                className="w-full min-w-[168px] rounded border border-white/10 bg-surface px-2 py-1 text-[11px] text-white/80 outline-none focus:border-accent/50"
              >
                {heatmapTimeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            aria-label="Locate me"
            title="Locate me"
            onClick={() => void handleLocate()}
            disabled={locating || !map}
            className="flex h-9 w-full items-center justify-center border-t border-white/10 text-white/80 transition-colors hover:bg-white/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {heatmapEnabled && heatmapError && (
          <p className="max-w-[220px] rounded-lg border border-white/10 bg-surface/95 px-2 py-1 text-right text-[11px] text-[#ff3b30] shadow-lg">
            {heatmapError}
          </p>
        )}
        {locationError && (
          <p className="max-w-[200px] rounded-lg border border-white/10 bg-surface/95 px-2 py-1 text-right text-[11px] text-[#ff3b30] shadow-lg">
            {locationError}
          </p>
        )}
      </div>
    </div>
  );
}
