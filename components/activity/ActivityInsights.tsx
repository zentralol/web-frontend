"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Attraction } from "@/lib/attractions/types";
import type { AttractionPredictionRow } from "@/lib/attractions/types";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import {
  fetchCrowdForecast,
  type CrowdForecastResult,
} from "@/lib/activity/fetchCrowdForecast";
import {
  rankTopLandmarksFromPredictions,
  type LandmarksSortOrder,
} from "@/lib/activity/fetchTopLandmarksFromPredictions";
import { useGeolocation, type Coords } from "@/lib/geo/useGeolocation";
import { requestCurrentPosition } from "@/lib/geo/requestCurrentPosition";
import { CrowdForecastSection } from "./CrowdForecastSection";
import { TopLandmarksSection } from "./TopLandmarksSection";

interface ActivityInsightsProps {
  attractions: Attraction[];
  predictions: AttractionPredictionRow[];
}

type ForecastState = "idle" | "loading" | "ready" | "error";

export function ActivityInsights({ attractions, predictions }: ActivityInsightsProps) {
  const backendFetch = useAuthenticatedBackendFetch();
  const { coords: passiveCoords } = useGeolocation();

  const [manualCoords, setManualCoords] = useState<Coords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const userCoords = manualCoords ?? passiveCoords;

  const [sortOrder, setSortOrder] = useState<LandmarksSortOrder>("busiest_first");

  const { landmarks: displayedLandmarks, targetTime } = useMemo(
    () =>
      rankTopLandmarksFromPredictions(attractions, predictions, {
        sortOrder,
        limit: 5,
      }),
    [attractions, predictions, sortOrder],
  );

  const [forecastState, setForecastState] = useState<ForecastState>("idle");
  const [forecastResult, setForecastResult] = useState<CrowdForecastResult>({
    forecast: [],
  });

  useEffect(() => {
    if (!userCoords) {
      return;
    }

    const { lat, lng } = userCoords;
    let cancelled = false;

    async function loadForecast() {
      setForecastState("loading");
      const result = await fetchCrowdForecast(lat, lng, backendFetch);
      if (cancelled) return;

      setForecastResult(result);
      setForecastState(
        result.error && result.forecast.length === 0 ? "error" : "ready",
      );
    }

    void loadForecast();

    return () => {
      cancelled = true;
    };
  }, [userCoords, backendFetch]);

  const handleUseLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const position = await requestCurrentPosition();
      setManualCoords(position);
    } catch {
      setLocationError(
        "Could not access your location. Check browser permissions.",
      );
    } finally {
      setIsLocating(false);
    }
  }, []);

  return (
    <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="h-full lg:col-span-7">
        <CrowdForecastSection
          state={userCoords ? forecastState : "needs_location"}
          result={forecastResult}
          isLocating={isLocating}
          locationError={locationError}
          onUseLocation={() => {
            void handleUseLocation();
          }}
        />
      </div>

      <div className="h-full lg:col-span-5">
        <TopLandmarksSection
          landmarks={displayedLandmarks}
          targetTime={targetTime}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
        />
      </div>
    </div>
  );
}
