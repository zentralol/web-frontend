"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Toast } from "@/components/Toast";
import {
  addFavoritePlaceAction,
  removeFavoritePlaceAction,
} from "@/lib/favorites/actions";
import { buildPlaceIdentity } from "@/lib/favorites/placeKey";
import type { SelectedLocation } from "@/lib/map/types";

type FavoritePlaceButtonProps = {
  location: SelectedLocation;
  isFavorite: boolean;
  onFavoriteChange: (placeKey: string, isFavorite: boolean) => void;
};

export function FavoritePlaceButton({
  location,
  isFavorite,
  onFavoriteChange,
}: FavoritePlaceButtonProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const identity = buildPlaceIdentity(location);

  async function handleClick() {
    if (isSaving) return;

    setIsSaving(true);
    try {
      if (isFavorite) {
        await removeFavoritePlaceAction(identity.placeKey);
        onFavoriteChange(identity.placeKey, false);
        setToast({ message: "Removed from saved places.", variant: "success" });
      } else {
        const favorite = await addFavoritePlaceAction({
          name: location.name ?? "Selected location",
          lat: location.lat,
          lng: location.lng,
          address: location.address,
          placeId: location.placeId,
          attractionId: location.attractionId,
          category: location.category,
          neighborhood: location.neighborhood,
        });
        onFavoriteChange(favorite.placeKey, true);
        setToast({ message: "Saved to your places.", variant: "success" });
      }
    } catch {
      setToast({
        message: "Could not update this saved place. Please try again.",
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Toast
        message={toast?.message ?? ""}
        open={toast !== null}
        variant={toast?.variant}
        onClose={() => setToast(null)}
      />
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={isSaving}
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from saved places" : "Save place"}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors disabled:cursor-wait disabled:opacity-60 ${
          isFavorite
            ? "border-accent/40 bg-accent/10 text-accent"
            : "border-white/15 text-white/70 hover:border-white/30 hover:text-white"
        }`}
      >
        {isSaving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : (
          <Heart
            className={`h-3.5 w-3.5 ${isFavorite ? "fill-current" : ""}`}
            aria-hidden
          />
        )}
        {isFavorite ? "Saved" : "Save place"}
      </button>
    </>
  );
}
