import { describe, expect, it, vi } from "vitest";
import {
  fetchCrowdForecast,
  FORECAST_LIMIT,
} from "./fetchCrowdForecast";

function mockBackendFetch(options: {
  currentOk?: boolean;
  forecastOk?: boolean;
  currentPayload?: unknown;
  forecastPayload?: unknown;
}) {
  const {
    currentOk = true,
    forecastOk = true,
    currentPayload,
    forecastPayload,
  } = options;

  return vi.fn(async (url: string) => {
    if (String(url).includes("/predictions/forecast")) {
      return {
        ok: forecastOk,
        json: async () =>
          forecastPayload ?? {
            success: true,
            data: {
              forecast: Array.from({ length: FORECAST_LIMIT }, (_, index) => ({
                timestamp: `2026-07-12T${String(14 + index).padStart(2, "0")}:00:00`,
                busynessScore: 40 + index,
                busynessLevel: "moderate",
              })),
            },
          },
      };
    }

    return {
      ok: currentOk,
      json: async () =>
        currentPayload ?? {
          success: true,
          data: {
            prediction: {
              busynessScore: 55,
              busynessLevel: "busy",
            },
          },
        },
    };
  });
}

describe("fetchCrowdForecast", () => {
  it("uses one current prediction request and one forecast request", async () => {
    const backendFetch = mockBackendFetch({});

    const result = await fetchCrowdForecast(40.758, -73.9855, backendFetch);

    expect(backendFetch).toHaveBeenCalledTimes(2);
    expect(result.current).toEqual({
      score: 55,
      level: "busy",
      period: undefined,
      confidence: undefined,
    });
    expect(result.forecast).toHaveLength(FORECAST_LIMIT);
    expect(result.error).toBeUndefined();
  });

  it("returns a Manhattan coverage message when the location is out of coverage", async () => {
    const backendFetch = mockBackendFetch({
      currentOk: false,
      forecastOk: false,
      currentPayload: {
        success: false,
        error: {
          code: "LOCATION_OUT_OF_COVERAGE",
          message: "Prediction is currently available for Manhattan only",
        },
      },
      forecastPayload: {
        success: false,
        error: {
          code: "LOCATION_OUT_OF_COVERAGE",
          message: "Prediction is currently available for Manhattan only",
        },
      },
    });

    const result = await fetchCrowdForecast(40.6, -73.9855, backendFetch);

    expect(result.forecast).toEqual([]);
    expect(result.error).toBe("Crowd forecast is only available in Manhattan.");
    expect(backendFetch).toHaveBeenCalledTimes(2);
  });

  it("returns the API error message when only the current request fails", async () => {
    const backendFetch = mockBackendFetch({
      currentOk: false,
      currentPayload: {
        success: false,
        error: { message: "Prediction service unavailable." },
      },
    });

    const result = await fetchCrowdForecast(40.758, -73.9855, backendFetch);

    expect(result.forecast).toHaveLength(FORECAST_LIMIT);
    expect(result.error).toBe("Prediction service unavailable.");
  });
});
