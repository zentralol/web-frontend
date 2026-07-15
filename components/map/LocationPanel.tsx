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

type QuietTimesRequestState = {
  selectionKey: string | null;
  loading: boolean;
  data: QuietTimesResponse | null;
  error: string | null;
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
  const [quietTimesRequest, setQuietTimesRequest] =
    useState<QuietTimesRequestState>({
      selectionKey: null,
      loading: false,
      data: null,
      error: null,
    });
  const selectedLat = selection.status === "ready" ? selection.location.lat : null;
  const selectedLng = selection.status === "ready" ? selection.location.lng : null;
  const selectedLocationKey =
    selectedLat == null || selectedLng == null
      ? null
      : `${selectedLat}:${selectedLng}`;

  useEffect(() => {
    if (selectedLat == null || selectedLng == null) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setQuietTimesRequest({
        selectionKey: selectedLocationKey,
        loading: true,
        data: null,
        error: null,
      });
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
          setQuietTimesRequest({
            selectionKey: selectedLocationKey,
            loading: false,
            data: result.data,
            error: null,
          });
        } else {
          setQuietTimesRequest({
            selectionKey: selectedLocationKey,
            loading: false,
            data: null,
            error: result.error,
          });
        }
      } catch (error) {
        if (cancelled) return;
        setQuietTimesRequest({
          selectionKey: selectedLocationKey,
          loading: false,
          data: null,
          error:
            error instanceof Error
              ? error.message
              : "Could not load quieter times.",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedLat, selectedLng, selectedLocationKey, backendFetch]);

  const quietTimesForSelection =
    quietTimesRequest.selectionKey === selectedLocationKey
      ? quietTimesRequest
      : null;

  const quietTimesProps = {
    quietTimesData: quietTimesForSelection?.data ?? null,
    quietTimesLoading:
      selectedLocationKey !== null &&
      (quietTimesForSelection?.loading ?? true),
    quietTimesError: quietTimesForSelection?.error ?? null,
  };

  return (
    <>
      <aside className="hidden h-full min-h-0 w-96 shrink-0 flex-col overflow-hidden border-l border-white/10 bg-surface p-6 lg:flex">
        {isIdle ? (
          <AttractionBrowsePanel {...browsePanelProps} />
        ) : (
          <div
            data-testid="desktop-location-detail-scroller"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1"
          >
            <LocationPanelContent
              selection={selection}
              onBack={onBack}
              favoritePlaceKeys={favoritePlaceKeys}
              onFavoriteChange={onFavoriteChange}
              {...quietTimesProps}
            />
          </div>
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
