import type { FavoritePlace, FavoritePlaceRow } from "./types";

export function rowToFavoritePlace(row: FavoritePlaceRow): FavoritePlace {
  return {
    id: row.id,
    placeKey: row.place_key,
    source: row.source,
    sourcePlaceId: row.source_place_id,
    name: row.name,
    address: row.address,
    lat: row.latitude,
    lng: row.longitude,
    category: row.category,
    neighborhood: row.neighborhood,
    createdAt: row.created_at,
  };
}
