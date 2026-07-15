import { describe, expect, test } from "vitest";
import {
  MAX_FAVORITE_NOTE_LENGTH,
  parseFavoriteNoteInput,
  parseFavoritePlaceInput,
  parsePlaceKey,
} from "./validation";

describe("parseFavoritePlaceInput", () => {
  test("normalizes a valid favorite place and derives its identity", () => {
    expect(
      parseFavoritePlaceInput({
        name: "  Bryant Park  ",
        lat: 40.7536,
        lng: -73.9832,
        placeId: " google-place ",
        address: "  New York, NY  ",
      }),
    ).toMatchObject({
      name: "Bryant Park",
      lat: 40.7536,
      lng: -73.9832,
      placeId: "google-place",
      address: "New York, NY",
      source: "google",
      placeKey: "google:google-place",
    });
  });

  test.each([
    [{ name: "", lat: 40, lng: -73 }, "Invalid name"],
    [{ name: "Place", lat: 91, lng: -73 }, "Invalid lat"],
    [{ name: "Place", lat: 40, lng: -181 }, "Invalid lng"],
    [
      { name: "Place", lat: 40, lng: -73, attractionId: 1.5 },
      "Invalid attractionId",
    ],
  ])("rejects invalid input", (input, message) => {
    expect(() => parseFavoritePlaceInput(input)).toThrow(message);
  });
});

describe("parsePlaceKey", () => {
  test("accepts supported place key namespaces", () => {
    expect(parsePlaceKey(" attraction:42 ")).toBe("attraction:42");
    expect(parsePlaceKey("google:ChIJ123")).toBe("google:ChIJ123");
    expect(parsePlaceKey("coordinate:40.00000:-73.00000")).toBe(
      "coordinate:40.00000:-73.00000",
    );
  });

  test("rejects unsupported place key namespaces", () => {
    expect(() => parsePlaceKey("assistant:123")).toThrow("Invalid place key");
    expect(() => parsePlaceKey("google:")).toThrow("Invalid place key");
  });
});

describe("parseFavoriteNoteInput", () => {
  test("preserves note whitespace and accepts an empty value to clear it", () => {
    expect(parseFavoriteNoteInput("  Meet by the fountain  ")).toBe(
      "  Meet by the fountain  ",
    );
    expect(parseFavoriteNoteInput(null)).toBe("");
  });

  test("rejects non-string and oversized notes", () => {
    expect(() => parseFavoriteNoteInput(42)).toThrow("Invalid note");
    expect(() =>
      parseFavoriteNoteInput("x".repeat(MAX_FAVORITE_NOTE_LENGTH + 1)),
    ).toThrow("Invalid note");
  });
});
