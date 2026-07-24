import { describe, expect, it } from "vitest";
import {
  DEMO_MODE_COOKIE,
  isDemoModeFromCookie,
} from "./mode";
import { routeDemoBackendRequest } from "./backendRouter";
import { createDemoChatSseStream } from "./sseStream";
import { DEMO_SUGGESTED_QUESTIONS } from "./fixtures/assistant";
import {
  demoHeatmapResponse,
  resolveDemoHeatmapHoursAhead,
} from "./fixtures/heatmap";
import { parseZentraSse } from "@/lib/assistant/agentStreamAdapter";
import { formatInNewYork } from "@/lib/time/manhattanTime";

describe("isDemoModeFromCookie", () => {
  it("detects the demo cookie among others", () => {
    expect(
      isDemoModeFromCookie(`session=abc; ${DEMO_MODE_COOKIE}=1; theme=dark`),
    ).toBe(true);
  });

  it("returns false when cookie is absent or off", () => {
    expect(isDemoModeFromCookie("session=abc")).toBe(false);
    expect(isDemoModeFromCookie(`${DEMO_MODE_COOKIE}=0`)).toBe(false);
    expect(isDemoModeFromCookie(null)).toBe(false);
  });
});

describe("demoHeatmapResponse", () => {
  const fixedNow = new Date("2026-07-24T16:00:00.000Z");

  function targetHoursAhead(hours: number): string {
    return formatInNewYork(
      new Date(fixedNow.getTime() + hours * 60 * 60 * 1000),
    );
  }

  it("returns a full grid for the now slot", () => {
    const payload = demoHeatmapResponse(targetHoursAhead(0), fixedNow);
    expect(payload.source).toBe("demo");
    expect(payload.hoursAhead).toBe(0);
    expect(payload.points.length).toBeGreaterThan(400);
    expect(payload.points[0]).toMatchObject({
      h3Cell: expect.any(String),
      crowdScore: expect.any(Number),
    });
  });

  it("maps future options onto different hoursAhead slots", () => {
    expect(resolveDemoHeatmapHoursAhead(targetHoursAhead(0), fixedNow)).toBe(0);
    expect(resolveDemoHeatmapHoursAhead(targetHoursAhead(3), fixedNow)).toBe(3);

    const nowPoints = demoHeatmapResponse(targetHoursAhead(0), fixedNow).points;
    const laterPoints = demoHeatmapResponse(
      targetHoursAhead(3),
      fixedNow,
    ).points;
    expect(nowPoints.length).toBeGreaterThan(400);
    expect(laterPoints.length).toBeGreaterThan(400);

    const nowTop = nowPoints[0]?.h3Cell;
    const laterTop = laterPoints[0]?.h3Cell;
    const nowScoreSum = nowPoints.reduce(
      (sum, point) => sum + point.crowdScore,
      0,
    );
    const laterScoreSum = laterPoints.reduce(
      (sum, point) => sum + point.crowdScore,
      0,
    );
    expect(nowTop !== laterTop || nowScoreSum !== laterScoreSum).toBe(true);
  });
});

describe("routeDemoBackendRequest", () => {
  it("returns prediction fixtures", async () => {
    const response = await routeDemoBackendRequest(
      "http://localhost:3000/api/v1/predictions",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 40.75,
          lng: -73.99,
          targetTime: "2026-07-24T15:00:00",
        }),
      },
    );

    expect(response).not.toBeNull();
    const payload = await response!.json();
    expect(payload.success).toBe(true);
    expect(payload.data.prediction.busynessScore).toBeTypeOf("number");
  });

  it("returns forecast fixtures from query params", async () => {
    const response = await routeDemoBackendRequest(
      "http://localhost:3000/api/v1/predictions/forecast?lat=40.75&lng=-73.99&startTime=2026-07-24T12:00:00&endTime=2026-07-24T18:00:00&limit=6",
    );

    expect(response).not.toBeNull();
    const payload = await response!.json();
    expect(payload.data.forecast).toHaveLength(6);
  });

  it("returns quieter-area recommendations", async () => {
    const response = await routeDemoBackendRequest(
      "http://localhost:3000/api/v1/recommendations",
      {
        method: "POST",
        body: JSON.stringify({
          lat: 40.75,
          lng: -73.99,
          targetTime: "2026-07-24T18:00:00",
        }),
      },
    );

    expect(response).not.toBeNull();
    const payload = await response!.json();
    expect(payload.data.recommendations.length).toBeGreaterThan(0);
  });

  it("returns a chat SSE stream for assistant", async () => {
    const response = await routeDemoBackendRequest(
      "http://localhost:3000/api/v1/chat/stream",
      {
        method: "POST",
        body: JSON.stringify({
          message: DEMO_SUGGESTED_QUESTIONS[0],
          conversationId: "demo-conversation-0001",
        }),
      },
    );

    expect(response).not.toBeNull();
    expect(response!.headers.get("Content-Type")).toContain(
      "text/event-stream",
    );
    const text = await response!.text();
    expect(text).toContain("message_delta");
    expect(text).toContain('"type":"done"');
  });

  it("returns null for unknown paths", async () => {
    const response = await routeDemoBackendRequest(
      "http://localhost:3000/api/v1/unknown",
    );
    expect(response).toBeNull();
  });
});

describe("createDemoChatSseStream", () => {
  async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    return text;
  }

  it.each([...DEMO_SUGGESTED_QUESTIONS])(
    "streams parseable frames for preset: %s",
    async (question) => {
      const text = await readAll(
        createDemoChatSseStream({
          message: question,
          startDelayMs: 0,
          chunkDelayMs: 0,
        }),
      );
      const { events, rest } = parseZentraSse(text);
      expect(rest).toBe("");
      expect(events.some((event) => event.type === "message_delta")).toBe(true);
      expect(events.some((event) => event.type === "recommendations")).toBe(
        true,
      );
      expect(events.at(-1)?.type).toBe("done");
    },
  );

  it("streams a generic fallback for free-form input", async () => {
    const text = await readAll(
      createDemoChatSseStream({
        message: "Tell me something random",
        startDelayMs: 0,
        chunkDelayMs: 0,
      }),
    );
    const { events } = parseZentraSse(text);
    expect(events.some((event) => event.type === "message_delta")).toBe(true);
    expect(events.some((event) => event.type === "recommendations")).toBe(
      false,
    );
    expect(events.at(-1)?.type).toBe("done");
  });
});
