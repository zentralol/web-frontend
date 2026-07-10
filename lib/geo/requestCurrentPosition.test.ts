import { afterEach, describe, expect, it, vi } from "vitest";
import { requestCurrentPosition } from "./requestCurrentPosition";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("requestCurrentPosition", () => {
  it("resolves with lat/lng on success", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (onSuccess: PositionCallback) =>
          onSuccess({
            coords: { latitude: 40.7128, longitude: -74.006 },
          } as GeolocationPosition),
      },
    });

    await expect(requestCurrentPosition()).resolves.toEqual({
      lat: 40.7128,
      lng: -74.006,
    });
  });

  it("rejects when the user denies or the request errors", async () => {
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: (
          _onSuccess: PositionCallback,
          onError: PositionErrorCallback,
        ) => onError({ code: 1, message: "denied" } as GeolocationPositionError),
      },
    });

    await expect(requestCurrentPosition()).rejects.toBeDefined();
  });

  it("rejects when geolocation is unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(requestCurrentPosition()).rejects.toThrow(/not available/);
  });
});
