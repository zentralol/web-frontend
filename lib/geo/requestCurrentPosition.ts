import { DEMO_USER_COORDS, getDemoModeClient } from "@/lib/demo/mode";

export type Coords = { lat: number; lng: number };

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60_000,
};

/**
 * One-shot, promise-based device location for on-demand "use my current
 * location" actions. Rejects when geolocation is unsupported or the user denies
 * / the request errors, so callers can surface a message.
 *
 * In demo mode, returns fixed Manhattan coords without calling the browser API.
 */
export function requestCurrentPosition(): Promise<Coords> {
  if (getDemoModeClient()) {
    return Promise.resolve({ ...DEMO_USER_COORDS });
  }

  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Location is not available in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }),
      (error) => reject(error),
      GEOLOCATION_OPTIONS,
    );
  });
}
