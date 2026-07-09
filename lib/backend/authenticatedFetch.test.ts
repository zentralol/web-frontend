import { describe, expect, it, vi } from "vitest";
import { authenticatedBackendFetch } from "./authenticatedFetch";
import type { FetchLike } from "./authenticatedFetch";

describe("authenticatedBackendFetch", () => {
  it("adds the Clerk session token as a Bearer token", async () => {
    const fetchImpl = vi.fn<FetchLike>(
      async () => new Response(null, { status: 204 }),
    );

    await authenticatedBackendFetch(
      "https://api.example.test/api/v1/predictions",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      async () => "session-token",
      fetchImpl,
    );

    const [, init] = fetchImpl.mock.calls[0];
    const headers = init?.headers as Headers;

    expect(headers.get("Authorization")).toBe("Bearer session-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("replaces stale authorization headers with the current Clerk token", async () => {
    const fetchImpl = vi.fn<FetchLike>(
      async () => new Response(null, { status: 204 }),
    );

    await authenticatedBackendFetch(
      "https://api.example.test/api/v1/predictions",
      { headers: { Authorization: "Bearer stale-token" } },
      async () => "fresh-token",
      fetchImpl,
    );

    const [, init] = fetchImpl.mock.calls[0];
    const headers = init?.headers as Headers;

    expect(headers.get("Authorization")).toBe("Bearer fresh-token");
  });

  it("fails before sending the request when no Clerk token is available", async () => {
    const fetchImpl = vi.fn<FetchLike>();

    await expect(
      authenticatedBackendFetch(
        "https://api.example.test/api/v1/predictions",
        {},
        async () => null,
        fetchImpl,
      ),
    ).rejects.toThrow("Authentication required");

    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
