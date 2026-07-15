"use client";

import { useEffect, useState } from "react";
import LocationBottomSheet from "@/components/map/LocationBottomSheet";
import AttractionBrowsePanel, {
  type AttractionBrowsePanelProps,
} from "@/components/map/AttractionBrowsePanel";
import { LocationPanelContent } from "@/components/map/LocationPanelContent";
import type { LocationSelectionState } from "@/lib/map/types";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import { fetchQuietTimes } from "@/lib/recommendations/fetchRecommendations";
import type { QuietTimesResponse } from "@/lib/recommendations/types";
import { addHoursInNewYork, formatInNewYork } from "@/lib/time/manhattanTime";

type LocationPanelProps = {
  selection: LocationSelectionState;
  onDismiss?: () => void;
  onBack?: () => void;
  browsePanelProps: AttractionBrowsePanelProps;
  favoritePlaceKeys?: string[];
  onFavoriteChange?: (placeKey: string, isFavorite: boolean) => void;
};

export default function LocationPanel({
  selection,
  onDismiss,
  onBack,
  browsePanelProps,
  favoritePlaceKeys = [],
  onFavoriteChange,
}: LocationPanelProps) {
  const isIdle = selection.status === "idle";
  const backendFetch = useAuthenticatedBackendFetch();
  const [quietTimesData, setQuietTimesData] = useState<QuietTimesResponse | null>(null);
  const [quietTimesLoading, setQuietTimesLoading] = useState(false);
  const [quietTimesError, setQuietTimesError] = useState<string | null>(null);
  const selectedLat = selection.status === "ready" ? selection.location.lat : null;
  const selectedLng = selection.status === "ready" ? selection.location.lng : null;

  useEffect(() => {
    if (selectedLat == null || selectedLng == null) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setQuietTimesLoading(true);
      setQuietTimesData(null);
      setQuietTimesError(null);
      try {
        const now = new Date();
        const currentTime = formatInNewYork(now);
        const result = await fetchQuietTimes(
          {
            lat: selectedLat,
            lng: selectedLng,
            targetTime: currentTime,
            startTime: currentTime,
            endTime: formatInNewYork(addHoursInNewYork(now, 24)),
            limit: 24,
          },
          backendFetch,
        );
        if (cancelled) return;
        if (result.ok) {
          setQuietTimesData(result.data);
        } else {
          setQuietTimesError(result.error);
        }
      } catch (error) {
        if (cancelled) return;
        setQuietTimesError(
          error instanceof Error
            ? error.message
            : "Could not load quieter times.",
        );
      } finally {
        if (!cancelled) {
          setQuietTimesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLat, selectedLng, backendFetch]);

  const quietTimesProps = {
    quietTimesData,
    quietTimesLoading,
    quietTimesError,
  };

  return (
    <>
      <aside className="hidden w-96 shrink-0 flex-col border-l border-white/10 bg-surface p-6 lg:flex">
        {isIdle ? (
          <AttractionBrowsePanel {...browsePanelProps} />
        ) : (
          <LocationPanelContent
            selection={selection}
            onBack={onBack}
            favoritePlaceKeys={favoritePlaceKeys}
            onFavoriteChange={onFavoriteChange}
            {...quietTimesProps}
          />
        )}
      </aside>
      <LocationBottomSheet
        selection={selection}
        onDismiss={onDismiss}
        onBack={onBack}
        favoritePlaceKeys={favoritePlaceKeys}
        onFavoriteChange={onFavoriteChange}
        {...quietTimesProps}
      />
    </>
  );
}
