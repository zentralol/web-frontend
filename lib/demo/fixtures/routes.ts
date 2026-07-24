import type { ComputeRoutesResponse } from "@/lib/routes/types";

/** Encoded High Line (40.748, -74.0048) → Washington Square Park (40.7308, -73.9973). */
export const DEMO_HIGH_LINE_TO_WSP_POLYLINE =
  "_ruwF~`ubMjH_DnKkHnKkHnKkHnKgEnKkCnKg@nKg@rI?";

/** Static demo routes for High Line → Washington Square Park. */
export const DEMO_ROUTES_RESPONSE: ComputeRoutesResponse = {
  routes: [
    {
      id: "walk",
      name: "Walk",
      description: "Scenic sidewalk route through Chelsea and the Village.",
      durationMinutes: 28,
      tags: ["demo", "sidewalks"],
      encodedPolyline: DEMO_HIGH_LINE_TO_WSP_POLYLINE,
      efficiency: "Moderate",
      noiseLevel: "Low",
      cost: "Free",
    },
    {
      id: "transit",
      name: "Transit",
      description: "Subway + short walk (demo schedule).",
      durationMinutes: 18,
      tags: ["demo", "subway"],
      encodedPolyline: DEMO_HIGH_LINE_TO_WSP_POLYLINE,
      efficiency: "High",
      noiseLevel: "Moderate",
      cost: "$2.90",
    },
    {
      id: "bicycle",
      name: "Bicycle",
      description: "Protected bike lanes where available (demo path).",
      durationMinutes: 14,
      tags: ["demo", "bike"],
      encodedPolyline: DEMO_HIGH_LINE_TO_WSP_POLYLINE,
      efficiency: "High",
      noiseLevel: "Low",
      cost: "Free",
    },
  ],
};
