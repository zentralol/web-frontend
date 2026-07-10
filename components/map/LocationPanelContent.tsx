import Link from "next/link";
import { ArrowLeft, Navigation } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { buildRoutesHref } from "@/lib/attractions/buildRoutesHref";
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

export function LocationPanelContent({
  selection,
  onBack,
}: {
  selection: LocationSelectionState;
  onBack?: () => void;
}) {
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
            {selection.location.busyness ? (
              <div className="mt-2 space-y-2 text-sm text-white/55">
                <p className="text-white/80">
                  {formatBusynessLevel(selection.location.busyness.level)} ·{" "}
                  {selection.location.busyness.score}
                </p>
                {selection.location.forecast &&
                  selection.location.forecast.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.15em] text-accent/70">
                        Next 6 hours
                      </p>
                      <ul className="mt-2 space-y-1 text-white/55">
                        {selection.location.forecast.map((item) => (
                          <li key={`${item.timestamp}-${item.level}-${item.score}`}>
                            {item.score} ({formatBusynessLevel(item.level)})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/55">
                {selection.location.busynessError ?? "Busyness data unavailable."}
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
