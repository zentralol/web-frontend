"use client";

import { useState } from "react";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { PlaceCards } from "@/components/assistant/PlaceCards";
import { MarkdownMessage } from "@/components/assistant/MarkdownMessage";
import { NoteEditor } from "@/components/activity/NoteEditor";
import type { SavedItinerary } from "@/lib/itineraries/types";
import type { ItinerarySource } from "@/lib/itineraries/types";

const SOURCE_LABELS: Record<ItinerarySource, string> = {
  nearby: "Nearby",
  attractions: "Attractions",
  recommend: "Recommended",
  itinerary: "Itinerary",
  mixed: "Mixed",
};

function formatSavedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
interface SavedTripCardProps {
  itinerary: SavedItinerary;
  onDelete: (id: string) => Promise<void>;
}

export function SavedTripCard({ itinerary, onDelete }: SavedTripCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const placeCount = itinerary.items.length;
  const savedDate = formatSavedDate(itinerary.createdAt);
  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(itinerary.id);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className={`${spaceGrotesk.className} truncate text-base font-semibold text-white`}
          >
            {itinerary.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
            <span className="rounded-full border border-accent/25 bg-accent/10 px-2 py-0.5 font-medium text-accent">
              {SOURCE_LABELS[itinerary.source]}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" aria-hidden />
              {placeCount} {placeCount === 1 ? "place" : "places"}
            </span>
{savedDate && <span>Saved {savedDate}</span>}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Delete ${itinerary.title}`}
          className="flex shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/50 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>

      {itinerary.description && (
        <div className="mt-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm leading-relaxed text-white/70">
          <MarkdownMessage content={itinerary.description} />
        </div>
      )}

      <PlaceCards source={itinerary.source} items={itinerary.items} />

      <NoteEditor itineraryId={itinerary.id} initialNote={itinerary.note} />
    </div>
  );
}
