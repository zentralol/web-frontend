import { describe, expect, it } from "vitest";
import { addHoursInNewYork, formatInNewYork } from "./manhattanTime";

describe("formatInNewYork", () => {
  it("returns naive ISO without timezone suffix", () => {
    const formatted = formatInNewYork(new Date("2026-07-12T18:30:00.000Z"));
    expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    expect(formatted.endsWith("Z")).toBe(false);
  });

  it("formats a known UTC instant as New York wall clock", () => {
    const formatted = formatInNewYork(new Date("2026-07-12T18:30:00.000Z"));
    expect(formatted).toBe("2026-07-12T14:30:00");
  });
});

describe("addHoursInNewYork", () => {
  it("advances by the requested number of hours", () => {
    const start = new Date("2026-07-12T10:00:00.000Z");
    const end = addHoursInNewYork(start, 8);
    expect(end.getTime() - start.getTime()).toBe(8 * 60 * 60 * 1000);
  });
});
