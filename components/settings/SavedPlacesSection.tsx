"use client";

import { useState } from "react";
import Link from "next/link";
import { Compass, Heart } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SavedPlaceCard } from "@/components/settings/SavedPlaceCard";
import { Toast } from "@/components/Toast";
import { removeFavoritePlaceAction } from "@/lib/favorites/actions";
import type { FavoritePlace } from "@/lib/favorites/types";

type SavedPlacesSectionProps = {
  initialPlaces: FavoritePlace[];
};

export function SavedPlacesSection({
  initialPlaces,
}: SavedPlacesSectionProps) {
  const [places, setPlaces] = useState(initialPlaces);
  const [pendingRemoval, setPendingRemoval] = useState<FavoritePlace | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  async function handleConfirmRemove() {
    if (!pendingRemoval || isRemoving) return;

    const place = pendingRemoval;
    setIsRemoving(true);
    try {
      await removeFavoritePlaceAction(place.placeKey);
      setPlaces((current) =>
        current.filter((item) => item.placeKey !== place.placeKey),
      );
      setPendingRemoval(null);
      setToast({
        message: `Removed ${place.name} from saved places.`,
        variant: "success",
      });
    } catch {
      setToast({
        message: "Could not remove this place. Please try again.",
        variant: "error",
      });
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <section aria-labelledby="saved-places-heading">
      <Toast
        message={toast?.message ?? ""}
        open={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove saved place?"
        description={`This will remove ${pendingRemoval?.name ?? "this place"} from your saved places.`}
        confirmLabel="Remove"
        isLoading={isRemoving}
        onConfirm={() => void handleConfirmRemove()}
        onCancel={() => setPendingRemoval(null)}
      />

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Saved places
        </p>
        <h2
          id="saved-places-heading"
          className={`${spaceGrotesk.className} mt-2 text-xl font-light text-white`}
        >
          Places you want to revisit
        </h2>
      </div>

      {places.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-accent">
            <Heart className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-4 text-sm text-white/55">
            No saved places yet. Open a location on the map and tap Save place.
          </p>
          <Link
            href="/map"
            className={`${spaceGrotesk.className} mt-5 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-xs font-bold text-surface transition-opacity hover:opacity-90`}
          >
            <Compass className="h-3.5 w-3.5" aria-hidden />
            Explore the map
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {places.map((place) => (
            <SavedPlaceCard
              key={place.placeKey}
              place={place}
              onRemove={setPendingRemoval}
              isRemoving={isRemoving && pendingRemoval?.placeKey === place.placeKey}
            />
          ))}
        </div>
      )}
    </section>
  );
}
