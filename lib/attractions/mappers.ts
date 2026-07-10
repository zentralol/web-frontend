import type { Attraction, AttractionRow } from "./types";

export function rowToAttraction(row: AttractionRow): Attraction {
  return {
    id: row.id,
    name: row.Name,
    category: row.Category,
    neighborhood: row.Neighborhood,
    description: row.Description,
    lat: row.lat,
    lng: row.lon,
  };
}
