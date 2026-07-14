import { describe, expect, test } from "vitest";
import { h3CellToPolygonPaths } from "./h3PolygonPaths";

describe("h3CellToPolygonPaths", () => {
  test("returns lat/lng vertices in Manhattan for a known cell", () => {
    const paths = h3CellToPolygonPaths("892a100d2c3ffff");

    expect(paths.length).toBeGreaterThan(0);
    for (const point of paths) {
      expect(point.lat).toBeGreaterThan(40.6);
      expect(point.lat).toBeLessThan(40.9);
      expect(point.lng).toBeLessThan(-73.9);
      expect(point.lng).toBeGreaterThan(-74.1);
    }
  });
});
