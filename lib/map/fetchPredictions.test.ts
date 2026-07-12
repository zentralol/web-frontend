import { describe, expect, test, vi } from "vitest";
import {
  buildFutureHourOptions,
  fetchBusynessAtTime,
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

describe("fetchBusynessAtTime", () => {
  test("posts prediction request for the selected hour offset", async () => {
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

    const result = await fetchBusynessAtTime(40.758, -73.9855, 3, backendFetch);

    expect(result.busyness).toEqual({
      score: 72,
      level: "busy",
      period: undefined,
      confidence: undefined,
    });
    expect(backendFetch).toHaveBeenCalledTimes(1);

    const [, init] = backendFetch.mock.calls[0];
    const body = JSON.parse(init?.body as string) as {
      lat: number;
      lng: number;
      targetTime: string;
      durationMinutes: number;
    };

    expect(body.lat).toBe(40.758);
    expect(body.lng).toBe(-73.9855);
    expect(body.durationMinutes).toBe(60);
    expect(body.targetTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  test("returns an error message when the API response is not successful", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        success: false,
        error: { message: "Prediction failed." },
      }),
    }));

    const result = await fetchBusynessAtTime(40.758, -73.9855, 2, backendFetch);

    expect(result.busyness).toBeUndefined();
    expect(result.busynessError).toBe("Prediction failed.");
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
