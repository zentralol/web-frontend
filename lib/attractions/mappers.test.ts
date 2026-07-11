import { describe, expect, test } from "vitest";
import { rowToAttraction } from "./mappers";
import type { AttractionRow } from "./types";

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
