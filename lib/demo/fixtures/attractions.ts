import type { Attraction, AttractionPredictionRow } from "@/lib/attractions/types";

export const DEMO_ATTRACTIONS: Attraction[] = [
  {
    id: 1,
    name: "Central Park",
    category: "Park",
    neighborhood: "Upper West Side",
    description: "Iconic green oasis spanning midtown to uptown Manhattan.",
    lat: 40.7829,
    lng: -73.9654,
    crowd: {
      score: 0.72,
      level: "busy",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 2,
    name: "The Metropolitan Museum of Art",
    category: "Museum",
    neighborhood: "Upper East Side",
    description: "World-class art collection on Fifth Avenue.",
    lat: 40.7794,
    lng: -73.9632,
    crowd: {
      score: 0.58,
      level: "moderate",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 3,
    name: "Washington Square Park",
    category: "Park",
    neighborhood: "Greenwich Village",
    description: "Village gathering spot under the marble arch.",
    lat: 40.7308,
    lng: -73.9973,
    crowd: {
      score: 0.45,
      level: "moderate",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 4,
    name: "High Line",
    category: "Park",
    neighborhood: "Chelsea",
    description: "Elevated park built on a former freight rail line.",
    lat: 40.748,
    lng: -74.0048,
    crowd: {
      score: 0.66,
      level: "busy",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 5,
    name: "American Museum of Natural History",
    category: "Museum",
    neighborhood: "Upper West Side",
    description: "Dinosaurs, planetarium, and natural history halls.",
    lat: 40.7813,
    lng: -73.974,
    crowd: {
      score: 0.51,
      level: "moderate",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 6,
    name: "Empire State Building",
    category: "Landmark",
    neighborhood: "Midtown",
    description: "Art Deco skyscraper with panoramic observation decks.",
    lat: 40.7484,
    lng: -73.9857,
    crowd: {
      score: 0.81,
      level: "very_busy",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 7,
    name: "Chelsea Market",
    category: "Food Hall",
    neighborhood: "Chelsea",
    description: "Indoor food hall with shops and eateries.",
    lat: 40.7424,
    lng: -74.0061,
    crowd: {
      score: 0.62,
      level: "busy",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
  {
    id: 8,
    name: "Brooklyn Bridge",
    category: "Bridge",
    neighborhood: "Civic Center",
    description: "Historic suspension bridge with pedestrian walkway.",
    lat: 40.7061,
    lng: -73.9969,
    crowd: {
      score: 0.69,
      level: "busy",
      predictedFor: "2026-07-24T15:00:00.000Z",
    },
  },
];

export const DEMO_ATTRACTION_PREDICTIONS: AttractionPredictionRow[] =
  DEMO_ATTRACTIONS.map((attraction) => ({
    attraction_id: attraction.id,
    crowd_score: attraction.crowd?.score ?? 0.5,
    crowd_level: attraction.crowd?.level ?? "moderate",
    predicted_for: attraction.crowd?.predictedFor ?? new Date().toISOString(),
  }));
