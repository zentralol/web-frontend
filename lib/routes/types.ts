export type RouteLocation = {
  lat: number;
  lng: number;
  label: string;
};

export type TravelMode = "walk" | "transit" | "bicycle";

export type GoogleTravelMode = "WALK" | "TRANSIT" | "BICYCLE";

export type RouteOption = {
  id: TravelMode;
  name: string;
  description: string;
  durationMinutes: number;
  tags: string[];
  encodedPolyline: string;
  efficiency: string;
  noiseLevel: string;
  cost: string;
  error?: string;
};

export type ComputeRoutesRequest = {
  origin: RouteLocation;
  destination: RouteLocation;
};

export type ComputeRoutesResponse = {
  routes: RouteOption[];
};

export type ComputeRoutesError = {
  error: string;
};

export const DEFAULT_ORIGIN: RouteLocation = {
  lat: 40.748,
  lng: -74.0048,
  label: "The High Line, 10th Ave",
};

export const DEFAULT_DESTINATION: RouteLocation = {
  lat: 40.7308,
  lng: -73.9973,
  label: "Washington Square Park",
};
