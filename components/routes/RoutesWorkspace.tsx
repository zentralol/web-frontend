"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, type ReadonlyURLSearchParams } from "next/navigation";
import { APIProvider } from "@vis.gl/react-google-maps";
import RouteActionBar from "@/components/routes/RouteActionBar";
import RouteMap from "@/components/routes/RouteMap";
import RouteSidebar from "@/components/routes/RouteSidebar";
import { requestCurrentPosition } from "@/lib/geo/requestCurrentPosition";
import { fetchRouteOptions } from "@/lib/routes/fetchRouteOptions";
import {
  DEFAULT_DESTINATION,
  DEFAULT_ORIGIN,
  type RouteLocation,
  type RouteOption,
  type TravelMode,
} from "@/lib/routes/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type PickTarget = "origin" | "destination";

function locationsEqual(a: RouteLocation, b: RouteLocation): boolean {
  return a.lat === b.lat && a.lng === b.lng;
}

// Read a preset destination from the "take me there" deep link
// (/routes?destLat=..&destLng=..&destLabel=..).
function destinationFromParams(
  params: ReadonlyURLSearchParams,
): RouteLocation | null {
  const latRaw = params.get("destLat");
  const lngRaw = params.get("destLng");
  const label = params.get("destLabel");
  if (!latRaw || !lngRaw || !label) {
    return null;
  }
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  return { lat, lng, label };
}

export default function RoutesWorkspace() {
  const searchParams = useSearchParams();
  const prefilledDestination = destinationFromParams(searchParams);

  const [origin, setOrigin] = useState<RouteLocation>(DEFAULT_ORIGIN);
  const [destination, setDestination] = useState<RouteLocation>(
    prefilledDestination ?? DEFAULT_DESTINATION,
  );

  // When arriving via a "take me there" link, best-effort set the origin to the
  // user's current location (async, so it never blocks or fails the page).
  useEffect(() => {
    if (!prefilledDestination) return;
    let cancelled = false;
    requestCurrentPosition()
      .then((coords) => {
        if (!cancelled) {
          setOrigin({ lat: coords.lat, lng: coords.lng, label: "Current location" });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // Mount-only: prefilledDestination is derived from the initial URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedMode, setSelectedMode] = useState<TravelMode>("walk");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickTarget, setPickTarget] = useState<PickTarget>("destination");

  const loadRoutes = useCallback(
    async (nextOrigin: RouteLocation, nextDestination: RouteLocation) => {
      if (locationsEqual(nextOrigin, nextDestination)) {
        setError("Origin and destination must differ.");
        setRoutes([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextRoutes = await fetchRouteOptions(nextOrigin, nextDestination);
        setRoutes(nextRoutes);

        setSelectedMode((prev) => {
          const stillValid = nextRoutes.some(
            (route) => route.id === prev && !route.error,
          );
          if (stillValid) return prev;
          return nextRoutes.find((route) => !route.error)?.id ?? prev;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to compute routes";
        setError(message);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handlePlanRoute = useCallback(() => {
    if (loading) return;
    void loadRoutes(origin, destination);
  }, [loadRoutes, loading, origin, destination]);

  const activeRoute = routes.find((route) => route.id === selectedMode);

  const clearRouteResults = useCallback(() => {
    setRoutes([]);
    setError(null);
  }, []);

  const handleOriginChange = useCallback(
    (location: RouteLocation) => {
      if (loading) return;
      const changed = !locationsEqual(origin, location);
      setOrigin(location);
      if (changed) {
        clearRouteResults();
      }
    },
    [clearRouteResults, loading, origin],
  );

  const handleDestinationChange = useCallback(
    (location: RouteLocation) => {
      if (loading) return;
      const changed = !locationsEqual(destination, location);
      setDestination(location);
      if (changed) {
        clearRouteResults();
      }
    },
    [clearRouteResults, destination, loading],
  );

  const handlePickTargetChange = useCallback(
    (target: PickTarget) => {
      if (loading) return;
      setPickTarget(target);
    },
    [loading],
  );

  const handleMapLocationPick = useCallback(
    (location: RouteLocation) => {
      if (loading) return;
      const changed =
        pickTarget === "origin"
          ? !locationsEqual(origin, location)
          : !locationsEqual(destination, location);

      if (pickTarget === "origin") {
        setOrigin(location);
      } else {
        setDestination(location);
      }
      if (changed) {
        clearRouteResults();
      }
    },
    [clearRouteResults, destination, loading, origin, pickTarget],
  );

  if (!API_KEY) {
    return (
      <div className="flex h-[calc(100vh-var(--viewport-top))] items-center justify-center px-6">
        <p className="text-center text-sm text-white/50">
          Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </p>
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={API_KEY}
      libraries={["places", "geometry", "geocoding"]}
    >
      <div className="flex h-[calc(100vh-var(--viewport-top))] flex-col lg:flex-row">
        <RouteSidebar
          origin={origin}
          destination={destination}
          routes={routes}
          selectedMode={selectedMode}
          loading={loading}
          planning={loading}
          canPlan={!locationsEqual(origin, destination)}
          pickTarget={pickTarget}
          onOriginChange={handleOriginChange}
          onDestinationChange={handleDestinationChange}
          onPickTargetChange={handlePickTargetChange}
          onPlanRoute={handlePlanRoute}
          onSelectMode={setSelectedMode}
        />

        <div className="relative min-h-[320px] min-w-0 flex-1 lg:h-auto">
          <div className="absolute inset-0">
            <RouteMap
              origin={origin}
              destination={destination}
              encodedPolyline={activeRoute?.encodedPolyline ?? ""}
              disabled={loading}
              onMapLocationPick={handleMapLocationPick}
            />
          </div>
          <RouteActionBar
            route={activeRoute}
            origin={origin}
            destination={destination}
          />
          {error && (
            <div className="absolute left-4 top-4 z-20 rounded-lg border border-[#ff3b30]/20 bg-surface/95 px-3 py-2 text-xs text-[#ff3b30]">
              {error}
            </div>
          )}
        </div>
      </div>
    </APIProvider>
  );
}
