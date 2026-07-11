import { describe, expect, it } from "vitest";
import {
  deriveItineraryTitle,
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
