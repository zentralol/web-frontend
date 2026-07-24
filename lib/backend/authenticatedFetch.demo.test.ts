/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticatedBackendFetch } from "./authenticatedFetch";
import type { FetchLike } from "./authenticatedFetch";
import { DEMO_MODE_COOKIE } from "@/lib/demo/mode";

describe("authenticatedBackendFetch demo mode", () => {
  afterEach(() => {
    document.cookie = `${DEMO_MODE_COOKIE}=; path=/; max-age=0`;
  });

  it("returns demo fixtures without calling getToken or fetch", async () => {
    document.cookie = `${DEMO_MODE_COOKIE}=1; path=/`;
    const fetchImpl = vi.fn<FetchLike>();
    const getToken = vi.fn(async () => "should-not-be-used");

    const response = await authenticatedBackendFetch(
      "https://api.example.test/api/v1/predictions",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 40.75,
          lng: -73.99,
          targetTime: "2026-07-24T15:00:00",
        }),
      },
      getToken,
      fetchImpl,
    );

    expect(getToken).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(response.ok).toBe(true);
    const payload = await response.json();
    expect(payload.success).toBe(true);
  });

  it("streams demo chat without network when demo mode is on", async () => {
    document.cookie = `${DEMO_MODE_COOKIE}=1; path=/`;
    const fetchImpl = vi.fn<FetchLike>();
    const getToken = vi.fn(async () => "should-not-be-used");

    const response = await authenticatedBackendFetch(
      "https://api.example.test/api/v1/chat/stream",
      {
        method: "POST",
        body: JSON.stringify({
          message: "Plan a relaxed day in Greenwich Village",
          conversationId: "demo-conversation-0001",
        }),
      },
      getToken,
      fetchImpl,
    );

    expect(getToken).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    const text = await response.text();
    expect(text).toContain("message_delta");
  });
});
