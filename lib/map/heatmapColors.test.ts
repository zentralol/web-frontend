import { describe, expect, test } from "vitest";
import { heatmapFillColor } from "./heatmapColors";

describe("heatmapFillColor", () => {
  test("maps known crowd levels to marker colors", () => {
    expect(heatmapFillColor("very_quiet")).toBe("#34d399");
    expect(heatmapFillColor("quiet")).toBe("#a3e635");
    expect(heatmapFillColor("moderate")).toBe("#facc15");
    expect(heatmapFillColor("busy")).toBe("#fb923c");
    expect(heatmapFillColor("very_busy")).toBe("#f87171");
  });

  test("falls back for unknown crowd levels", () => {
    expect(heatmapFillColor("unknown")).toBe("#888888");
  });
});
