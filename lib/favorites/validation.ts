import { buildPlaceIdentity } from "./placeKey";
import type { ParsedFavoritePlaceInput } from "./types";

const LIMITS = {
  name: 200,
  address: 500,
  placeId: 255,
  category: 100,
  neighborhood: 150,
} as const;

function readRequiredString(
  value: unknown,
  field: keyof Pick<typeof LIMITS, "name">,
): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > LIMITS[field]) {
    throw new Error(`Invalid ${field}`);
  }
  return trimmed;
}

function readOptionalString(
  value: unknown,
  field: keyof Omit<typeof LIMITS, "name">,
): string | undefined {
  if (value == null || value === "") {
    return undefined;
  }
  if (typeof value !== "string") {
    throw new Error(`Invalid ${field}`);
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > LIMITS[field]) {
    throw new Error(`Invalid ${field}`);
  }
  return trimmed;
}

function readCoordinate(value: unknown, field: "lat" | "lng"): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Invalid ${field}`);
  }

  const limit = field === "lat" ? 90 : 180;
  if (value < -limit || value > limit) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

export function parseFavoritePlaceInput(
  input: unknown,
): ParsedFavoritePlaceInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Invalid favorite place");
  }

  const value = input as Record<string, unknown>;
  const name = readRequiredString(value.name, "name");
  const lat = readCoordinate(value.lat, "lat");
  const lng = readCoordinate(value.lng, "lng");
  const address = readOptionalString(value.address, "address");
  const placeId = readOptionalString(value.placeId, "placeId");
  const category = readOptionalString(value.category, "category");
  const neighborhood = readOptionalString(value.neighborhood, "neighborhood");

  let attractionId: number | undefined;
  if (value.attractionId != null) {
    if (
      typeof value.attractionId !== "number" ||
      !Number.isInteger(value.attractionId) ||
      value.attractionId <= 0
    ) {
      throw new Error("Invalid attractionId");
    }
    attractionId = value.attractionId;
  }

  const identity = buildPlaceIdentity({ lat, lng, attractionId, placeId });
  return {
    name,
    lat,
    lng,
    address,
    placeId,
    attractionId,
    category,
    neighborhood,
    ...identity,
  };
}

export function parsePlaceKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("Invalid place key");
  }

  const trimmed = value.trim();
  const separatorIndex = trimmed.indexOf(":");
  if (
    !trimmed ||
    trimmed.length > 320 ||
    !/^(attraction|google|coordinate):/.test(trimmed) ||
    separatorIndex === trimmed.length - 1
  ) {
    throw new Error("Invalid place key");
  }
  return trimmed;
}
