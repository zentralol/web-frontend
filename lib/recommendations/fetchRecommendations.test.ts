import { describe, expect, test, vi } from "vitest";
import { fetchQuieterAreas, fetchQuietTimes } from "./fetchRecommendations";
import type { FetchLike } from "@/lib/backend/authenticatedFetch";

function mockResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("fetchQuieterAreas", () => {
  test("posts recommendation request and returns quieter areas", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse({
          success: true,
          data: {
            targetTime: "2026-07-01T16:30:00-04:00",
            recommendations: [
              {
                type: "quieter_area",
                h3Cell: "892a100d6d3ffff",
                coordinates: { lat: 40.7714, lng: -73.9737 },
                busynessScore: 38,
                busynessLevel: "quiet",
                pedestriansPredicted: 920.4,
                period: "PM",
                reason: "This nearby grid cell has a lower predicted crowd score.",
              },
            ],
          },
        }),
    );

    const result = await fetchQuieterAreas(
      {
        lat: 40.758,
        lng: -73.9855,
        targetTime: "2026-07-01T16:30:00-04:00",
        limit: 3,
      },
      backendFetch,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.targetTime).toBe("2026-07-01T16:30:00-04:00");
    expect(result.data.recommendations).toHaveLength(1);
    expect(result.data.recommendations[0]).toMatchObject({
      type: "quieter_area",
      h3Cell: "892a100d6d3ffff",
      coordinates: { lat: 40.7714, lng: -73.9737 },
      busynessScore: 38,
      busynessLevel: "quiet",
      pedestriansPredicted: 920.4,
      period: "PM",
      reason: "This nearby grid cell has a lower predicted crowd score.",
    });

    expect(backendFetch).toHaveBeenCalledTimes(1);
    const [url, init] = backendFetch.mock.calls[0];
    expect(String(url)).toContain("/recommendations");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "Content-Type": "application/json" });
    expect(JSON.parse(init?.body as string)).toMatchObject({
      lat: 40.758,
      lng: -73.9855,
      targetTime: "2026-07-01T16:30:00-04:00",
      limit: 3,
    });
  });

  test("returns error when response is not ok", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse(
          {
            success: false,
            error: { code: "SERVER_ERROR", message: "Something went wrong" },
          },
          500,
        ),
    );

    const result = await fetchQuieterAreas(
      { lat: 40.758, lng: -73.9855, targetTime: "2026-07-01T16:30:00-04:00" },
      backendFetch,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toBe("Something went wrong");
  });

  test("parses LOCATION_OUT_OF_COVERAGE error", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse(
          {
            success: false,
            error: { code: "LOCATION_OUT_OF_COVERAGE", message: "Out of range" },
          },
          422,
        ),
    );

    const result = await fetchQuieterAreas(
      { lat: 41.2, lng: -73.9855, targetTime: "2026-07-01T16:30:00-04:00" },
      backendFetch,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toBe("Predictions are currently available for Manhattan only.");
  });

  test("returns empty list for malformed recommendation items", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse({
          success: true,
          data: {
            targetTime: "2026-07-01T16:30:00-04:00",
            recommendations: [{ invalid: true }],
          },
        }),
    );

    const result = await fetchQuieterAreas(
      { lat: 40.758, lng: -73.9855, targetTime: "2026-07-01T16:30:00-04:00" },
      backendFetch,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.recommendations).toHaveLength(0);
  });

  test("returns error when network request throws", async () => {
    const backendFetch = vi.fn<FetchLike>(async () => {
      throw new Error("Network failure");
    });

    const result = await fetchQuieterAreas(
      { lat: 40.758, lng: -73.9855, targetTime: "2026-07-01T16:30:00-04:00" },
      backendFetch,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toBe("Could not load quieter areas.");
  });
});

describe("fetchQuietTimes", () => {
  test("posts quiet-times request and returns quieter time options", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse({
          success: true,
          data: {
            original: {
              targetTime: "2026-07-01T16:30:00-04:00",
              busynessScore: 86,
              busynessLevel: "very_busy",
            },
            quietTimes: [
              {
                targetTime: "2026-07-01T10:00:00-04:00",
                busynessScore: 42,
                busynessLevel: "moderate",
                confidence: 0.68,
                reason: "Predicted crowd score is lower than the selected time.",
              },
            ],
          },
        }),
    );

    const result = await fetchQuietTimes(
      {
        lat: 40.758,
        lng: -73.9855,
        targetTime: "2026-07-01T16:30:00-04:00",
        startTime: "2026-07-01T09:00:00-04:00",
        endTime: "2026-07-01T21:00:00-04:00",
        limit: 2,
      },
      backendFetch,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.original).toMatchObject({
      targetTime: "2026-07-01T16:30:00-04:00",
      busynessScore: 86,
      busynessLevel: "very_busy",
    });
    expect(result.data.quietTimes).toHaveLength(1);
    expect(result.data.quietTimes[0]).toMatchObject({
      targetTime: "2026-07-01T10:00:00-04:00",
      busynessScore: 42,
      busynessLevel: "moderate",
      confidence: 0.68,
      reason: "Predicted crowd score is lower than the selected time.",
    });

    expect(backendFetch).toHaveBeenCalledTimes(1);
    const [url, init] = backendFetch.mock.calls[0];
    expect(String(url)).toContain("/recommendations/quiet-times");
    expect(init?.method).toBe("POST");
    expect(JSON.parse(init?.body as string)).toMatchObject({
      lat: 40.758,
      lng: -73.9855,
      targetTime: "2026-07-01T16:30:00-04:00",
      startTime: "2026-07-01T09:00:00-04:00",
      endTime: "2026-07-01T21:00:00-04:00",
      limit: 2,
    });
  });

  test("returns error when original or quietTimes are missing", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse({
          success: true,
          data: {},
        }),
    );

    const result = await fetchQuietTimes(
      {
        lat: 40.758,
        lng: -73.9855,
        targetTime: "2026-07-01T16:30:00-04:00",
        startTime: "2026-07-01T09:00:00-04:00",
        endTime: "2026-07-01T21:00:00-04:00",
      },
      backendFetch,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toBe("Could not load quieter times.");
  });

  test("filters malformed quiet time items", async () => {
    const backendFetch = vi.fn<FetchLike>(
      async () =>
        mockResponse({
          success: true,
          data: {
            original: {
              targetTime: "2026-07-01T16:30:00-04:00",
              busynessScore: 86,
              busynessLevel: "very_busy",
            },
            quietTimes: [{ targetTime: "2026-07-01T10:00:00-04:00" }],
          },
        }),
    );

    const result = await fetchQuietTimes(
      {
        lat: 40.758,
        lng: -73.9855,
        targetTime: "2026-07-01T16:30:00-04:00",
        startTime: "2026-07-01T09:00:00-04:00",
        endTime: "2026-07-01T21:00:00-04:00",
      },
      backendFetch,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.quietTimes).toHaveLength(0);
  });

  test("returns error when network request throws", async () => {
    const backendFetch = vi.fn<FetchLike>(async () => {
      throw new TypeError("Failed to fetch");
    });

    const result = await fetchQuietTimes(
      {
        lat: 40.758,
        lng: -73.9855,
        targetTime: "2026-07-01T16:30:00-04:00",
        startTime: "2026-07-01T09:00:00-04:00",
        endTime: "2026-07-01T21:00:00-04:00",
      },
      backendFetch,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error).toBe("Could not load quieter times.");
  });
});
