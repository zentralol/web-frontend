"use client";

import { useEffect, useState } from "react";
import { ControlPosition, MapControl, useMap } from "@vis.gl/react-google-maps";
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
  heatmapTargetTime: string;
  heatmapTimeOptions: HeatmapTimeOption[];
  onHeatmapToggle: () => void;
  onHeatmapTimeChange: (targetTime: string) => void;
  onLocate: (coords: Coords) => void;
};

export default function MapControls({
  heatmapEnabled,
  heatmapLoading,
  heatmapError,
  heatmapTargetTime,
  heatmapTimeOptions,
  onHeatmapToggle,
  onHeatmapTimeChange,
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

  if (!map) return null;

  return (
    <MapControl position={ControlPosition.TOP_RIGHT}>
      <div className="mr-3 mt-3 flex flex-col items-end gap-1">
        <div className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-surface/90 shadow-lg">
          <button
            type="button"
            aria-label="Toggle crowd heatmap"
            aria-pressed={heatmapEnabled}
            title="Crowd heatmap"
            onClick={onHeatmapToggle}
            className={`flex h-9 w-9 items-center justify-center transition-colors hover:bg-white/5 hover:text-accent ${
              heatmapEnabled
                ? "bg-accent/15 text-accent"
                : "text-white/70"
            }`}
          >
            {heatmapLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Layers className="h-4 w-4" aria-hidden />
            )}
          </button>
          {heatmapEnabled && (
            <div className="border-t border-white/10 px-2 py-1.5">
              <label className="sr-only" htmlFor="heatmap-time-select">
                Heatmap time
              </label>
              <select
                id="heatmap-time-select"
                value={heatmapTargetTime}
                onChange={(event) => onHeatmapTimeChange(event.target.value)}
                disabled={heatmapLoading}
                className="w-full min-w-[148px] rounded border border-white/10 bg-surface/95 px-2 py-1 text-[11px] text-white/80 outline-none focus:border-accent/50 disabled:opacity-50"
              >
                {heatmapTimeOptions.map((option) => (
                  <option key={option.id} value={option.targetTime}>
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
            disabled={locating}
            className="flex h-9 w-9 items-center justify-center border-t border-white/10 text-white/70 transition-colors hover:bg-white/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
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
    </MapControl>
  );
}
