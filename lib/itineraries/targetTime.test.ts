import { describe, expect, it } from "vitest";
import {
  formatTargetTimeDisplay,
  fromDatetimeLocalValue,
  isValidTargetTime,
  normalizeTargetTime,
  toDatetimeLocalValue,
} from "./targetTime";

describe("isValidTargetTime", () => {
  it("accepts full datetime with seconds", () => {
    expect(isValidTargetTime("2026-07-10T16:00:00")).toBe(true);
  });

  it("accepts full datetime without seconds", () => {
    expect(isValidTargetTime("2026-07-10T16:00")).toBe(true);
  });

  it("rejects time-only values", () => {
    expect(isValidTargetTime("16:00:00")).toBe(false);
  });

  it("rejects date-only values", () => {
    expect(isValidTargetTime("2026-07-10")).toBe(false);
  });
});

describe("normalizeTargetTime", () => {
  it("appends seconds when missing", () => {
    expect(normalizeTargetTime("2026-07-10T16:00")).toBe("2026-07-10T16:00:00");
  });
});

describe("formatTargetTimeDisplay", () => {
  it("includes both date and time", () => {
    const formatted = formatTargetTimeDisplay("2026-07-10T16:00:00");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("Jul");
    expect(formatted).toMatch(/16:00/);
  });
});

describe("datetime-local conversion", () => {
  it("round-trips stored ISO values", () => {
    const iso = "2026-07-10T16:00:00";
    expect(toDatetimeLocalValue(iso)).toBe("2026-07-10T16:00");
    expect(fromDatetimeLocalValue("2026-07-10T16:00")).toBe(iso);
  });

  it("returns null for empty input", () => {
    expect(fromDatetimeLocalValue("")).toBeNull();
  });
});
