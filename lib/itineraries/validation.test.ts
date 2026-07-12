import { describe, expect, it } from "vitest";
import {
  deriveItineraryTitle,
  parseNoteInput,
  parseSaveItineraryInput,
} from "./validation";
import type { PlaceCardItem } from "@/lib/assistant/agentStreamAdapter";

const validItem = {
  candidateId: "c1",
  rank: 1,
  reason: "cozy",
  name: "Cafe Reggio",
  lat: 40.73,
  lng: -74.0,
  subtitle: "Coffee",
  detail: "Open late",
};

describe("parseSaveItineraryInput", () => {
  it("accepts a well-formed payload", () => {
    // Arrange
    const input = {
      source: "itinerary",
      items: [validItem],
      conversationId: "conv-1",
    };

    // Act
    const result = parseSaveItineraryInput(input);

    // Assert
    expect(result.source).toBe("itinerary");
    expect(result.items).toHaveLength(1);
    expect(result.conversationId).toBe("conv-1");
  });

  it("defaults optional string fields to empty strings", () => {
    // Arrange
    const input = {
      source: "nearby",
      items: [
        {
          candidateId: "c1",
          rank: 2,
          name: "Place",
          lat: 1,
          lng: 2,
        },
      ],
    };

    // Act
    const result = parseSaveItineraryInput(input);

    // Assert
    expect(result.items[0]).toMatchObject({
      reason: "",
      subtitle: "",
      detail: "",
    });
    expect(result.conversationId).toBeNull();
  });

  it("rejects an unknown source", () => {
    expect(() =>
      parseSaveItineraryInput({ source: "bogus", items: [validItem] }),
    ).toThrow("Invalid itinerary");
  });

  it("rejects an empty items array", () => {
    expect(() =>
      parseSaveItineraryInput({ source: "itinerary", items: [] }),
    ).toThrow("Invalid itinerary");
  });

  it("rejects a non-integer rank", () => {
    expect(() =>
      parseSaveItineraryInput({
        source: "itinerary",
        items: [{ ...validItem, rank: 1.5 }],
      }),
    ).toThrow("Invalid itinerary");
  });

  it("rejects a non-finite coordinate", () => {
    expect(() =>
      parseSaveItineraryInput({
        source: "itinerary",
        items: [{ ...validItem, lat: Number.NaN }],
      }),
    ).toThrow("Invalid itinerary");
  });

  it("rejects a missing name", () => {
    expect(() =>
      parseSaveItineraryInput({
        source: "itinerary",
        items: [{ ...validItem, name: "" }],
      }),
    ).toThrow("Invalid itinerary");
  });

  it("rejects a title over the max length", () => {
    expect(() =>
      parseSaveItineraryInput({
        source: "itinerary",
        items: [validItem],
        title: "x".repeat(121),
      }),
    ).toThrow("Invalid itinerary");
  });

  it("trims a provided title and keeps it", () => {
    // Act
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
      title: "  My trip  ",
    });

    // Assert
    expect(result.title).toBe("My trip");
  });

  it("keeps a trimmed non-empty description", () => {
    // Act
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
      description: "  Here is a relaxed morning plan.  ",
    });

    // Assert
    expect(result.description).toBe("Here is a relaxed morning plan.");
  });




  it("drops a whitespace-only description", () => {
    // Act
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
      description: "   ",
    });

    // Assert
    expect(result.description).toBeUndefined();
  });

  it("truncates an over-long description to the cap", () => {
    // Act
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
      description: "x".repeat(5000),
    });

    // Assert
    expect(result.description).toHaveLength(1000);
  });
});


  it("accepts a valid targetTime datetime", () => {
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
      targetTime: "2026-07-10T16:00:00",
    });
    expect(result.targetTime).toBe("2026-07-10T16:00:00");
  });

  it("normalizes targetTime without seconds", () => {
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
      targetTime: "2026-07-10T16:00",
    });
    expect(result.targetTime).toBe("2026-07-10T16:00:00");
  });

  it("rejects time-only targetTime", () => {
    expect(() =>
      parseSaveItineraryInput({
        source: "itinerary",
        items: [validItem],
        targetTime: "16:00:00",
      }),
    ).toThrow("Invalid target time");
  });

  it("rejects date-only targetTime", () => {
    expect(() =>
      parseSaveItineraryInput({
        source: "itinerary",
        items: [validItem],
        targetTime: "2026-07-10",
      }),
    ).toThrow("Invalid target time");
  });

  it("defaults targetTime to null when omitted", () => {
    const result = parseSaveItineraryInput({
      source: "itinerary",
      items: [validItem],
    });
    expect(result.targetTime).toBeNull();
  });

describe("parseNoteInput", () => {
  it("returns an empty string for null or undefined", () => {
    expect(parseNoteInput(null)).toBe("");
    expect(parseNoteInput(undefined)).toBe("");
  });

  it("preserves a valid note verbatim", () => {
    expect(parseNoteInput("Bring a jacket\nMeet at 9am")).toBe(
      "Bring a jacket\nMeet at 9am",
    );
  });

  it("rejects a non-string note", () => {
    expect(() => parseNoteInput(42)).toThrow("Invalid note");
  });

  it("rejects a note over the max length", () => {
    expect(() => parseNoteInput("x".repeat(2001))).toThrow("Invalid note");
  });
});

describe("deriveItineraryTitle", () => {
  it("uses the single place name", () => {
    expect(deriveItineraryTitle([validItem])).toBe("Cafe Reggio");
  });

  it("summarizes multiple places", () => {
    // Arrange
    const items: PlaceCardItem[] = [
      validItem,
      { ...validItem, candidateId: "c2", name: "MoMA" },
      { ...validItem, candidateId: "c3", name: "The High Line" },
    ];

    // Act / Assert
    expect(deriveItineraryTitle(items)).toBe("Cafe Reggio + 2 more");
  });

  it("falls back when there are no items", () => {
    expect(deriveItineraryTitle([])).toBe("Saved trip");
  });
});
