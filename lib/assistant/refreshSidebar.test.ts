import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SIDEBAR_REFRESH_DELAYS_MS,
  scheduleSidebarRefresh,
} from "./refreshSidebar";

describe("scheduleSidebarRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls refresh at each configured delay", () => {
    const refresh = vi.fn();
    scheduleSidebarRefresh(refresh);

    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(1000);
    expect(refresh).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1500);
    expect(refresh).toHaveBeenCalledTimes(3);

    vi.advanceTimersByTime(2500);
    expect(refresh).toHaveBeenCalledTimes(4);
  });

  it("uses the default delay schedule", () => {
    expect(SIDEBAR_REFRESH_DELAYS_MS).toEqual([0, 1000, 2500, 5000]);
  });

  it("clears pending refreshes when cleanup runs", () => {
    const refresh = vi.fn();
    const cleanup = scheduleSidebarRefresh(refresh);

    cleanup();
    vi.runAllTimers();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("supports custom delay schedules", () => {
    const refresh = vi.fn();
    scheduleSidebarRefresh(refresh, [100, 200]);

    vi.advanceTimersByTime(99);
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(200);
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
