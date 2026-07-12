import { describe, expect, it } from "vitest";
import type { Attraction } from "@/lib/attractions/types";
import {
  BATCH_CHUNK_SIZE,
  chunkItems,
  rankTopBusyAttractions,
  TOP_LANDMARKS_LIMIT,
} from "./fetchTopLandmarks";

const attractions: Attraction[] = [
  {
    id: 1,
    name: "Place A",
    category: "Landmark",
    neighborhood: "Midtown",
    description: "",
    lat: 40.75,
    lng: -73.98,
  },
  {
    id: 2,
    name: "Place B",
    category: "Museum",
    neighborhood: "UES",
    description: "",
    lat: 40.78,
    lng: -73.96,
  },
  {
    id: 3,
    name: "Place C",
    category: "Park",
    neighborhood: "Central",
    description: "",
    lat: 40.77,
    lng: -73.97,
  },
];

describe("chunkItems", () => {
  it("splits arrays into fixed-size chunks", () => {
    const items = Array.from({ length: 5 }, (_, index) => index);
    expect(chunkItems(items, 2)).toEqual([[0, 1], [2, 3], [4]]);
  });

  it("returns one chunk when under the limit", () => {
    expect(chunkItems(attractions, BATCH_CHUNK_SIZE)).toEqual([attractions]);
  });
});

describe("rankTopBusyAttractions", () => {
  it("sorts by busyness score descending and limits results", () => {
    const ranked = rankTopBusyAttractions(
      attractions,
      [
        { clientId: "1", busynessScore: 40, busynessLevel: "moderate" },
        { clientId: "2", busynessScore: 90, busynessLevel: "very_busy" },
        { clientId: "3", busynessScore: 65, busynessLevel: "busy" },
      ],
      TOP_LANDMARKS_LIMIT,
    );

    expect(ranked.map((item) => item.attraction.id)).toEqual([2, 3, 1]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].busynessScore).toBe(90);
  });

  it("ignores predictions without matching attractions", () => {
    const ranked = rankTopBusyAttractions(attractions, [
      { clientId: "999", busynessScore: 100, busynessLevel: "very_busy" },
      { clientId: "2", busynessScore: 55, busynessLevel: "moderate" },
    ]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].attraction.id).toBe(2);
  });
});
