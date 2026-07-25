/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { DEMO_MODE_COOKIE, DEMO_USER_COORDS } from "@/lib/demo/mode";
import { requestCurrentPosition } from "./requestCurrentPosition";
import { useGeolocation } from "./useGeolocation";

afterEach(() => {
  document.cookie = `${DEMO_MODE_COOKIE}=; path=/; max-age=0`;
  vi.unstubAllGlobals();
});

describe("requestCurrentPosition demo mode", () => {
  it("returns DEMO_USER_COORDS without calling navigator.geolocation", async () => {
    document.cookie = `${DEMO_MODE_COOKIE}=1; path=/`;
    const getCurrentPosition = vi.fn();
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    await expect(requestCurrentPosition()).resolves.toBe(DEMO_USER_COORDS);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe("useGeolocation demo mode", () => {
  it("returns a stable DEMO_USER_COORDS reference without calling navigator", async () => {
    document.cookie = `${DEMO_MODE_COOKIE}=1; path=/`;
    const getCurrentPosition = vi.fn();
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    const { result, rerender } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.coords).toBe(DEMO_USER_COORDS);
    });

    const first = result.current.coords;
    rerender();
    expect(result.current.coords).toBe(first);
    expect(result.current.coords).toBe(DEMO_USER_COORDS);
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
