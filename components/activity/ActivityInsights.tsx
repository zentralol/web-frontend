"use client";

import { useCallback, useEffect, useState } from "react";
import type { Attraction } from "@/lib/attractions/types";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import {
  fetchCrowdForecast,
  type CrowdForecastResult,
} from "@/lib/activity/fetchCrowdForecast";
import {
  fetchTopLandmarks,
  type TopLandmarksResult,
} from "@/lib/activity/fetchTopLandmarks";
import { useGeolocation, type Coords } from "@/lib/geo/useGeolocation";
import { requestCurrentPosition } from "@/lib/geo/requestCurrentPosition";
import { CrowdForecastSection } from "./CrowdForecastSection";
import { TopLandmarksSection } from "./TopLandmarksSection";

interface ActivityInsightsProps {
  attractions: Attraction[];
}

type LoadState = "idle" | "loading" | "ready" | "error";

export function ActivityInsights({ attractions }: ActivityInsightsProps) {
  const backendFetch = useAuthenticatedBackendFetch();
  const { coords: passiveCoords } = useGeolocation();

  const [manualCoords, setManualCoords] = useState<Coords | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const userCoords = manualCoords ?? passiveCoords;

  const [landmarksState, setLandmarksState] = useState<LoadState>("idle");
  const [landmarksResult, setLandmarksResult] = useState<TopLandmarksResult>({
    landmarks: [],
    targetTime: "",
  });

  const [forecastState, setForecastState] = useState<LoadState>("idle");
  const [forecastResult, setForecastResult] = useState<CrowdForecastResult>({
    forecast: [],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadLandmarks() {
      if (attractions.length === 0) {
        setLandmarksState("ready");
        setLandmarksResult({ landmarks: [], targetTime: "" });
        return;
      }

      setLandmarksState("loading");
      const result = await fetchTopLandmarks(attractions, backendFetch);
      if (cancelled) return;

      setLandmarksResult(result);
      setLandmarksState(result.error ? "error" : "ready");
    }

    void loadLandmarks();

    return () => {
      cancelled = true;
    };
  }, [attractions, backendFetch]);

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
    <div className="mb-12 grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
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

      <div className="lg:col-span-5">
        <TopLandmarksSection state={landmarksState} result={landmarksResult} />
      </div>
    </div>
  );
}
