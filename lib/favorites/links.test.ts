import { describe, expect, test } from "vitest";
import { buildFavoriteMapHref, buildFavoriteRoutesHref } from "./links";
import type { FavoritePlace } from "./types";

const basePlace: FavoritePlace = {
  id: "favorite-1",
  placeKey: "coordinate:40.75360:-73.98320",
  source: "coordinate",
  sourcePlaceId: null,
  name: "Bryant Park",
  address: "New York, NY",
  lat: 40.7536,
  lng: -73.9832,
  category: null,
  neighborhood: null,
  createdAt: "2026-07-15T12:00:00.000Z",
};

describe("favorite place links", () => {
  test("links Zentra attractions by attraction id", () => {
    expect(
      buildFavoriteMapHref({
        ...basePlace,
        source: "attraction",
        sourcePlaceId: "42",
        placeKey: "attraction:42",
      }),
    ).toBe("/map?id=42");
  });

  test("links external places by coordinates and preserves their identity", () => {
    const href = buildFavoriteMapHref({
      ...basePlace,
      source: "google",
      sourcePlaceId: "ChIJ123",
      placeKey: "google:ChIJ123",
    });
    const url = new URL(href, "https://zentra.test");

    expect(url.pathname).toBe("/map");
    expect(url.searchParams.get("lat")).toBe("40.7536");
    expect(url.searchParams.get("lng")).toBe("-73.9832");
    expect(url.searchParams.get("name")).toBe("Bryant Park");
    expect(url.searchParams.get("placeId")).toBe("ChIJ123");
  });

  test("builds an existing route-planner destination link", () => {
    const url = new URL(
      buildFavoriteRoutesHref(basePlace),
      "https://zentra.test",
    );
    expect(url.pathname).toBe("/routes");
    expect(url.searchParams.get("destLabel")).toBe("Bryant Park");
  });
});
