"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Navigation } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { buildRoutesHref } from "@/lib/attractions/buildRoutesHref";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import {
  buildFutureHourOptions,
  fetchBusynessAtTime,
} from "@/lib/map/fetchPredictions";
import type { LocationSelectionState } from "@/lib/map/types";

function formatCoordinate(value: number) {
  return value.toFixed(5);
}

function formatBusynessLevel(level: string) {
  return level.replaceAll("_", " ");
}

function SectionHeading() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-28 rounded-full bg-white/15" />
      <div className="h-3 w-56 max-w-full rounded-full bg-white/10" />
    </div>
  );
}

function LocationPanelSkeleton() {
  return (
    <div
      className="mt-6 animate-pulse space-y-6"
      aria-label="Loading location details"
      aria-busy="true"
    >
      <div className="h-6 w-48 rounded-full bg-white/15" />

      <section className="space-y-2">
        <SectionHeading />
        <div className="h-4 w-full rounded-full bg-white/10" />
      </section>

      <section className="space-y-2">
        <div className="h-5 w-24 rounded-full bg-white/15" />
        <div className="h-4 w-40 rounded-full bg-white/10" />
      </section>
    </div>
  );
}

type BusynessDisplay = {
  score: number;
  level: string;
};

export function LocationPanelContent({
  selection,
  onBack,
}: {
  selection: LocationSelectionState;
  onBack?: () => void;
}) {
  const backendFetch = useAuthenticatedBackendFetch();
  const timeOptions = useMemo(() => buildFutureHourOptions(), []);
  const [selectedHoursAhead, setSelectedHoursAhead] = useState(1);
  const [busyness, setBusyness] = useState<BusynessDisplay | null>(null);
  const [busynessError, setBusynessError] = useState<string | null>(null);
  const [isBusynessLoading, setIsBusynessLoading] = useState(false);
  const locationKeyRef = useRef<string | null>(null);
  const pendingLocationResetRef = useRef(false);

  const loadBusyness = useCallback(
    async (
      lat: number,
      lng: number,
      hoursAhead: number,
      initialBusyness?: BusynessDisplay,
    ) => {
      if (initialBusyness) {
        setBusyness(initialBusyness);
        setBusynessError(null);
        setIsBusynessLoading(false);
        return;
      }

      setIsBusynessLoading(true);
      setBusynessError(null);

      const result = await fetchBusynessAtTime(
        lat,
        lng,
        hoursAhead,
        backendFetch,
      );

      if (result.busyness) {
        setBusyness({
          score: result.busyness.score,
          level: result.busyness.level,
        });
        setBusynessError(null);
      } else {
        setBusyness(null);
        setBusynessError(
          result.busynessError ?? "Busyness data unavailable.",
        );
      }

      setIsBusynessLoading(false);
    },
    [backendFetch],
  );

  useEffect(() => {
    if (selection.status !== "ready") {
      return;
    }

    const { lat, lng, busyness: initialBusyness } = selection.location;
    const locationKey = `${lat},${lng}`;
    const isNewLocation = locationKeyRef.current !== locationKey;

    if (isNewLocation) {
      locationKeyRef.current = locationKey;
      pendingLocationResetRef.current = true;
      setSelectedHoursAhead(1);
      void loadBusyness(lat, lng, 1, initialBusyness);
      return;
    }

    if (pendingLocationResetRef.current && selectedHoursAhead === 1) {
      pendingLocationResetRef.current = false;
      return;
    }

    void loadBusyness(lat, lng, selectedHoursAhead);
  }, [selection, selectedHoursAhead, loadBusyness]);

  const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const hoursAhead = Number(event.target.value);
    if (!Number.isFinite(hoursAhead)) {
      return;
    }
    setSelectedHoursAhead(hoursAhead);
  };

  return (
    <>
      {onBack && selection.status !== "idle" && (
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/55 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to explore
        </button>
      )}

      <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
        Location
      </p>

      {selection.status === "loading" && <LocationPanelSkeleton />}

      {selection.status === "error" && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-red-400/90">{selection.message}</p>
          {selection.lat != null && selection.lng != null && (
            <p className="text-sm text-white/55">
              {formatCoordinate(selection.lat)},{" "}
              {formatCoordinate(selection.lng)}
            </p>
          )}
        </div>
      )}

      {selection.status === "ready" && (
        <div className="mt-6 space-y-6">
          <h2
            className={`${spaceGrotesk.className} text-lg font-light text-white`}
          >
            {selection.location.name ?? "Selected location"}
          </h2>

          {selection.location.source === "attraction" && (
            <>
              {selection.location.category && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
                    Category
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    {selection.location.category}
                  </p>
                </div>
              )}

              {selection.location.neighborhood && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
                    Neighborhood
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    {selection.location.neighborhood}
                  </p>
                </div>
              )}

              {selection.location.description && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
                    Description
                  </p>
                  <p className="mt-2 text-sm text-white/55">
                    {selection.location.description}
                  </p>
                </div>
              )}
            </>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
              Busyness
            </p>
            <label className="mt-2 block">
              <span className="sr-only">Forecast time</span>
              <select
                value={selectedHoursAhead}
                onChange={handleTimeChange}
                disabled={isBusynessLoading}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-accent/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {timeOptions.map((option) => (
                  <option
                    key={option.hoursAhead}
                    value={option.hoursAhead}
                    className="bg-surface text-white"
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {isBusynessLoading ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Loading prediction…
              </div>
            ) : busyness ? (
              <p className="mt-3 text-sm text-white/80">
                {formatBusynessLevel(busyness.level)} · {busyness.score}
              </p>
            ) : (
              <p className="mt-3 text-sm text-white/55">
                {busynessError ?? "Busyness data unavailable."}
              </p>
            )}
          </div>

          {selection.location.address && (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
                Address
              </p>
              <p className="mt-2 text-sm text-white/55">
                {selection.location.address}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
              Coordinates
            </p>
            <p className="mt-2 text-sm text-white/55">
              {formatCoordinate(selection.location.lat)},{" "}
              {formatCoordinate(selection.location.lng)}
            </p>
          </div>

          <Link
            href={buildRoutesHref({
              lat: selection.location.lat,
              lng: selection.location.lng,
              name: selection.location.name ?? "Selected location",
            })}
            className={`${spaceGrotesk.className} inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90`}
          >
            <Navigation className="h-3.5 w-3.5" aria-hidden />
            Take me there
          </Link>
        </div>
      )}
    </>
  );
}
