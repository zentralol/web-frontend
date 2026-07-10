import { describe, expect, test } from "vitest";
import {
  extractCategories,
  filterAttractions,
  pickRecommendedAttractions,
} from "./filterAttractions";
import type { Attraction } from "./types";

const attractions: Attraction[] = [
  {
    id: 1,
    name: "Central Park",
    category: "Park",
    neighborhood: "Upper West Side",
    description: "Large urban park with trails and nature paths",
    lat: 40.7829,
    lng: -73.9654,
  },
  {
    id: 2,
    name: "Metropolitan Museum of Art",
    category: "Museum",
    neighborhood: "Upper East Side",
    description: "World-class art and history collections",
    lat: 40.7794,
    lng: -73.9632,
  },
  {
    id: 3,
    name: "Chelsea Market",
    category: "Market",
    neighborhood: "Chelsea",
    description: "Food hall and local shopping destination",
    lat: 40.7424,
    lng: -74.006,
  },
];

describe("filterAttractions", () => {
  test("filters by query across name, category, neighborhood, and description", () => {
    expect(filterAttractions(attractions, { query: "central" }).map((item) => item.id)).toEqual([
      1,
    ]);
    expect(filterAttractions(attractions, { query: "museum" }).map((item) => item.id)).toEqual([
      2,
    ]);
  });

  test("filters by category", () => {
    expect(
      filterAttractions(attractions, { category: "Market" }).map((item) => item.id),
    ).toEqual([3]);
  });

  test("sorts alphabetically by name", () => {
    expect(filterAttractions(attractions, { sortMode: "name" }).map((item) => item.name)).toEqual([
      "Central Park",
      "Chelsea Market",
      "Metropolitan Museum of Art",
    ]);
  });

  test("sorts by interest score for recommended mode", () => {
    const sorted = filterAttractions(attractions, {
      sortMode: "recommended",
      interests: ["art", "history"],
    });

    expect(sorted[0]?.id).toBe(2);
  });

  test("sorts by distance for near_me mode", () => {
    const sorted = filterAttractions(attractions, {
      sortMode: "near_me",
      userCoords: { lat: 40.7424, lng: -74.006 },
    });

    expect(sorted[0]?.id).toBe(3);
  });
});

describe("extractCategories", () => {
  test("returns unique sorted categories", () => {
    expect(extractCategories(attractions)).toEqual(["Market", "Museum", "Park"]);
  });
});

describe("pickRecommendedAttractions", () => {
  test("returns top matches up to the requested limit", () => {
    const picks = pickRecommendedAttractions(attractions, ["food"], 2);
    expect(picks).toHaveLength(2);
    expect(picks[0]?.id).toBe(3);
  });
});
