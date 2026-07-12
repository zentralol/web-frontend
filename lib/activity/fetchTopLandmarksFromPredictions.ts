import { isScenicAttraction } from "@/lib/attractions/categoryGroups";
import type {
  Attraction,
  AttractionPredictionRow,
} from "@/lib/attractions/types";

export const TOP_LANDMARKS_LIMIT = 5;

export type LandmarksSortOrder = "busiest_first" | "quietest_first";

export type TopLandmark = {
  attraction: Attraction;
  busynessScore: number;
  busynessLevel: string;
  rank: number;
};

export type RankTopLandmarksFromPredictionsOptions = {
  limit?: number;
  sortOrder?: LandmarksSortOrder;
};

export type TopLandmarksResult = {
  landmarks: TopLandmark[];
  targetTime: string;
};

/**
 * Ranks scenic attractions using pre-computed predictions from the
 * `attraction_predictions` table instead of calling the backend ML service.
 * The newest usable row per attraction wins, determined by `predicted_for`.
 */
export function rankTopLandmarksFromPredictions(
  attractions: Attraction[],
  predictions: AttractionPredictionRow[],
  options: RankTopLandmarksFromPredictionsOptions = {},
): TopLandmarksResult {
  const sortOrder = options.sortOrder ?? "busiest_first";
  const limit = options.limit ?? TOP_LANDMARKS_LIMIT;

  const attractionById = new Map(
    attractions.map((attraction) => [attraction.id, attraction]),
  );

  const newestByAttractionId = new Map<number, AttractionPredictionRow>();
  for (const row of predictions) {
    if (row.crowd_score == null || !row.crowd_level) continue;

    const existing = newestByAttractionId.get(row.attraction_id);
    if (!existing || row.predicted_for > existing.predicted_for) {
      newestByAttractionId.set(row.attraction_id, row);
    }
  }

  let newestPredictedFor: string | null = null;

  const ranked: TopLandmark[] = [];
  for (const [attractionId, row] of newestByAttractionId) {
    const attraction = attractionById.get(attractionId);
    if (!attraction || !isScenicAttraction(attraction.category)) continue;

    ranked.push({
      attraction,
      busynessScore: row.crowd_score as number,
      busynessLevel: row.crowd_level as string,
      rank: 0, // assigned after sorting/limiting
    });

    if (
      !newestPredictedFor ||
      (row.predicted_for && row.predicted_for > newestPredictedFor)
    ) {
      newestPredictedFor = row.predicted_for;
    }
  }

  ranked.sort((left, right) => {
    const diff = right.busynessScore - left.busynessScore;
    return sortOrder === "busiest_first" ? diff : -diff;
  });

  const limited = ranked.slice(0, limit);

  return {
    landmarks: limited.map((item, index) => ({ ...item, rank: index + 1 })),
    targetTime: newestPredictedFor ?? "",
  };
}
