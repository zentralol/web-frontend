import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import type { Attraction } from "@/lib/attractions/types";
import { formatInNewYork } from "@/lib/time/manhattanTime";
import {
  backendBaseUrl,
  buildApiUrl,
  normalizeBaseUrl,
  parseApiError,
} from "./predictionApi";

export const TOP_LANDMARKS_LIMIT = 5;
export const BATCH_CHUNK_SIZE = 100;

export type TopLandmark = {
  attraction: Attraction;
  busynessScore: number;
  busynessLevel: string;
  rank: number;
};

type BatchPrediction = {
  clientId?: string | null;
  busynessScore?: number;
  busynessLevel?: string;
};

type BatchPayload = {
  success?: boolean;
  data?: {
    predictions?: BatchPrediction[];
    warnings?: unknown[];
  };
  error?: { code?: string; message?: string };
};

export function chunkItems<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) {
    return [];
  }
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export function rankTopBusyAttractions(
  attractions: Attraction[],
  predictions: BatchPrediction[],
  limit = TOP_LANDMARKS_LIMIT,
): TopLandmark[] {
  const attractionById = new Map(
    attractions.map((attraction) => [String(attraction.id), attraction]),
  );

  return predictions
    .filter(
      (prediction) =>
        prediction.clientId != null &&
        prediction.busynessScore != null &&
        prediction.busynessLevel != null &&
        attractionById.has(String(prediction.clientId)),
    )
    .sort(
      (left, right) =>
        (right.busynessScore as number) - (left.busynessScore as number),
    )
    .slice(0, limit)
    .map((prediction, index) => ({
      attraction: attractionById.get(String(prediction.clientId)) as Attraction,
      busynessScore: prediction.busynessScore as number,
      busynessLevel: prediction.busynessLevel as string,
      rank: index + 1,
    }));
}

async function fetchBatchChunk(
  attractions: Attraction[],
  targetTime: string,
  backendFetch: FetchLike,
  baseUrl: string,
): Promise<BatchPrediction[]> {
  const response = await backendFetch(buildApiUrl(baseUrl, "/predictions/batch"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetTime,
      durationMinutes: 60,
      coordinates: attractions.map((attraction) => ({
        clientId: String(attraction.id),
        lat: attraction.lat,
        lng: attraction.lng,
      })),
    }),
  });

  const payload = (await response.json()) as BatchPayload;

  if (!response.ok) {
    throw new Error(
      parseApiError(payload, "Could not load landmark busyness predictions."),
    );
  }

  return payload.data?.predictions ?? [];
}

export type TopLandmarksResult = {
  landmarks: TopLandmark[];
  targetTime: string;
  error?: string;
};

export async function fetchTopLandmarks(
  attractions: Attraction[],
  backendFetch: FetchLike,
): Promise<TopLandmarksResult> {
  if (attractions.length === 0) {
    return { landmarks: [], targetTime: formatInNewYork(new Date()) };
  }

  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const targetTime = formatInNewYork(new Date());
    const chunks = chunkItems(attractions, BATCH_CHUNK_SIZE);
    const allPredictions: BatchPrediction[] = [];

    for (const chunk of chunks) {
      const predictions = await fetchBatchChunk(
        chunk,
        targetTime,
        backendFetch,
        baseUrl,
      );
      allPredictions.push(...predictions);
    }

    return {
      landmarks: rankTopBusyAttractions(attractions, allPredictions),
      targetTime,
    };
  } catch (error) {
    return {
      landmarks: [],
      targetTime: formatInNewYork(new Date()),
      error:
        error instanceof Error
          ? error.message
          : "Could not load landmark busyness predictions.",
    };
  }
}
