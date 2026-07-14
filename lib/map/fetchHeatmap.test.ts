import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { fetchHeatmap, HEATMAP_LIMIT } from "./fetchHeatmap";

describe("fetchHeatmap", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          targetTime: "2026-07-14T10:30:00",
          source: "heatmap_predictions",
          points: [
            {
              h3Cell: "892a100d2c3ffff",
              coordinates: { lat: 40.7498, lng: -73.99 },
              period: "PM",
              queryTimestamp: "2026-07-14T10:30:00",
              crowdScore: 72,
              crowdLevel: "busy",
              crowdCategory: "Busy",
              pedestriansPredicted: 4200,
              source: "ml_fastapi",
            },
          ],
        }),
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("requests the Next.js heatmap API with full grid limit", async () => {
    const result = await fetchHeatmap("2026-07-14T10:30:00");

    expect(result.points).toHaveLength(1);
    expect(result.points[0].h3Cell).toBe("892a100d2c3ffff");
    expect(result.source).toBe("heatmap_predictions");

    const [url] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toContain("/api/map/heatmap");
    expect(String(url)).toContain(`limit=${HEATMAP_LIMIT}`);
    expect(String(url)).toContain("targetTime=2026-07-14T10%3A30%3A00");
  });

  test("throws parsed API error message on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({
          error: "Could not load crowd heatmap.",
        }),
      })),
    );

    await expect(fetchHeatmap("2026-07-14T10:30:00")).rejects.toThrow(
      "Could not load crowd heatmap.",
    );
  });
});
