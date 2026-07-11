import type { PlaceCardItem } from "@/lib/assistant/agentStreamAdapter";
import type { ItinerarySource } from "./types";

const ITINERARY_SOURCES = new Set<ItinerarySource>([
  "nearby",
  "attractions",
  "recommend",
  "itinerary",
  "mixed",
]);

const MAX_ITEMS = 50;
const MAX_TITLE_LENGTH = 120;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_NOTE_LENGTH = 2000;

export type ParsedSaveItinerary = {
  source: ItinerarySource;
  items: PlaceCardItem[];
  description?: string;
  title?: string;
  conversationId: string | null;
};

function invalidItinerary(): never {
  throw new Error("Invalid itinerary");
}

function asPlainObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    invalidItinerary();
  }
  return input as Record<string, unknown>;
}

function requireString(value: unknown): string {
  if (typeof value !== "string") {
    invalidItinerary();
  }
  return value;
}

function optionalString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function requireFiniteNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    invalidItinerary();
  }
  return value;
}

/** Validate a single raw place-card item into a typed PlaceCardItem. */
function parsePlaceCardItem(value: unknown): PlaceCardItem {
  const object = asPlainObject(value);

  const candidateId = requireString(object.candidateId);
  const name = requireString(object.name);
  const lat = requireFiniteNumber(object.lat);
  const lng = requireFiniteNumber(object.lng);

  const rank = object.rank;
  if (typeof rank !== "number" || !Number.isInteger(rank) || rank < 1) {
    invalidItinerary();
  }

  if (!candidateId || !name) {
    invalidItinerary();
  }

  return {
    candidateId,
    rank,
    name,
    lat,
    lng,
    reason: optionalString(object.reason),
    subtitle: optionalString(object.subtitle),
    detail: optionalString(object.detail),
  };
}

/**
 * Validate untrusted save input from the client boundary. Throws on any
 * malformed field. Returns a normalized payload ready to persist.
 */
export function parseSaveItineraryInput(input: unknown): ParsedSaveItinerary {
  const object = asPlainObject(input);

  const source = object.source;
  if (
    typeof source !== "string" ||
    !ITINERARY_SOURCES.has(source as ItinerarySource)
  ) {
    invalidItinerary();
  }

  if (!Array.isArray(object.items) || object.items.length === 0) {
    invalidItinerary();
  }
  if (object.items.length > MAX_ITEMS) {
    invalidItinerary();
  }

  const items = object.items.map(parsePlaceCardItem);

  const conversationId =
    typeof object.conversationId === "string" ? object.conversationId : null;

  let description: string | undefined;
  if (object.description !== undefined && object.description !== null) {
    // The description is a model-generated plan summary; truncate rather than
    // reject so an over-long output never blocks the save.
    const trimmed = requireString(object.description).trim();
    if (trimmed.length > 0) {
      description = trimmed.slice(0, MAX_DESCRIPTION_LENGTH);
    }
  }

  let title: string | undefined;
  if (object.title !== undefined && object.title !== null) {
    const trimmed = requireString(object.title).trim();
    if (trimmed.length > MAX_TITLE_LENGTH) {
      invalidItinerary();
    }
    if (trimmed.length > 0) {
      title = trimmed;
    }
  }

  return {
    source: source as ItinerarySource,
    items,
    description,
    title,
    conversationId,
  };
}

/**
 * Validate an untrusted user note. Accepts an empty string (clears the note).
 * Throws when the value is not a string or exceeds the length cap.
 */
export function parseNoteInput(input: unknown): string {
  if (input === undefined || input === null) {
    return "";
  }
  if (typeof input !== "string") {
    throw new Error("Invalid note");
  }
  if (input.length > MAX_NOTE_LENGTH) {
    throw new Error("Invalid note");
  }
  return input;
}

/** Auto-generate a human-friendly title from a saved itinerary's contents. */
export function deriveItineraryTitle(items: PlaceCardItem[]): string {
  const first = items[0]?.name?.trim();
  if (!first) {
    return "Saved trip";
  }
  if (items.length === 1) {
    return first;
  }
  return `${first} + ${items.length - 1} more`;
}
