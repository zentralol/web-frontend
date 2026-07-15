import { describe, expect, test } from "vitest";
import { parseLocationDeepLink } from "./locationDeepLink";

function params(value: string): URLSearchParams {
  return new URLSearchParams(value);
}

describe("parseLocationDeepLink", () => {
  test("restores a coordinate-backed saved place", () => {
    expect(
      parseLocationDeepLink(
        params(
          "lat=40.7536&lng=-73.9832&name=Bryant+Park&address=New+York&placeId=ChIJ123",
        ),
      ),
    ).toEqual({
      lat: 40.7536,
      lng: -73.9832,
      name: "Bryant Park",
      address: "New York",
      placeId: "ChIJ123",
      source: "map",
    });
  });

  test.each(["", "lat=&lng=-73", "lat=91&lng=-73", "lat=40&lng=bad"])(
    "ignores an invalid coordinate link",
    (value) => {
      expect(parseLocationDeepLink(params(value))).toBeNull();
    },
  );

  test("lets the existing attraction id flow take precedence", () => {
    expect(
      parseLocationDeepLink(params("id=42&lat=40.7536&lng=-73.9832")),
    ).toBeNull();
  });
});
