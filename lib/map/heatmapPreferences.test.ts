import { afterEach, describe, expect, test, vi } from "vitest";
import {
  HEATMAP_ENABLED_KEY,
  readHeatmapEnabled,
  writeHeatmapEnabled,
} from "./heatmapPreferences";

describe("heatmapPreferences", () => {
  const storage = new Map<string, string>();

  afterEach(() => {
    storage.clear();
    vi.unstubAllGlobals();
  });

  test("reads and writes heatmap enabled preference", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });

    expect(readHeatmapEnabled()).toBe(false);

    writeHeatmapEnabled(true);
    expect(storage.get(HEATMAP_ENABLED_KEY)).toBe("1");
    expect(readHeatmapEnabled()).toBe(true);

    writeHeatmapEnabled(false);
    expect(storage.get(HEATMAP_ENABLED_KEY)).toBe("0");
    expect(readHeatmapEnabled()).toBe(false);
  });
});
