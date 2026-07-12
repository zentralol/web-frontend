import { describe, expect, it } from "vitest";
import { buildHourlyForecastTargetTimes, FORECAST_LIMIT } from "./fetchCrowdForecast";

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
