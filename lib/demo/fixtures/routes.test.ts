import { describe, expect, it } from "vitest";
import {
  DEMO_HIGH_LINE_TO_WSP_POLYLINE,
  DEMO_ROUTES_RESPONSE,
} from "./routes";

describe("DEMO_ROUTES_RESPONSE", () => {
  it("uses a Manhattan High Line → WSP polyline instead of the Google docs sample", () => {
    expect(DEMO_HIGH_LINE_TO_WSP_POLYLINE).not.toMatch(/^_p~iF~ps\|U/);
    expect(DEMO_ROUTES_RESPONSE.routes).toHaveLength(3);
    for (const route of DEMO_ROUTES_RESPONSE.routes) {
      expect(route.encodedPolyline).toBe(DEMO_HIGH_LINE_TO_WSP_POLYLINE);
    }
  });
});
