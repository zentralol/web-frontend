"use client";

import { useRouter } from "next/navigation";
import { MapPin, Navigation } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { buildRoutesHref as buildRoutesHrefFromCoords } from "@/lib/attractions/buildRoutesHref";
import type {
  PlaceCardItem,
  PlaceCardsData,
} from "@/lib/assistant/agentStreamAdapter";

/** Deep-link to the route planner with this place preset as the destination. */
export function buildRoutesHref(item: PlaceCardItem): string {
  return buildRoutesHrefFromCoords({
    lat: item.lat,
    lng: item.lng,
    name: item.name,
  });
}

export function PlaceCards({ items }: PlaceCardsData) {
  const router = useRouter();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {items.map((item, index) => (
        <div
          key={item.candidateId || `${item.name}-${index}`}
          className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                <h4
                  className={`${spaceGrotesk.className} truncate text-sm font-semibold text-white`}
                >
                  {item.name}
                </h4>
              </div>
              {item.subtitle && (
                <p className="mt-1 truncate text-xs text-white/55">
                  {item.subtitle}
                </p>
              )}
              {item.detail && (
                <p className="mt-0.5 truncate text-[11px] text-white/40">
                  {item.detail}
                </p>
              )}
              {item.reason && (
                <p className="mt-1 text-[11px] text-accent/75">{item.reason}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => router.push(buildRoutesHref(item))}
              className={`${spaceGrotesk.className} flex w-full shrink-0 items-center justify-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-[11px] font-bold text-surface transition-opacity hover:opacity-90 sm:w-auto`}
            >
              <Navigation className="h-3 w-3" aria-hidden />
              Take me there
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
