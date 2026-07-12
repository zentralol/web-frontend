"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { SavedTripCard } from "@/components/activity/SavedTripCard";
import { Toast } from "@/components/Toast";
import { deleteSavedItineraryAction } from "@/lib/itineraries/actions";
import type { SavedItinerary } from "@/lib/itineraries/types";

interface SavedTripsProps {
  initialItineraries: SavedItinerary[];
}

export function SavedTrips({ initialItineraries }: SavedTripsProps) {
  const [itineraries, setItineraries] =
    useState<SavedItinerary[]>(initialItineraries);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const deletedTrip = itineraries.find((item) => item.id === id);
    const previous = itineraries;
    // Optimistically remove, restore on failure.
    setItineraries((current) => current.filter((item) => item.id !== id));
    try {
      await deleteSavedItineraryAction(id);
      if (deletedTrip) {
        setSuccessToast(`"${deletedTrip.title}" deleted successfully`);
      }
    } catch (error) {
      setItineraries(previous);
      throw error;
    }
  };

  if (itineraries.length === 0) {
    return (
      <>
      <Toast
        message={successToast ?? ""}
        open={successToast !== null}
        onClose={() => setSuccessToast(null)}
      />
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-accent">
          <Compass className="h-5 w-5" aria-hidden />
        </div>
        <p className="mt-4 text-sm text-white/60">
          No saved trips yet. Plan one with the assistant and tap{" "}
          <span className="text-white/80">Save trip</span> to keep it here.
        </p>
        <Link
          href="/assistant"
          className={`${spaceGrotesk.className} mt-5 inline-flex items-center rounded-lg bg-accent px-4 py-2 text-xs font-bold text-surface transition-opacity hover:opacity-90`}
        >
          Plan a trip
        </Link>
      </div>
      </>
    );
  }

  return (
    <>
    <Toast
      message={successToast ?? ""}
      open={successToast !== null}
      onClose={() => setSuccessToast(null)}
    />
    <div className="space-y-4">
      {itineraries.map((itinerary) => (
        <SavedTripCard
          key={itinerary.id}
          itinerary={itinerary}
          onDelete={handleDelete}
        />
      ))}
    </div>
    </>
  );
}
