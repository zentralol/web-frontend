// @vitest-environment jsdom

import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { AttractionBrowsePanelProps } from "./AttractionBrowsePanel";
import LocationPanel from "./LocationPanel";

const mocks = vi.hoisted(() => ({
  backendFetch: vi.fn(),
  fetchQuietTimes: vi.fn(),
}));

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

vi.mock("@/lib/backend/useAuthenticatedBackendFetch", () => ({
  useAuthenticatedBackendFetch: () => mocks.backendFetch,
}));

vi.mock("@/lib/recommendations/fetchRecommendations", () => ({
  fetchQuietTimes: mocks.fetchQuietTimes,
}));

describe("LocationPanel quieter-times loading", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T19:24:00.000Z"));
    vi.stubGlobal(
      "requestAnimationFrame",
      (callback: FrameRequestCallback) =>
        window.setTimeout(() => callback(performance.now()), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
    mocks.fetchQuietTimes.mockResolvedValue({
      ok: true,
      data: {
        original: {
          targetTime: "2026-07-10T15:24:00",
          busynessScore: 42,
          busynessLevel: "moderate",
        },
        quietTimes: [],
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  test("fetches quieter times once and always uses the current time", async () => {
    const legacyHeatmapProps = {
      selectedTargetTime: "2030-01-01T08:00:00",
      heatmapEnabled: true,
    };

    render(
      <LocationPanel
        selection={{
          status: "ready",
          location: {
            lat: 40.758,
            lng: -73.9855,
            source: "map",
          },
        }}
        browsePanelProps={{} as AttractionBrowsePanelProps}
        {...legacyHeatmapProps}
      />,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(mocks.fetchQuietTimes).toHaveBeenCalledTimes(1);
    expect(mocks.fetchQuietTimes.mock.calls[0][0]).toMatchObject({
      targetTime: "2026-07-10T15:24:00",
      startTime: "2026-07-10T15:24:00",
      endTime: "2026-07-11T15:24:00",
    });
  });

  test("keeps desktop location details inside an independent scroll region", () => {
    const { container } = render(
      <LocationPanel
        selection={{
          status: "ready",
          location: {
            name: "Bryant Park",
            lat: 40.7536,
            lng: -73.9832,
            source: "map",
          },
        }}
        browsePanelProps={{} as AttractionBrowsePanelProps}
      />,
    );

    const aside = container.querySelector("aside");
    const detailScroller = container.querySelector(
      '[data-testid="desktop-location-detail-scroller"]',
    );

    expect(aside?.className).toContain("overflow-hidden");
    expect(detailScroller?.className).toContain("min-h-0");
    expect(detailScroller?.className).toContain("overflow-y-auto");
  });

  test("replaces the previous location's quieter times with a fresh placeholder", async () => {
    const { rerender } = render(
      <LocationPanel
        selection={{
          status: "ready",
          location: {
            name: "Bryant Park",
            lat: 40.7536,
            lng: -73.9832,
            source: "map",
          },
        }}
        browsePanelProps={{} as AttractionBrowsePanelProps}
      />,
    );

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(screen.getAllByText(/No quiet windows/).length).toBeGreaterThan(0);
    mocks.fetchQuietTimes.mockImplementationOnce(() => new Promise(() => {}));

    rerender(
      <LocationPanel
        selection={{
          status: "ready",
          location: {
            name: "Central Park",
            lat: 40.7812,
            lng: -73.9665,
            source: "map",
          },
        }}
        browsePanelProps={{} as AttractionBrowsePanelProps}
      />,
    );

    expect(screen.queryByText(/No quiet windows/)).toBeNull();
    expect(
      screen.getAllByLabelText("Loading quieter times").length,
    ).toBeGreaterThan(0);
  });
});
