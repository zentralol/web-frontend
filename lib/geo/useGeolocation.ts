"use client";

import { useEffect, useState } from "react";

export type Coords = { lat: number; lng: number };

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60_000,
};

/**
 * Requests the device location once on mount. Degrades quietly: if the browser
 * has no geolocation, or the user denies or the request errors, `coords` stays
 * null and callers simply proceed without a location.
 */
export function useGeolocation(): { coords: Coords | null } {
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Denied, unavailable, or timed out: proceed without a location.
      },
      GEOLOCATION_OPTIONS,
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { coords };
}
