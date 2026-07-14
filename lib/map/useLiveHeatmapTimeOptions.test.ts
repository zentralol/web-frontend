// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  HEATMAP_OPTIONS_REFRESH_MS,
  useLiveHeatmapTimeOptions,
} from "./useLiveHeatmapTimeOptions";

describe("useLiveHeatmapTimeOptions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-10T19:24:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("does not refresh on an interval while heatmap is disabled", () => {
    const { result } = renderHook(() => useLiveHeatmapTimeOptions(false));
    const initialNowTarget = result.current.options[0].targetTime;

    act(() => {
      vi.setSystemTime(new Date("2026-07-10T20:23:00.000Z"));
      vi.advanceTimersByTime(HEATMAP_OPTIONS_REFRESH_MS);
    });

    expect(result.current.options[0].targetTime).toBe(initialNowTarget);
  });

  test("refreshes immediately when heatmap becomes enabled", () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useLiveHeatmapTimeOptions(enabled),
      { initialProps: { enabled: false } },
    );

    act(() => {
      rerender({ enabled: true });
    });

    expect(result.current.options[1].label).toBe("In 1 hour · 4:24 PM");
  });

  test("refreshOptions updates labels to the current Manhattan minute", () => {
    const { result } = renderHook(() => useLiveHeatmapTimeOptions(true));

    act(() => {
      vi.setSystemTime(new Date("2026-07-10T20:37:00.000Z"));
      result.current.refreshOptions();
    });

    expect(result.current.options[1].label).toBe("In 1 hour · 5:37 PM");
  });

  test("refreshes every minute while heatmap is enabled", () => {
    const { result } = renderHook(() => useLiveHeatmapTimeOptions(true));
    const initialNowTarget = result.current.options[0].targetTime;

    act(() => {
      vi.setSystemTime(new Date("2026-07-10T20:23:00.000Z"));
      vi.advanceTimersByTime(HEATMAP_OPTIONS_REFRESH_MS);
    });

    expect(result.current.options[0].targetTime).not.toBe(initialNowTarget);
    expect(result.current.options[1].label).toBe("In 1 hour · 5:24 PM");
  });
});
