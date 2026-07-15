import { describe, expect, test } from "vitest";
import { buildPlaceIdentity } from "./placeKey";

describe("buildPlaceIdentity", () => {
  test("prefers a Zentra attraction id", () => {
    expect(
      buildPlaceIdentity({
        lat: 40.758,
        lng: -73.9855,
        attractionId: 42,
        placeId: "google-id",
      }),
    ).toEqual({
      source: "attraction",
      sourcePlaceId: "42",
      placeKey: "attraction:42",
    });
  });

  test("uses a trimmed Google place id when there is no attraction id", () => {
    expect(
      buildPlaceIdentity({
        lat: 40.758,
        lng: -73.9855,
        placeId: "  ChIJ123  ",
      }),
    ).toEqual({
      source: "google",
      sourcePlaceId: "ChIJ123",
      placeKey: "google:ChIJ123",
    });
  });

  test("falls back to coordinates rounded to five decimal places", () => {
    expect(
      buildPlaceIdentity({ lat: 40.758004, lng: -73.985496 }),
    ).toEqual({
      source: "coordinate",
      sourcePlaceId: null,
      placeKey: "coordinate:40.75800:-73.98550",
    });
  });
});
