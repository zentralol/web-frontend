import { crowdLevelMeta } from "./crowdLevels";
import type { CrowdLevel } from "./crowdLevels";
import type {
  Attraction,
  AttractionCrowd,
  AttractionPredictionRow,
  AttractionRow,
} from "./types";

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

/**
 * Merges crowd predictions into attractions. Rows must be sorted by
 * predicted_for descending (the query guarantees this); the first usable row
 * per attraction wins. Attractions without a usable prediction keep
 * `crowd` undefined.
 */
export function attachCrowdToAttractions(
  attractions: Attraction[],
  predictions: AttractionPredictionRow[],
): Attraction[] {
  const crowdByAttractionId = new Map<number, AttractionCrowd>();

  for (const row of predictions) {
    if (crowdByAttractionId.has(row.attraction_id)) continue;
    if (row.crowd_score == null || !row.crowd_level) continue;
    if (!crowdLevelMeta(row.crowd_level)) continue;

    crowdByAttractionId.set(row.attraction_id, {
      score: row.crowd_score,
      level: row.crowd_level as CrowdLevel,
      predictedFor: row.predicted_for,
    });
  }

  return attractions.map((attraction) => {
    const crowd = crowdByAttractionId.get(attraction.id);
    return crowd ? { ...attraction, crowd } : attraction;
  });
}
