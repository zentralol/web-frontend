import { describe, expect, test, vi } from "vitest";
import {
  fetchHeatmap,
  HEATMAP_LIMIT,
  HEATMAP_SOURCE,
} from "./fetchHeatmap";

describe("fetchHeatmap", () => {
  test("requests auto-sourced heatmap with full grid limit", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          targetTime: "2026-07-14T10:30:00",
          source: "ml_fastapi",
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
        },
      }),
    }));

    const result = await fetchHeatmap(
      "2026-07-14T10:30:00",
      backendFetch,
      "http://localhost:3000",
    );

    expect(result.points).toHaveLength(1);
    expect(result.points[0].h3Cell).toBe("892a100d2c3ffff");
    expect(result.source).toBe("ml_fastapi");

    const [url] = backendFetch.mock.calls[0];
    expect(String(url)).toContain("/api/v1/map/heatmap");
    expect(String(url)).toContain(`limit=${HEATMAP_LIMIT}`);
    expect(String(url)).toContain(`source=${HEATMAP_SOURCE}`);
    expect(String(url)).toContain(
      "targetTime=2026-07-14T10%3A30%3A00",
    );
  });

  test("throws parsed API error message on failure", async () => {
    const backendFetch = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Heatmap data query failed",
        },
      }),
    }));

    await expect(
      fetchHeatmap("2026-07-14T10:30:00", backendFetch),
    ).rejects.toThrow("Heatmap data query failed");
  });
});
