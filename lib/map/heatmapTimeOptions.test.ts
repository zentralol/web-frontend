import { describe, expect, test } from "vitest";
import { buildHeatmapTimeOptions } from "./heatmapTimeOptions";

describe("buildHeatmapTimeOptions", () => {
  test("starts with Now and includes eight future hour options", () => {
    const now = new Date("2026-07-10T14:00:00.000Z");
    const options = buildHeatmapTimeOptions(now);

    expect(options).toHaveLength(9);
    expect(options[0]).toEqual({
      id: "now",
      label: "Now",
      targetTime: "2026-07-10T10:00:00",
    });
    expect(options[1].id).toBe("future-1");
    expect(options[8].id).toBe("future-8");
    expect(options[0].targetTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });

  test("preserves non-zero minutes in future hour labels", () => {
    const now = new Date("2026-07-10T19:24:00.000Z");
    const options = buildHeatmapTimeOptions(now);

    expect(options[1].label).toBe("In 1 hour · 4:24 PM");
    expect(options[2].label).toBe("In 2 hours · 5:24 PM");
  });
});
