const DEFAULT_BACKEND_BASE_URL = "http://localhost:3000";
const API_PREFIX = "/api/v1";

export const backendBaseUrl =
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? DEFAULT_BACKEND_BASE_URL;

type ApiErrorPayload = {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
  };
};

export function normalizeBaseUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function buildApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${API_PREFIX}${path}`;
}

export function parseApiError(payload: unknown, fallbackMessage: string): string {
  if (!payload || typeof payload !== "object") {
    return fallbackMessage;
  }
  const maybeError = (payload as ApiErrorPayload).error;
  if (!maybeError) {
    return fallbackMessage;
  }
  if (maybeError.code === "LOCATION_OUT_OF_COVERAGE") {
    return "Predictions are currently available for Manhattan only.";
  }
  return maybeError.message ?? fallbackMessage;
}
