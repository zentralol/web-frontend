import { MapPin } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import {
  busynessLevelBadgeClass,
  formatBusynessLevel,
} from "@/lib/activity/busynessDisplay";
import type { QuieterAreaRecommendation } from "@/lib/recommendations/types";
import { haversineDistanceKm } from "@/lib/geo/haversineDistance";
import { formatCoordinate, formatDistanceKm } from "@/lib/geo/format";

type QuieterAreaCardProps = {
  area: QuieterAreaRecommendation;
  userCoords?: { lat: number; lng: number } | null;
  highlighted?: boolean;
  onClick?: () => void;
};

export function QuieterAreaCard({
  area,
  userCoords,
  highlighted = false,
  onClick,
}: QuieterAreaCardProps) {
  const distance = userCoords
    ? haversineDistanceKm(
        userCoords.lat,
        userCoords.lng,
        area.coordinates.lat,
        area.coordinates.lng,
      )
    : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition-colors ${
        highlighted
          ? "border-accent/40 bg-accent/5"
          : "border-white/10 bg-white/[0.03] hover:border-white/20"
      }`}
    >
      <div className="flex items-start gap-2">
        <MapPin
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={`${spaceGrotesk.className} min-w-0 truncate text-sm font-semibold text-white`}
            >
              {formatCoordinate(area.coordinates.lat)},{" "}
              {formatCoordinate(area.coordinates.lng)}
            </p>
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-[10px] uppercase ${busynessLevelBadgeClass(area.busynessLevel)}`}
            >
              {formatBusynessLevel(area.busynessLevel)}
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-white/55">
            Busyness score: {area.busynessScore}
            {area.pedestriansPredicted != null &&
              ` · ~${Math.round(area.pedestriansPredicted).toLocaleString()} pedestrians`}
          </p>

          {distance != null && (
            <p className="mt-0.5 text-[11px] text-white/40">
              {formatDistanceKm(distance)} away
            </p>
          )}

          {area.reason && (
            <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/50">
              {area.reason}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
