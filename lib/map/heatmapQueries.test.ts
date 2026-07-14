import { describe, expect, test, vi } from "vitest";
import { listHeatmapPredictions } from "./heatmapQueries";

function createSupabaseMock(rows: unknown[], error: { message: string } | null = null) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const order = vi.fn().mockReturnValue({ limit });
  const eq = vi.fn().mockReturnValue({ order });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });

  return {
    client: { from } as never,
    from,
    select,
    eq,
    order,
    limit,
  };
}

describe("listHeatmapPredictions", () => {
  test("queries heatmap_predictions by target_time with score ordering", async () => {
    const rows = [
      {
        h3_cell: "892a1008803ffff",
        lat: 40.7978,
        lon: -73.9748,
        period: "PM",
        target_time: "2026-07-14T10:30:00",
        crowd_score: 72,
        crowd_level: "busy",
        pedestrians_pred: 4200,
        crowd_category: "Busy",
        source: "ml_fastapi",
      },
    ];
    const supabase = createSupabaseMock(rows);

    const result = await listHeatmapPredictions(
      supabase.client,
      "2026-07-14T10:30:00",
      524,
    );

    expect(supabase.from).toHaveBeenCalledWith("heatmap_predictions");
    expect(supabase.eq).toHaveBeenCalledWith("target_time", "2026-07-14T10:30:00");
    expect(supabase.order).toHaveBeenCalledWith("crowd_score", { ascending: false });
    expect(supabase.limit).toHaveBeenCalledWith(524);
    expect(result).toEqual(rows);
  });

  test("throws when Supabase returns an error", async () => {
    const supabase = createSupabaseMock([], { message: "relation missing" });

    await expect(
      listHeatmapPredictions(supabase.client, "2026-07-14T10:30:00"),
    ).rejects.toEqual({ message: "relation missing" });
  });
});
