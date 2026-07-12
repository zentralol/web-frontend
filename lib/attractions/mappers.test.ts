import { describe, expect, test } from "vitest";
import { attachCrowdToAttractions, rowToAttraction } from "./mappers";
import type {
  Attraction,
  AttractionPredictionRow,
  AttractionRow,
} from "./types";

describe("rowToAttraction", () => {
  test("maps Supabase column names to app shape", () => {
    const row: AttractionRow = {
      id: 1,
      Name: "Statue of Liberty",
      Category: "Landmark/Monument",
      Neighborhood: "Battery Park (ferry access)",
      Description: "Iconic copper statue",
      lat: 40.6892,
      lon: -74.0445,
    };

    expect(rowToAttraction(row)).toEqual({
      id: 1,
      name: "Statue of Liberty",
      category: "Landmark/Monument",
      neighborhood: "Battery Park (ferry access)",
      description: "Iconic copper statue",
      lat: 40.6892,
      lng: -74.0445,
    });
  });
});

describe("attachCrowdToAttractions", () => {
  const baseAttraction: Attraction = {
    id: 1,
    name: "Statue of Liberty",
    category: "Landmark/Monument",
    neighborhood: "Battery Park (ferry access)",
    description: "Iconic copper statue",
    lat: 40.6892,
    lng: -74.0445,
  };

  test("attaches the newest prediction per attraction", () => {
    const attractions = [baseAttraction, { ...baseAttraction, id: 2 }];
    const predictions: AttractionPredictionRow[] = [
      {
        attraction_id: 1,
        crowd_score: 62,
        crowd_level: "busy",
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
      {
        attraction_id: 1,
        crowd_score: 20,
        crowd_level: "very_quiet",
        predicted_for: "2026-07-12T14:00:00+00:00",
      },
      {
        attraction_id: 2,
        crowd_score: 35,
        crowd_level: "quiet",
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
    ];

    const result = attachCrowdToAttractions(attractions, predictions);

    expect(result[0].crowd).toEqual({
      score: 62,
      level: "busy",
      predictedFor: "2026-07-12T15:00:00+00:00",
    });
    expect(result[1].crowd).toEqual({
      score: 35,
      level: "quiet",
      predictedFor: "2026-07-12T15:00:00+00:00",
    });
  });

  test("leaves crowd undefined when no prediction exists for an attraction", () => {
    const result = attachCrowdToAttractions([baseAttraction], []);

    expect(result[0].crowd).toBeUndefined();
  });

  test("skips rows without a usable score or level", () => {
    const predictions: AttractionPredictionRow[] = [
      {
        attraction_id: 1,
        crowd_score: null,
        crowd_level: "busy",
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
      {
        attraction_id: 1,
        crowd_score: 40,
        crowd_level: null,
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
    ];

    const result = attachCrowdToAttractions([baseAttraction], predictions);

    expect(result[0].crowd).toBeUndefined();
  });

  test("does not mutate the input attractions", () => {
    const attractions = [baseAttraction];
    const predictions: AttractionPredictionRow[] = [
      {
        attraction_id: 1,
        crowd_score: 62,
        crowd_level: "busy",
        predicted_for: "2026-07-12T15:00:00+00:00",
      },
    ];

    attachCrowdToAttractions(attractions, predictions);

    expect(baseAttraction.crowd).toBeUndefined();
  });
});
