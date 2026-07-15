import type { FavoritePlaceSource } from "./types";

type PlaceIdentityInput = {
  lat: number;
  lng: number;
  attractionId?: number;
  placeId?: string;
};

export type PlaceIdentity = {
  source: FavoritePlaceSource;
  sourcePlaceId: string | null;
  placeKey: string;
};

function formatCoordinate(value: number): string {
  const rounded = Number(value.toFixed(5));
  return (Object.is(rounded, -0) ? 0 : rounded).toFixed(5);
}

export function buildPlaceIdentity(input: PlaceIdentityInput): PlaceIdentity {
  if (Number.isInteger(input.attractionId) && (input.attractionId ?? 0) > 0) {
    const sourcePlaceId = String(input.attractionId);
    return {
      source: "attraction",
      sourcePlaceId,
      placeKey: `attraction:${sourcePlaceId}`,
    };
  }

  const placeId = input.placeId?.trim();
  if (placeId) {
    return {
      source: "google",
      sourcePlaceId: placeId,
      placeKey: `google:${placeId}`,
    };
  }

  return {
    source: "coordinate",
    sourcePlaceId: null,
    placeKey: `coordinate:${formatCoordinate(input.lat)}:${formatCoordinate(input.lng)}`,
  };
}
