"use client";

import Link from "next/link";
import { Heart, Map, MapPin, Navigation, Trash2 } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import {
  buildFavoriteMapHref,
  buildFavoriteRoutesHref,
} from "@/lib/favorites/links";
import type { FavoritePlace } from "@/lib/favorites/types";

type SavedPlaceCardProps = {
  place: FavoritePlace;
  onRemove: (place: FavoritePlace) => void;
  isRemoving?: boolean;
};

function formatSavedDate(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function SavedPlaceCard({
  place,
  onRemove,
  isRemoving = false,
}: SavedPlaceCardProps) {
  const savedDate = formatSavedDate(place.createdAt);
  const secondary = place.address ?? place.neighborhood;

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 shrink-0 fill-current text-accent" aria-hidden />
            <h3
              className={`${spaceGrotesk.className} truncate text-base font-semibold text-white`}
            >
              {place.name}
            </h3>
          </div>
          {secondary ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-white/55">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{secondary}</span>
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-white/40">
            {place.category ? (
              <span className="rounded-full border border-white/10 px-2 py-1">
                {place.category}
              </span>
            ) : null}
            {savedDate ? <span>Saved {savedDate}</span> : null}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(place)}
          disabled={isRemoving}
          aria-label={`Remove ${place.name} from saved places`}
          className="rounded-lg border border-white/10 p-2 text-white/45 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={buildFavoriteMapHref(place)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/65 transition-colors hover:border-white/20 hover:text-white"
        >
          <Map className="h-3.5 w-3.5" aria-hidden />
          View on map
        </Link>
        <Link
          href={buildFavoriteRoutesHref(place)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-bold text-surface transition-opacity hover:opacity-90"
        >
          <Navigation className="h-3.5 w-3.5" aria-hidden />
          Take me there
        </Link>
      </div>
    </article>
  );
}
