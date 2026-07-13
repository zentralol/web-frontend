import { describe, expect, it, vi } from "vitest";
import {
  buildHourlyForecastTargetTimes,
  fetchCrowdForecast,
  FORECAST_LIMIT,
} from "./fetchCrowdForecast";

describe("buildHourlyForecastTargetTimes", () => {
  it("returns hourly naive ISO slots in New York time", () => {
    const start = new Date("2026-07-12T18:00:00.000Z");
    const times = buildHourlyForecastTargetTimes(start, 3);

    expect(times).toHaveLength(3);
    expect(times[0]).toBe("2026-07-12T14:00:00");
    expect(times[1]).toBe("2026-07-12T15:00:00");
    expect(times[2]).toBe("2026-07-12T16:00:00");
  });

  it("defaults to FORECAST_LIMIT slots when building the full window", () => {
    const times = buildHourlyForecastTargetTimes(
      new Date("2026-07-12T18:00:00.000Z"),
      FORECAST_LIMIT,
    );
    expect(times).toHaveLength(FORECAST_LIMIT);
  });
});

describe("fetchCrowdForecast", () => {
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

  it("returns the API error message for other failures", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        success: false,
        error: { message: "Prediction service unavailable." },
      }),
    }));

    const result = await fetchCrowdForecast(40.758, -73.9855, backendFetch);

    expect(result.forecast).toEqual([]);
    expect(result.error).toBe("Prediction service unavailable.");
  });
});
