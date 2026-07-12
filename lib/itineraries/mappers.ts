import type { SavedItinerary, SavedItineraryRow } from "./types";

/** Convert a DB row into the app-facing camelCase model. */
export function rowToSavedItinerary(row: SavedItineraryRow): SavedItinerary {
  return {
    id: row.id,
    title: row.title,
    source: row.source,
    items: row.items ?? [],
    description: row.description ?? null,
    note: row.note ?? null,
    conversationId: row.conversation_id,
    createdAt: row.created_at,
  };
}
