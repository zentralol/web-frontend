import { describe, expect, test } from "vitest";
import { crowdLevelMeta, CROWD_LEVELS } from "./crowdLevels";

describe("crowdLevelMeta", () => {
  test("returns label, badge classes, and marker color for every known level", () => {
    for (const level of CROWD_LEVELS) {
      const meta = crowdLevelMeta(level);
      expect(meta).not.toBeNull();
      expect(meta?.label.length).toBeGreaterThan(0);
      expect(meta?.badgeClassName.length).toBeGreaterThan(0);
      expect(meta?.markerColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test("maps very_quiet and very_busy to readable labels", () => {
    expect(crowdLevelMeta("very_quiet")?.label).toBe("Very quiet");
    expect(crowdLevelMeta("very_busy")?.label).toBe("Very busy");
  });

  test("returns null for unknown or missing levels", () => {
    expect(crowdLevelMeta("nonsense")).toBeNull();
    expect(crowdLevelMeta(undefined)).toBeNull();
    expect(crowdLevelMeta(null)).toBeNull();
  });
});
