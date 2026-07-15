import type { ForecastPoint } from "@/lib/map/fetchPredictions";

export type SelectedLocation = {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
  placeId?: string;
  attractionId?: number;
  category?: string;
  neighborhood?: string;
  description?: string;
  source?: "map" | "attraction";
  busyness?: {
    score: number;
    level: string;
    period?: string;
    confidence?: number;
  };
  forecast?: ForecastPoint[];
  busynessLoading?: boolean;
  busynessError?: string;
};

export type LocationSelectionState =
  | { status: "idle" }
  | { status: "loading"; lat: number; lng: number }
  | { status: "ready"; location: SelectedLocation }
  | { status: "error"; message: string; lat?: number; lng?: number };
