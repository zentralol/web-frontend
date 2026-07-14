import { describe, expect, test, vi } from "vitest";
import {
  buildFutureHourOptions,
  fetchBusynessData,
  fetchCurrentBusyness,
  fetchForecastSeries,
  MAP_FORECAST_HOURS,
  MAP_MAX_FUTURE_HOURS,
  toForecastTimeLabel,
} from "./fetchPredictions";

describe("buildFutureHourOptions", () => {
  test("generates hourly options from +1h through +8h", () => {
    const now = new Date("2026-07-10T14:00:00.000Z");
    const options = buildFutureHourOptions(now);

    expect(options).toHaveLength(MAP_MAX_FUTURE_HOURS);
    expect(options.map((option) => option.hoursAhead)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ]);
    expect(options[0].label).toBe("In 1 hour · 11:00 AM");
    expect(options[7].label).toBe("In 8 hours · 6:00 PM");
    expect(options[0].targetTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});

describe("fetchCurrentBusyness", () => {
  test("posts prediction request for the current time", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          prediction: {
            busynessScore: 72,
            busynessLevel: "busy",
          },
        },
      }),
    }));

    const result = await fetchCurrentBusyness(40.758, -73.9855, backendFetch);

    expect(result.ok).toBe(true);
    expect(result.busyness).toEqual({
      score: 72,
      level: "busy",
      period: undefined,
      confidence: undefined,
    });
    expect(backendFetch).toHaveBeenCalledTimes(1);

    const [url, init] = backendFetch.mock.calls[0];
    expect(String(url)).toContain("/predictions");
    expect(init?.method).toBe("POST");
  });
});

describe("fetchForecastSeries", () => {
  test("requests forecast series with the configured hour limit", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          forecast: [
            {
              timestamp: "2026-07-10T11:00:00",
              busynessScore: 40,
              busynessLevel: "moderate",
            },
            {
              timestamp: "2026-07-10T12:00:00",
              busynessScore: 55,
              busynessLevel: "busy",
            },
          ],
        },
      }),
    }));

    const result = await fetchForecastSeries(
      40.758,
      -73.9855,
      MAP_FORECAST_HOURS,
      backendFetch,
    );

    expect(result.ok).toBe(true);
    expect(result.forecast).toEqual([
      {
        rawTimestamp: "2026-07-10T11:00:00",
        timestamp: "11:00 AM",
        score: 40,
        level: "moderate",
      },
      {
        rawTimestamp: "2026-07-10T12:00:00",
        timestamp: "12:00 PM",
        score: 55,
        level: "busy",
      },
    ]);

    const [url] = backendFetch.mock.calls[0];
    expect(String(url)).toContain("/predictions/forecast");
    expect(String(url)).toContain(`limit=${MAP_FORECAST_HOURS}`);
  });
});

describe("fetchBusynessData", () => {
  test("combines current busyness and forecast series", async () => {
    const backendFetch = vi.fn(async (url: string) => {
      if (String(url).includes("/predictions/forecast")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              forecast: [
                {
                  timestamp: "2026-07-10T11:00:00",
                  busynessScore: 40,
                  busynessLevel: "moderate",
                },
              ],
            },
          }),
        };
      }

      return {
        ok: true,
        json: async () => ({
          success: true,
          data: {
            prediction: {
              busynessScore: 72,
              busynessLevel: "busy",
            },
          },
        }),
      };
    });

    const result = await fetchBusynessData(40.758, -73.9855, backendFetch);

    expect(result.busyness).toEqual({
      score: 72,
      level: "busy",
      period: undefined,
      confidence: undefined,
    });
    expect(result.forecast).toHaveLength(1);
    expect(backendFetch).toHaveBeenCalledTimes(2);
  });
});

describe("toForecastTimeLabel", () => {
  test("formats an offset-less Manhattan time as a New York clock label", () => {
    expect(toForecastTimeLabel("2026-07-08T12:00:00")).toBe("12:00 PM");
  });

  test("formats an afternoon time without shifting to the viewer's timezone", () => {
    expect(toForecastTimeLabel("2026-07-10T16:30:00")).toBe("4:30 PM");
  });

  test("reads the digits of a Z-suffixed timestamp as Manhattan wall time", () => {
    expect(toForecastTimeLabel("2026-07-10T16:30:00.000Z")).toBe("4:30 PM");
  });

  test("formats midnight as 12 AM", () => {
    expect(toForecastTimeLabel("2026-07-10T00:05:00")).toBe("12:05 AM");
  });

  test("formats late morning as AM", () => {
    expect(toForecastTimeLabel("2026-07-10T09:15:00")).toBe("9:15 AM");
  });

  test("returns the input unchanged when it is not a date-time string", () => {
    expect(toForecastTimeLabel("not-a-timestamp")).toBe("not-a-timestamp");
  });
});
