import { describe, expect, it } from "vitest";
import { DEMO_ITINERARIES } from "./activity";

describe("DEMO_ITINERARIES", () => {
  it("includes three varied saved trips for the activity page", () => {
    expect(DEMO_ITINERARIES).toHaveLength(3);
    expect(DEMO_ITINERARIES.map((trip) => trip.title)).toEqual([
      "Relaxed Village afternoon",
      "Accessible UWS museum morning",
      "Quiet evening by the water",
    ]);
    for (const trip of DEMO_ITINERARIES) {
      expect(trip.items.length).toBeGreaterThanOrEqual(2);
    }
  });
});
