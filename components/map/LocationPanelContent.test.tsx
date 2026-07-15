// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LocationPanelContent } from "./LocationPanelContent";

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

vi.mock("@/components/favorites/FavoritePlaceButton", () => ({
  FavoritePlaceButton: () => <button type="button">Save place</button>,
}));

describe("LocationPanelContent quieter times", () => {
  afterEach(cleanup);

  test("renders the Quieter times title only once", () => {
    render(
      <LocationPanelContent
        selection={{
          status: "ready",
          location: {
            name: "Bryant Park",
            lat: 40.7536,
            lng: -73.9832,
            source: "map",
          },
        }}
        quietTimesData={{
          original: {
            targetTime: "2026-07-01T16:30:00-04:00",
            busynessScore: 86,
            busynessLevel: "very_busy",
          },
          quietTimes: [
            {
              targetTime: "2026-07-01T09:00:00-04:00",
              busynessScore: 20,
              busynessLevel: "very_quiet",
              confidence: 0.68,
              reason: "Quiet window",
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByText("Quieter times")).toHaveLength(1);
  });
});
