import { describe, expect, test } from "vitest";
import { rankTopLandmarksFromPredictions } from "./fetchTopLandmarksFromPredictions";
import type { Attraction } from "@/lib/attractions/types";
import type { AttractionPredictionRow } from "@/lib/attractions/types";

const baseAttraction: Attraction = {
  id: 1,
  name: "Central Park",
  category: "Park",
  neighborhood: "Midtown",
  description: "Big park",
  lat: 40.7851,
  lng: -73.9683,
};

function makeAttraction(id: number, category: string): Attraction {
  return { ...baseAttraction, id, name: `Attraction ${id}`, category };
}

function makePrediction(
  attractionId: number,
  score: number,
  level: string,
): AttractionPredictionRow {
  return {
    attraction_id: attractionId,
    crowd_score: score,
    crowd_level: level,
    predicted_for: "2026-07-12T15:00:00+00:00",
  };
}

describe("rankTopLandmarksFromPredictions", () => {
  test("ranks scenic attractions by crowd score", () => {
    const attractions = [
      makeAttraction(1, "Landmark/Monument"),
      makeAttraction(2, "Park"),
      makeAttraction(3, "Restaurant"), // not scenic
    ];
    const predictions = [
      makePrediction(1, 80, "busy"),
      makePrediction(2, 20, "quiet"),
      makePrediction(3, 95, "very_busy"),
    ];

    const result = rankTopLandmarksFromPredictions(attractions, predictions, {
      sortOrder: "busiest_first",
      limit: 5,
    });

    expect(result.landmarks).toHaveLength(2);
    expect(result.landmarks[0].attraction.id).toBe(1);
    expect(result.landmarks[0].busynessScore).toBe(80);
    expect(result.landmarks[0].busynessLevel).toBe("busy");
    expect(result.landmarks[1].attraction.id).toBe(2);
  });

  test("supports quietest_first ordering", () => {
    const attractions = [
      makeAttraction(1, "Landmark/Monument"),
      makeAttraction(2, "Park"),
    ];
    const predictions = [
      makePrediction(1, 80, "busy"),
      makePrediction(2, 20, "quiet"),
    ];

    const result = rankTopLandmarksFromPredictions(attractions, predictions, {
      sortOrder: "quietest_first",
      limit: 5,
    });

    expect(result.landmarks[0].attraction.id).toBe(2);
  });

  test("respects the limit", () => {
    const attractions = Array.from({ length: 10 }, (_, i) =>
      makeAttraction(i + 1, "Landmark/Monument"),
    );
    const predictions = attractions.map((a, i) =>
      makePrediction(a.id, i * 10, "moderate"),
    );

    const result = rankTopLandmarksFromPredictions(attractions, predictions, {
      sortOrder: "busiest_first",
      limit: 3,
    });

    expect(result.landmarks).toHaveLength(3);
  });

  test("returns empty array when no scenic attractions have predictions", () => {
    const attractions = [makeAttraction(1, "Landmark/Monument")];
    const result = rankTopLandmarksFromPredictions(attractions, [], {
      limit: 5,
    });

    expect(result.landmarks).toHaveLength(0);
  });

  test("ignores predictions for non-scenic or missing attractions", () => {
    const attractions = [makeAttraction(1, "Landmark/Monument")];
    const predictions = [
      makePrediction(1, 80, "busy"),
      makePrediction(2, 95, "very_busy"), // no matching attraction
    ];

    const result = rankTopLandmarksFromPredictions(attractions, predictions, {
      limit: 5,
    });

    expect(result.landmarks).toHaveLength(1);
    expect(result.landmarks[0].attraction.id).toBe(1);
  });

  test("uses the newest prediction per attraction", () => {
    const attractions = [makeAttraction(1, "Landmark/Monument")];
    const predictions: AttractionPredictionRow[] = [
      {
        ...makePrediction(1, 80, "busy"),
        predicted_for: "2026-07-12T14:00:00+00:00",
      },
      {
        ...makePrediction(1, 30, "quiet"),
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
    ];

    const result = rankTopLandmarksFromPredictions(attractions, predictions, {
      limit: 5,
    });

    expect(result.landmarks[0].busynessScore).toBe(30);
  });

  test("includes a target time from the newest prediction", () => {
    const attractions = [makeAttraction(1, "Landmark/Monument")];
    const predictions: AttractionPredictionRow[] = [
      {
        ...makePrediction(1, 80, "busy"),
        predicted_for: "2026-07-12T14:00:00+00:00",
      },
      {
        ...makePrediction(1, 30, "quiet"),
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
    ];

    const result = rankTopLandmarksFromPredictions(attractions, predictions, {
      limit: 5,
    });

    expect(result.targetTime).toBe("2026-07-12T15:00:00+00:00");
  });
});
