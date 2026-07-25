import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchCrowdForecast,
  FORECAST_LIMIT,
} from "./fetchCrowdForecast";

function hour12FromLabel(label: string): number {
  const match = label.match(/^(\d{1,2}):\d{2} (AM|PM)$/);
  if (!match) {
    throw new Error(`Unexpected forecast label: ${label}`);
  }
  let hour = Number(match[1]);
  const suffix = match[2];
  if (suffix === "AM" && hour === 12) hour = 0;
  if (suffix === "PM" && hour !== 12) hour += 12;
  return hour;
}

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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("keeps Manhattan wall-clock labels monotonic when now is prepended to naive forecast points", async () => {
    // 10:15:30 UTC = 06:15:30 America/New_York (EDT)
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T10:15:30.000Z"));

    const futureHours = FORECAST_LIMIT - 1;
    const backendFetch = mockBackendFetch({
      forecastPayload: {
        success: true,
        data: {
          forecast: Array.from({ length: futureHours }, (_, index) => ({
            timestamp: `2026-07-25T${String(7 + index).padStart(2, "0")}:15:30`,
            busynessScore: 40 + index,
            busynessLevel: "moderate",
          })),
        },
      },
    });

    const result = await fetchCrowdForecast(40.758, -73.9855, backendFetch);

    expect(result.forecast).toHaveLength(FORECAST_LIMIT);
    expect(result.forecast[0]?.timestamp).toBe("6:15 AM");
    expect(result.forecast[1]?.timestamp).toBe("7:15 AM");
    expect(result.forecast[2]?.timestamp).toBe("8:15 AM");

    const hours = result.forecast.map((point) =>
      hour12FromLabel(point.timestamp),
    );
    for (let i = 1; i < hours.length; i += 1) {
      const prev = hours[i - 1]!;
      const next = hours[i]!;
      const stepped = (prev + 1) % 24;
      expect(next).toBe(stepped);
    }
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
