import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import {
  backendBaseUrl,
  buildApiUrl,
  normalizeBaseUrl,
  parseApiError,
} from "@/lib/activity/predictionApi";
import type {
  QuieterAreaRecommendation,
  QuietTime,
  RecommendationsRequest,
  QuietTimesRequest,
} from "./types";

type ApiErrorPayload = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

type RecommendationsApiPayload = {
  success?: boolean;
  data?: {
    targetTime?: string;
    recommendations?: unknown[];
  };
};

type QuietTimesApiPayload = {
  success?: boolean;
  data?: {
    original?: {
      targetTime?: string;
      busynessScore?: number;
      busynessLevel?: string;
    };
    quietTimes?: unknown[];
  };
};

const DEFAULT_LIMIT = 10;
const DEFAULT_QUIET_TIMES_LIMIT = 24;
const QUIET_AREAS_PATH = "/recommendations";
const QUIET_TIMES_PATH = "/recommendations/quiet-times";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCoordinates(value: unknown): value is { lat: number; lng: number } {
  return (
    isRecord(value) &&
    typeof (value as { lat?: unknown }).lat === "number" &&
    typeof (value as { lng?: unknown }).lng === "number"
  );
}

function mapQuieterAreaRecommendation(item: unknown): QuieterAreaRecommendation | null {
  if (!isRecord(item)) {
    return null;
  }

  const coordinates = item.coordinates;
  if (!isCoordinates(coordinates)) {
    return null;
  }

  const busynessScore = item.busynessScore;
  const busynessLevel = item.busynessLevel;
  if (typeof busynessScore !== "number" || typeof busynessLevel !== "string") {
    return null;
  }

  return {
    type: "quieter_area",
    h3Cell: typeof item.h3Cell === "string" ? item.h3Cell : "",
    coordinates,
    busynessScore,
    busynessLevel,
    pedestriansPredicted:
      typeof item.pedestriansPredicted === "number" ? item.pedestriansPredicted : null,
    period: typeof item.period === "string" ? item.period : "",
    reason: typeof item.reason === "string" ? item.reason : "",
  };
}

function mapQuietTime(item: unknown): QuietTime | null {
  if (!isRecord(item)) {
    return null;
  }

  const busynessScore = item.busynessScore;
  const busynessLevel = item.busynessLevel;
  const confidence = item.confidence;
  if (
    typeof busynessScore !== "number" ||
    typeof busynessLevel !== "string" ||
    typeof confidence !== "number"
  ) {
    return null;
  }

  return {
    targetTime: typeof item.targetTime === "string" ? item.targetTime : "",
    busynessScore,
    busynessLevel,
    confidence,
    reason: typeof item.reason === "string" ? item.reason : "",
  };
}

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function fetchQuieterAreas(
  request: RecommendationsRequest,
  backendFetch: FetchLike,
): Promise<FetchResult<{ targetTime: string; recommendations: QuieterAreaRecommendation[] }>> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const response = await backendFetch(buildApiUrl(baseUrl, QUIET_AREAS_PATH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: request.lat,
        lng: request.lng,
        targetTime: request.targetTime,
        limit: request.limit ?? DEFAULT_LIMIT,
      }),
    });

    const payload = (await response.json()) as RecommendationsApiPayload | ApiErrorPayload;

    const data = (payload as RecommendationsApiPayload).data;
    const recommendations = data?.recommendations;
    const targetTime = data?.targetTime;

    if (!response.ok || !Array.isArray(recommendations) || typeof targetTime !== "string") {
      return {
        ok: false,
        error: parseApiError(payload, "Could not load quieter areas."),
      };
    }

    const mappedRecommendations = recommendations
      .map(mapQuieterAreaRecommendation)
      .filter((item): item is QuieterAreaRecommendation => item !== null);

    return {
      ok: true,
      data: {
        targetTime,
        recommendations: mappedRecommendations,
      },
    };
  } catch {
    return { ok: false, error: "Could not load quieter areas." };
  }
}

export async function fetchQuietTimes(
  request: QuietTimesRequest,
  backendFetch: FetchLike,
): Promise<FetchResult<{ original: { targetTime: string; busynessScore: number; busynessLevel: string }; quietTimes: QuietTime[] }>> {
  try {
    const baseUrl = normalizeBaseUrl(backendBaseUrl);
    const response = await backendFetch(buildApiUrl(baseUrl, QUIET_TIMES_PATH), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: request.lat,
        lng: request.lng,
        targetTime: request.targetTime,
        startTime: request.startTime,
        endTime: request.endTime,
        limit: request.limit ?? DEFAULT_QUIET_TIMES_LIMIT,
      }),
    });

    const payload = (await response.json()) as QuietTimesApiPayload | ApiErrorPayload;

    const data = (payload as QuietTimesApiPayload).data;
    const original = data?.original;
    const quietTimes = data?.quietTimes;

    if (
      !response.ok ||
      !isRecord(original) ||
      typeof original.targetTime !== "string" ||
      typeof original.busynessScore !== "number" ||
      typeof original.busynessLevel !== "string" ||
      !Array.isArray(quietTimes)
    ) {
      return {
        ok: false,
        error: parseApiError(payload, "Could not load quieter times."),
      };
    }

    const mappedQuietTimes = quietTimes
      .map(mapQuietTime)
      .filter((item): item is QuietTime => item !== null);

    return {
      ok: true,
      data: {
        original: {
          targetTime: original.targetTime,
          busynessScore: original.busynessScore,
          busynessLevel: original.busynessLevel,
        },
        quietTimes: mappedQuietTimes,
      },
    };
  } catch {
    return { ok: false, error: "Could not load quieter times." };
  }
}
