"use client";

import { Loader2, MapPin, Search } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { crowdLevelMeta } from "@/lib/attractions/crowdLevels";
import type { AttractionSortMode } from "@/lib/attractions/filterAttractions";
import type { CategoryGroup } from "@/lib/attractions/categoryGroups";
import type { Attraction } from "@/lib/attractions/types";
import { haversineDistanceKm } from "@/lib/geo/haversineDistance";
import { formatDistanceKm } from "@/lib/geo/format";
import { QuieterAreaCard } from "@/components/map/QuieterAreaCard";
import type { QuieterAreaRecommendation } from "@/lib/recommendations/types";

export type AttractionsLoadState = "loading" | "ready" | "error" | "empty";

export type AttractionBrowsePanelProps = {
  loadState: AttractionsLoadState;
  loadError?: string | null;
  filteredAttractions: Attraction[];
  totalCount: number;
  categories: CategoryGroup[];
  searchQuery: string;
  categoryFilter: CategoryGroup | null;
  sortMode: AttractionSortMode;
  highlightedId: number | null;
  nearMeError?: string | null;
  quietAreas?: QuieterAreaRecommendation[];
  quietAreasLoading?: boolean;
  quietAreasError?: string | null;
  locatingQuietAreas?: boolean;
  userCoords?: { lat: number; lng: number } | null;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: CategoryGroup | null) => void;
  onSortModeChange: (mode: AttractionSortMode) => void;
  onNearMe: () => void;
  onQuietAreas: () => void;
  onSelect: (attraction: Attraction) => void;
  onSelectQuietArea: (area: QuieterAreaRecommendation) => void;
  onRetry: () => void;
  locatingNearMe?: boolean;
};

const SORT_OPTIONS: { value: AttractionSortMode; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "near_me", label: "Near me" },
  { value: "name", label: "A–Z" },
  { value: "quiet_areas", label: "Quiet areas" },
];

export default function AttractionBrowsePanel({
  loadState,
  loadError,
  filteredAttractions,
  totalCount,
  categories,
  searchQuery,
  categoryFilter,
  sortMode,
  highlightedId,
  nearMeError,
  quietAreas = [],
  quietAreasLoading = false,
  quietAreasError,
  locatingQuietAreas = false,
  userCoords,
  onSearchChange,
  onCategoryChange,
  onSortModeChange,
  onNearMe,
  onQuietAreas,
  onSelect,
  onSelectQuietArea,
  onRetry,
  locatingNearMe = false,
}: AttractionBrowsePanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
        Explore
      </p>
      <h2
        className={`${spaceGrotesk.className} mt-2 text-lg font-light text-white`}
      >
        Attractions
      </h2>

      {loadState === "loading" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-white/55">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading attractions…
        </div>
      )}

      {loadState === "error" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-red-400/90">
            {loadError ?? "Could not load attractions."}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {loadState === "empty" && (
        <div className="mt-6 space-y-3">
          <p className="text-sm text-white/55">No attractions available yet.</p>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-white/30 hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {loadState === "ready" && (
        <>
          <p className="mt-2 text-sm text-white/55">
            {sortMode === "quiet_areas"
              ? `${quietAreas.length} quieter area${quietAreas.length === 1 ? "" : "s"} nearby`
              : `${filteredAttractions.length} of ${totalCount} places`}
          </p>

          {sortMode !== "quiet_areas" && (
            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
                aria-hidden
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search attractions…"
                aria-label="Search attractions"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/40"
              />
            </div>
          )}

          {sortMode !== "quiet_areas" && (
            <div className="mt-3 flex flex-wrap gap-2">
              <CategoryChip
                label="All"
                active={categoryFilter === null}
                onClick={() => onCategoryChange(null)}
              />
              {categories.map((category) => (
                <CategoryChip
                  key={category}
                  label={category}
                  active={categoryFilter === category}
                  onClick={() => onCategoryChange(category)}
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {SORT_OPTIONS.map((option) => {
              const isLocating =
                option.value === "near_me"
                  ? locatingNearMe
                  : option.value === "quiet_areas"
                    ? locatingQuietAreas
                    : false;
              const isActive = sortMode === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (option.value === "near_me") {
                      onNearMe();
                      return;
                    }
                    if (option.value === "quiet_areas") {
                      onQuietAreas();
                      return;
                    }
                    onSortModeChange(option.value);
                  }}
                  disabled={isLocating}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
                    isActive
                      ? "border-accent/50 bg-accent/10 text-accent"
                      : "border-white/10 text-white/55 hover:border-white/20 hover:text-white/80"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {isLocating ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      {option.label}
                    </span>
                  ) : (
                    option.label
                  )}
                </button>
              );
            })}
          </div>

          {nearMeError && sortMode === "near_me" && (
            <p className="mt-2 text-xs text-red-400/90">{nearMeError}</p>
          )}

          {quietAreasError && sortMode === "quiet_areas" && (
            <p className="mt-2 text-xs text-red-400/90">{quietAreasError}</p>
          )}

          {quietAreasLoading && sortMode === "quiet_areas" && (
            <div className="mt-6 flex items-center gap-2 text-sm text-white/55">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Finding quieter areas…
            </div>
          )}

          <ul className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pb-2">
            {sortMode === "quiet_areas" ? (
              quietAreas.length === 0 && !quietAreasLoading ? (
                <li className="text-sm text-white/55">
                  {quietAreasError ? "" : "No quieter areas found nearby."}
                </li>
              ) : (
                quietAreas.map((area) => (
                  <li key={area.h3Cell}>
                    <QuieterAreaCard
                      area={area}
                      userCoords={userCoords}
                      onClick={() => onSelectQuietArea(area)}
                    />
                  </li>
                ))
              )
            ) : filteredAttractions.length === 0 ? (
              <li className="text-sm text-white/55">No matches for your filters.</li>
            ) : (
              filteredAttractions.map((attraction) => {
                const distance =
                  sortMode === "near_me" && userCoords
                    ? haversineDistanceKm(
                        userCoords.lat,
                        userCoords.lng,
                        attraction.lat,
                        attraction.lng,
                      )
                    : null;

                return (
                  <li key={attraction.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(attraction)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors ${
                        highlightedId === attraction.id
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
                          <div className="flex items-center gap-2">
                            <p
                              className={`${spaceGrotesk.className} min-w-0 truncate text-sm font-semibold text-white`}
                            >
                              {attraction.name}
                            </p>
                            <CrowdBadge level={attraction.crowd?.level} />
                          </div>
                          <p className="mt-1 truncate text-xs text-white/55">
                            {attraction.category}
                            {attraction.neighborhood
                              ? ` · ${attraction.neighborhood}`
                              : ""}
                          </p>
                          {distance != null && (
                            <p className="mt-0.5 text-[11px] text-white/40">
                              {formatDistanceKm(distance)} away
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </>
      )}
    </div>
  );
}

function CrowdBadge({ level }: { level?: string }) {
  const meta = crowdLevelMeta(level);
  if (!meta) return null;

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeClassName}`}
    >
      {meta.label}
    </span>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-white/10 text-white/55 hover:border-white/20 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );
}
