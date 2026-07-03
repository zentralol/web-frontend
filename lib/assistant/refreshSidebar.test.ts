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

  it("calls refresh at each configured delay", async () => {
    const refresh = vi.fn();
    scheduleSidebarRefresh(refresh);

    expect(refresh).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(0);
    expect(refresh).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    expect(refresh).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1500);
    expect(refresh).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(2500);
    expect(refresh).toHaveBeenCalledTimes(4);

    await vi.advanceTimersByTimeAsync(3000);
    expect(refresh).toHaveBeenCalledTimes(5);
  });

  it("uses the default delay schedule", () => {
    expect(SIDEBAR_REFRESH_DELAYS_MS).toEqual([0, 1000, 2500, 5000, 8000]);
  });

  it("clears pending refreshes when cleanup runs", async () => {
    const refresh = vi.fn();
    const cleanup = scheduleSidebarRefresh(refresh);

    cleanup();
    await vi.runAllTimersAsync();

    expect(refresh).not.toHaveBeenCalled();
  });

  it("supports custom delay schedules", async () => {
    const refresh = vi.fn();
    scheduleSidebarRefresh(refresh, [100, 200]);

    await vi.advanceTimersByTimeAsync(99);
    expect(refresh).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(refresh).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(200);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("supports async refresh callbacks", async () => {
    const refresh = vi.fn(async () => {
      await Promise.resolve();
    });

    scheduleSidebarRefresh(refresh);
    await vi.advanceTimersByTimeAsync(0);

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
