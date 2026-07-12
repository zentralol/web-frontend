import { describe, expect, it } from "vitest";
import type { Attraction } from "@/lib/attractions/types";
import {
  applyLandmarksSortOrder,
  BATCH_CHUNK_SIZE,
  chunkItems,
  fetchTopLandmarks,
  rankTopBusyAttractions,
  TOP_LANDMARKS_LIMIT,
} from "./fetchTopLandmarks";

const baseAttraction = {
  neighborhood: "Midtown",
  description: "",
  lat: 40.75,
  lng: -73.98,
};

const attractions: Attraction[] = [
  {
    id: 1,
    name: "Place A",
    category: "Landmark",
    ...baseAttraction,
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

const mixedAttractions: Attraction[] = [
  {
    id: 1,
    name: "Empire State",
    category: "Landmark",
    ...baseAttraction,
  },
  {
    id: 2,
    name: "Grand Central",
    category: "Subway Station",
    ...baseAttraction,
  },
  {
    id: 3,
    name: "Joe's Pizza",
    category: "Restaurant",
    ...baseAttraction,
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
      { limit: TOP_LANDMARKS_LIMIT, sortOrder: "busiest_first" },
    );

    expect(ranked.map((item) => item.attraction.id)).toEqual([2, 3, 1]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].busynessScore).toBe(90);
  });

  it("sorts by busyness score ascending when quietest_first", () => {
    const ranked = rankTopBusyAttractions(
      attractions,
      [
        { clientId: "1", busynessScore: 40, busynessLevel: "moderate" },
        { clientId: "2", busynessScore: 90, busynessLevel: "very_busy" },
        { clientId: "3", busynessScore: 65, busynessLevel: "busy" },
      ],
      { limit: TOP_LANDMARKS_LIMIT, sortOrder: "quietest_first" },
    );

    expect(ranked.map((item) => item.attraction.id)).toEqual([1, 3, 2]);
    expect(ranked[0].busynessScore).toBe(40);
  });

  it("ignores predictions without matching attractions", () => {
    const ranked = rankTopBusyAttractions(attractions, [
      { clientId: "999", busynessScore: 100, busynessLevel: "very_busy" },
      { clientId: "2", busynessScore: 55, busynessLevel: "moderate" },
    ]);

    expect(ranked).toHaveLength(1);
    expect(ranked[0].attraction.id).toBe(2);
  });

  it("returns every ranked landmark when limit is omitted", () => {
    const ranked = rankTopBusyAttractions(attractions, [
      { clientId: "1", busynessScore: 40, busynessLevel: "moderate" },
      { clientId: "2", busynessScore: 90, busynessLevel: "very_busy" },
      { clientId: "3", busynessScore: 65, busynessLevel: "busy" },
    ]);

    expect(ranked).toHaveLength(3);
  });
});

describe("applyLandmarksSortOrder", () => {
  const landmarks = rankTopBusyAttractions(attractions, [
    { clientId: "1", busynessScore: 40, busynessLevel: "moderate" },
    { clientId: "2", busynessScore: 90, busynessLevel: "very_busy" },
    { clientId: "3", busynessScore: 65, busynessLevel: "busy" },
  ]);

  it("returns the quietest landmarks first", () => {
    const quietest = applyLandmarksSortOrder(landmarks, "quietest_first", 2);

    expect(quietest.map((item) => item.attraction.id)).toEqual([1, 3]);
    expect(quietest[0].rank).toBe(1);
    expect(quietest[1].rank).toBe(2);
  });

  it("returns the busiest landmarks first", () => {
    const busiest = applyLandmarksSortOrder(landmarks, "busiest_first", 2);

    expect(busiest.map((item) => item.attraction.id)).toEqual([2, 3]);
  });

  it("picks globally quietest landmarks instead of reversing the busiest slice", () => {
    const expandedAttractions: Attraction[] = [
      ...attractions,
      {
        id: 4,
        name: "Quiet Park",
        category: "Park",
        ...baseAttraction,
      },
      {
        id: 5,
        name: "Quiet Museum",
        category: "Museum",
        neighborhood: "Lower East Side",
        description: "",
        lat: 40.72,
        lng: -73.99,
      },
    ];

    const allLandmarks = rankTopBusyAttractions(expandedAttractions, [
      { clientId: "1", busynessScore: 96, busynessLevel: "very_busy" },
      { clientId: "2", busynessScore: 100, busynessLevel: "very_busy" },
      { clientId: "3", busynessScore: 99, busynessLevel: "very_busy" },
      { clientId: "4", busynessScore: 12, busynessLevel: "quiet" },
      { clientId: "5", busynessScore: 8, busynessLevel: "quiet" },
    ]);

    const quietest = applyLandmarksSortOrder(allLandmarks, "quietest_first", 2);

    expect(quietest.map((item) => item.attraction.id)).toEqual([5, 4]);
    expect(quietest.every((item) => item.busynessScore < 20)).toBe(true);
  });
});

describe("fetchTopLandmarks", () => {
  it("only ranks scenic attractions", async () => {
    const backendFetch = async () =>
      ({
        ok: true,
        json: async () => ({
          data: {
            predictions: [
              { clientId: "1", busynessScore: 40, busynessLevel: "moderate" },
              { clientId: "2", busynessScore: 99, busynessLevel: "very_busy" },
              { clientId: "3", busynessScore: 80, busynessLevel: "busy" },
            ],
          },
        }),
      }) as Response;

    const result = await fetchTopLandmarks(mixedAttractions, backendFetch);

    expect(result.landmarks).toHaveLength(1);
    expect(result.landmarks[0]?.attraction.id).toBe(1);
    expect(result.landmarks[0]?.busynessScore).toBe(40);
  });

  it("returns all scenic predictions for client-side sorting", async () => {
    const scenicOnly: Attraction[] = [
      { id: 1, name: "Busy A", category: "Landmark", ...baseAttraction },
      { id: 2, name: "Busy B", category: "Museum", neighborhood: "UES", description: "", lat: 40.78, lng: -73.96 },
      { id: 3, name: "Busy C", category: "Park", neighborhood: "Central", description: "", lat: 40.77, lng: -73.97 },
      { id: 4, name: "Quiet A", category: "Park", neighborhood: "Harlem", description: "", lat: 40.81, lng: -73.95 },
      { id: 5, name: "Quiet B", category: "Museum", neighborhood: "Bronx", description: "", lat: 40.82, lng: -73.94 },
      { id: 6, name: "Quiet C", category: "Theater", neighborhood: "Brooklyn", description: "", lat: 40.83, lng: -73.93 },
    ];

    const backendFetch = async () =>
      ({
        ok: true,
        json: async () => ({
          data: {
            predictions: [
              { clientId: "1", busynessScore: 100, busynessLevel: "very_busy" },
              { clientId: "2", busynessScore: 99, busynessLevel: "very_busy" },
              { clientId: "3", busynessScore: 98, busynessLevel: "very_busy" },
              { clientId: "4", busynessScore: 10, busynessLevel: "quiet" },
              { clientId: "5", busynessScore: 8, busynessLevel: "quiet" },
              { clientId: "6", busynessScore: 5, busynessLevel: "quiet" },
            ],
          },
        }),
      }) as Response;

    const result = await fetchTopLandmarks(scenicOnly, backendFetch);
    const quietest = applyLandmarksSortOrder(result.landmarks, "quietest_first", 3);

    expect(result.landmarks).toHaveLength(6);
    expect(quietest.map((item) => item.attraction.id)).toEqual([6, 5, 4]);
  });

  it("returns empty results when no scenic attractions are present", async () => {
    const nonScenic: Attraction[] = [
      {
        id: 10,
        name: "Penn Station",
        category: "Train Station",
        ...baseAttraction,
      },
      {
        id: 11,
        name: "Katz's Deli",
        category: "Deli/Bakery",
        ...baseAttraction,
      },
    ];

    const backendFetch = async () => {
      throw new Error("API should not be called");
    };

    const result = await fetchTopLandmarks(nonScenic, backendFetch);

    expect(result.landmarks).toEqual([]);
    expect(result.error).toBeUndefined();
  });
});
