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
  it("prepends the current hour and requests seven future forecast points", async () => {
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
    expect(result.forecast[0]?.score).toBe(55);

    const forecastCall = backendFetch.mock.calls.find(([url]) =>
      String(url).includes("/predictions/forecast"),
    );
    expect(String(forecastCall?.[0])).toContain("limit=7");
    expect(result.error).toBeUndefined();
  });

  it("returns a Manhattan coverage message when the location is out of coverage", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: "LOCATION_OUT_OF_COVERAGE",
          message: "Prediction is currently available for Manhattan only",
        },
      }),
    }));

    const result = await fetchCrowdForecast(40.6, -73.9855, backendFetch);

    expect(result.forecast).toEqual([]);
    expect(result.error).toBe("Crowd forecast is only available in Manhattan.");
    expect(backendFetch).toHaveBeenCalledTimes(1);
  });

  it("returns the API error message when only the current request fails after forecast fallback", async () => {
    const backendFetch = vi.fn(async (url: string) => {
      if (String(url).includes("/predictions/forecast")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              forecast: Array.from({ length: FORECAST_LIMIT }, (_, index) => ({
                timestamp: `2026-07-12T${String(14 + index).padStart(2, "0")}:00:00`,
                busynessScore: 40 + index,
                busynessLevel: "moderate",
              })),
            },
          }),
        };
      }

      return {
        ok: false,
        json: async () => ({
          success: false,
          error: { message: "Prediction service unavailable." },
        }),
      };
    });

    const result = await fetchCrowdForecast(40.758, -73.9855, backendFetch);

    expect(result.forecast).toHaveLength(FORECAST_LIMIT);
    expect(result.error).toBeUndefined();
  });
});
