import {
  demoCurrentPredictionResponse,
  demoForecastResponse,
} from "./fixtures/predictions";
import {
  demoQuietTimesResponse,
  demoQuieterAreasResponse,
} from "./fixtures/recommendations";
import { createDemoChatStreamResponse } from "./sseStream";

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

async function readJsonBody(init?: RequestInit): Promise<Record<string, unknown>> {
  if (!init?.body) {
    return {};
  }

  if (typeof init.body === "string") {
    try {
      return JSON.parse(init.body) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  return {};
}

function toUrl(input: RequestInfo | URL): URL | null {
  const raw =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;

  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Route Express `/api/v1/*` demo traffic to local fixtures.
 * Returns null when the path is not a known backend API path.
 */
export async function routeDemoBackendRequest(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response | null> {
  const url = toUrl(input);
  if (!url) {
    return null;
  }

  const pathname = url.pathname;
  const body = await readJsonBody(init);

  if (pathname.endsWith("/api/v1/chat/stream")) {
    const message = typeof body.message === "string" ? body.message : "";
    const conversationId =
      typeof body.conversationId === "string"
        ? body.conversationId
        : undefined;
    return createDemoChatStreamResponse({ message, conversationId });
  }

  if (pathname.endsWith("/api/v1/predictions/forecast")) {
    const startTime =
      url.searchParams.get("startTime") ??
      (typeof body.startTime === "string" ? body.startTime : null) ??
      "2026-07-24T12:00:00";
    const limitRaw = url.searchParams.get("limit");
    const hours = limitRaw ? Number(limitRaw) : 6;
    return jsonResponse(
      demoForecastResponse(startTime, Number.isFinite(hours) ? hours : 6),
    );
  }

  if (pathname.endsWith("/api/v1/predictions")) {
    const targetTime =
      typeof body.targetTime === "string" ? body.targetTime : undefined;
    return jsonResponse(demoCurrentPredictionResponse(targetTime));
  }

  if (pathname.endsWith("/api/v1/recommendations/quiet-times")) {
    const targetTime =
      typeof body.targetTime === "string"
        ? body.targetTime
        : "2026-07-24T18:00:00";
    return jsonResponse(demoQuietTimesResponse(targetTime));
  }

  if (pathname.endsWith("/api/v1/recommendations")) {
    const targetTime =
      typeof body.targetTime === "string"
        ? body.targetTime
        : "2026-07-24T18:00:00";
    return jsonResponse(demoQuieterAreasResponse(targetTime));
  }

  return null;
}
