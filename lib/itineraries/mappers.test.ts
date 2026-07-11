import { describe, expect, it } from "vitest";
import { rowToSavedItinerary } from "./mappers";
import type { SavedItineraryRow } from "./types";

const baseRow: SavedItineraryRow = {
  id: "itinerary-1",
  user_id: "user_123",
  conversation_id: "conv-1",
  title: "A relaxed day",
  source: "itinerary",
  items: [
    {
      candidateId: "c1",
      rank: 1,
      reason: "cozy",
      name: "Cafe Reggio",
      lat: 40.73,
      lng: -74.0,
      subtitle: "Coffee",
      detail: "Open late",
    },
  ],
  description: "A cozy Greenwich Village morning.",
  note: "Bring cash",
  created_at: "2026-07-11T00:00:00.000Z",
  deleted_at: null,
};

describe("rowToSavedItinerary", () => {
  it("maps snake_case row to camelCase model", () => {
    // Arrange / Act
    const result = rowToSavedItinerary(baseRow);

    // Assert
    expect(result).toEqual({
      id: "itinerary-1",
      title: "A relaxed day",
      source: "itinerary",
      items: baseRow.items,
      description: "A cozy Greenwich Village morning.",
      note: "Bring cash",
      conversationId: "conv-1",
      createdAt: "2026-07-11T00:00:00.000Z",
    });
  });

  it("preserves a null conversation id", () => {
    // Arrange
    const row = { ...baseRow, conversation_id: null };

    // Act
    const result = rowToSavedItinerary(row);

    // Assert
    expect(result.conversationId).toBeNull();
  });

  it("defaults items to an empty array when missing", () => {
    // Arrange
    const row = { ...baseRow, items: undefined as unknown as [] };

    // Act
    const result = rowToSavedItinerary(row);

    // Assert
    expect(result.items).toEqual([]);
  });
});
