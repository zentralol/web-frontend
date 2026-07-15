import { buildRoutesHref } from "@/lib/attractions/buildRoutesHref";
import type { FavoritePlace } from "./types";

export function buildFavoriteMapHref(place: FavoritePlace): string {
  if (place.source === "attraction" && place.sourcePlaceId) {
    return `/map?id=${encodeURIComponent(place.sourcePlaceId)}`;
  }

  const params = new URLSearchParams({
    lat: String(place.lat),
    lng: String(place.lng),
    name: place.name,
  });
  if (place.address) {
    params.set("address", place.address);
  }
  if (place.source === "google" && place.sourcePlaceId) {
    params.set("placeId", place.sourcePlaceId);
  }
  return `/map?${params.toString()}`;
}

export function buildFavoriteRoutesHref(place: FavoritePlace): string {
  return buildRoutesHref({
    lat: place.lat,
    lng: place.lng,
    name: place.name,
  });
}
