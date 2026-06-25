"use client";

import { Bike, Footprints, MapPin, Train } from "lucide-react";
import PlaceAutocompleteInput from "@/components/routes/PlaceAutocompleteInput";
import { spaceGrotesk, jetbrainsMono } from "@/app/ui/fonts";
import type { RouteLocation, RouteOption, TravelMode } from "@/lib/routes/types";

const MODE_ICONS: Record<TravelMode, typeof Footprints> = {
  walk: Footprints,
  transit: Train,
  bicycle: Bike,
};

type PickTarget = "origin" | "destination";

const MAP_PICK_HINTS: Record<PickTarget, string> = {
  origin: "Tip: You can also click the map to set your origin.",
  destination: "Tip: You can also click the map to set your destination.",
};

type RouteSidebarProps = {
  origin: RouteLocation;
  destination: RouteLocation;
  routes: RouteOption[];
  selectedMode: TravelMode;
  loading: boolean;
  planning: boolean;
  canPlan: boolean;
  pickTarget: PickTarget;
  onOriginChange: (location: RouteLocation) => void;
  onDestinationChange: (location: RouteLocation) => void;
  onPickTargetChange: (target: PickTarget) => void;
  onPlanRoute: () => void;
  onSelectMode: (mode: TravelMode) => void;
};

function RouteCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex justify-between">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-4 w-10 rounded bg-white/10" />
      </div>
      <div className="mt-3 h-3 w-full rounded bg-white/10" />
      <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
    </div>
  );
}

export default function RouteSidebar({
  origin,
  destination,
  routes,
  selectedMode,
  loading,
  planning,
  canPlan,
  pickTarget,
  onOriginChange,
  onDestinationChange,
  onPickTargetChange,
  onPlanRoute,
  onSelectMode,
}: RouteSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-surface lg:w-[380px] lg:border-b-0 lg:border-r">
      <div className="space-y-3 border-b border-white/10 p-4">
        <PlaceAutocompleteInput
          variant="origin"
          value={origin}
          active={pickTarget === "origin"}
          disabled={planning}
          onChange={onOriginChange}
          onFocus={() => onPickTargetChange("origin")}
        />
        <PlaceAutocompleteInput
          variant="destination"
          value={destination}
          active={pickTarget === "destination"}
          disabled={planning}
          onChange={onDestinationChange}
          onFocus={() => onPickTargetChange("destination")}
        />

        <p className="flex items-start gap-2 text-xs text-white/45">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {planning
              ? "Planning route. Inputs are locked."
              : MAP_PICK_HINTS[pickTarget]}
          </span>
        </p>

        <button
          type="button"
          onClick={onPlanRoute}
          disabled={!canPlan || planning}
          className={`${spaceGrotesk.className} w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {planning ? "Planning…" : "Plan Route"}
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-4">
        {loading && routes.length === 0 ? (
          <>
            <RouteCardSkeleton />
            <RouteCardSkeleton />
            <RouteCardSkeleton />
          </>
        ) : routes.length === 0 ? (
          <p className="py-6 text-center text-xs leading-relaxed text-white/45">
            Set your origin and destination, then tap Plan Route.
          </p>
        ) : (
          routes.map((route) => {
            const Icon = MODE_ICONS[route.id];
            const isSelected = route.id === selectedMode;
            const isDisabled = Boolean(route.error);

            return (
              <button
                key={route.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onSelectMode(route.id)}
                className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-accent bg-accent/5 shadow-[0_0_0_1px_rgba(255,220,161,0.3)]"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-accent" />
                    <h3
                      className={`${spaceGrotesk.className} text-sm font-semibold text-white`}
                    >
                      {route.name}
                    </h3>
                  </div>
                  {route.durationMinutes > 0 && (
                    <span
                      className={`shrink-0 text-sm font-bold text-white ${spaceGrotesk.className}`}
                    >
                      {route.durationMinutes} min
                    </span>
                  )}
                </div>

                <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-white/50">
                  {route.error ?? route.description}
                </p>

                {!route.error && route.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {route.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          tag.startsWith("BUSY STATION")
                            ? "bg-[#ff3b30]/15 text-[#ff3b30]"
                            : tag.startsWith("FASTEST")
                              ? "text-accent"
                              : "bg-white/10 text-white/60"
                        } ${jetbrainsMono.className}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
