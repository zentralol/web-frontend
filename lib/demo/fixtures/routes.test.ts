import { describe, expect, it } from "vitest";
import {
  DEMO_HIGH_LINE_TO_WSP_POLYLINE,
  DEMO_ROUTES_RESPONSE,
} from "./routes";

describe("DEMO_ROUTES_RESPONSE", () => {
  it("stores distinct Google-captured routes for walk, transit, and bicycle", () => {
    expect(DEMO_ROUTES_RESPONSE.routes.map((route) => route.id)).toEqual([
      "walk",
      "transit",
      "bicycle",
    ]);

    for (const route of DEMO_ROUTES_RESPONSE.routes) {
      expect(route.error).toBeUndefined();
      expect(route.durationMinutes).toBeGreaterThan(0);
      expect(route.encodedPolyline.length).toBeGreaterThan(20);
      expect(route.encodedPolyline).not.toMatch(/^_p~iF~ps\|U/);
    }

    const [walk, transit, bicycle] = DEMO_ROUTES_RESPONSE.routes;
    expect(walk.encodedPolyline).not.toBe(bicycle.encodedPolyline);
    expect(DEMO_HIGH_LINE_TO_WSP_POLYLINE).toBe(walk.encodedPolyline);
    expect(transit.durationMinutes).toBeLessThan(walk.durationMinutes);
    expect(bicycle.durationMinutes).toBeLessThanOrEqual(transit.durationMinutes);
  });
});
