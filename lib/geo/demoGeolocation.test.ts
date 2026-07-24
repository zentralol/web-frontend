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

    await expect(requestCurrentPosition()).resolves.toEqual({
      ...DEMO_USER_COORDS,
    });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});

describe("useGeolocation demo mode", () => {
  it("returns DEMO_USER_COORDS without calling navigator.geolocation", async () => {
    document.cookie = `${DEMO_MODE_COOKIE}=1; path=/`;
    const getCurrentPosition = vi.fn();
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });

    const { result } = renderHook(() => useGeolocation());

    await waitFor(() => {
      expect(result.current.coords).toEqual({ ...DEMO_USER_COORDS });
    });
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });
});
