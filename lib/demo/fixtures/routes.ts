import type { ComputeRoutesResponse } from "@/lib/routes/types";

/** Static demo polylines for High Line → Washington Square Park area. */
export const DEMO_ROUTES_RESPONSE: ComputeRoutesResponse = {
  routes: [
    {
      id: "walk",
      name: "Walk",
      description: "Scenic sidewalk route through Chelsea and the Village.",
      durationMinutes: 28,
      tags: ["demo", "sidewalks"],
      encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
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
      encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
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
      encodedPolyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@",
      efficiency: "High",
      noiseLevel: "Low",
      cost: "Free",
    },
  ],
};
