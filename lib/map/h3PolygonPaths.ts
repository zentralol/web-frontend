import { cellToBoundary } from "h3-js";

/** Convert an H3 cell id to Google Maps polygon vertices (lat/lng). */
export function h3CellToPolygonPaths(
  h3Cell: string,
): Array<{ lat: number; lng: number }> {
  return cellToBoundary(h3Cell, false).map(([lat, lng]) => ({ lat, lng }));
}
