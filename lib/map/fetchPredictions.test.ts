import { describe, expect, test } from "vitest";
import { toForecastTimeLabel } from "./fetchPredictions";

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
