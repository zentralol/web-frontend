import { describe, expect, it } from "vitest";
import type { UIMessageChunk } from "ai";
import {
  buildRecommendationCards,
  createAgentUiMessageStream,
  getActiveToolFromParts,
  parsePersistedPlaceCards,
  parseZentraSse,
  PLACE_CARDS_DATA_TYPE,
  TOOL_STATUS_DATA_TYPE,
  translateZentraSse,
  ZentraUiTranslator,
} from "./agentStreamAdapter";

const frame = (event: Record<string, unknown>) => `data: ${JSON.stringify(event)}\n\n`;

let counter = 0;
const stableId = () => `id-${(counter += 1)}`;

describe("parseZentraSse", () => {
  it("parses whole frames and keeps the trailing partial frame", () => {
    const buffer =
      frame({ type: "message_delta", text: "he" }) + 'data: {"type":"message';
    const { events, rest } = parseZentraSse(buffer);

    expect(events).toEqual([{ type: "message_delta", text: "he" }]);
    expect(rest).toBe('data: {"type":"message');
  });

  it("ignores malformed frames without throwing", () => {
    const { events } = parseZentraSse("data: {not json}\n\n");
    expect(events).toEqual([]);
  });
});

describe("translateZentraSse", () => {
  it("maps deltas to text-start, text-delta(s), then text-end", () => {
    counter = 0;
    const sse =
      frame({ type: "message_delta", text: "Hello " }) +
      frame({ type: "message_delta", text: "world" }) +
      frame({ type: "done", conversation_id: "c1" });

    const chunks = translateZentraSse(sse, stableId);

    expect(chunks).toEqual([
      { type: "text-start", id: "id-1" },
      { type: "text-delta", id: "id-1", delta: "Hello " },
      { type: "text-delta", id: "id-1", delta: "world" },
      { type: "text-end", id: "id-1" },
    ]);
  });

  it("emits tool lifecycle data chunks and still maps text deltas", () => {
    counter = 0;
    const sse =
      frame({ type: "warning", message: "heads up" }) +
      frame({ type: "tool_started", tool_name: "get_user_preferences" }) +
      frame({ type: "message_delta", text: "hi" }) +
      frame({ type: "tool_finished", tool_name: "get_user_preferences" }) +
      frame({ type: "done" });

    const chunks = translateZentraSse(sse, stableId);

    expect(chunks).toEqual([
      {
        type: TOOL_STATUS_DATA_TYPE,
        id: "id-1",
        data: { toolName: "get_user_preferences", status: "running" },
      },
      { type: "text-start", id: "id-2" },
      { type: "text-delta", id: "id-2", delta: "hi" },
      {
        type: TOOL_STATUS_DATA_TYPE,
        id: "id-3",
        data: { toolName: "get_user_preferences", status: "done" },
      },
      { type: "text-end", id: "id-2" },
    ]);
  });

  it("closes an open text block when a tool starts mid-stream", () => {
    counter = 0;
    const sse =
      frame({ type: "message_delta", text: "Let me check" }) +
      frame({ type: "tool_started", tool_name: "submit_recommendations" }) +
      frame({ type: "tool_finished", tool_name: "submit_recommendations" }) +
      frame({ type: "done" });

    const chunks = translateZentraSse(sse, stableId);

    expect(chunks).toEqual([
      { type: "text-start", id: "id-1" },
      { type: "text-delta", id: "id-1", delta: "Let me check" },
      { type: "text-end", id: "id-1" },
      {
        type: TOOL_STATUS_DATA_TYPE,
        id: "id-2",
        data: { toolName: "submit_recommendations", status: "running" },
      },
      {
        type: TOOL_STATUS_DATA_TYPE,
        id: "id-3",
        data: { toolName: "submit_recommendations", status: "done" },
      },
    ]);
  });

  it("inserts a paragraph break before text after a closed segment", () => {
    counter = 0;
    const sse =
      frame({
        type: "message_delta",
        text: "Let me check what's around you and how busy it is",
      }) +
      frame({ type: "tool_started", tool_name: "get_nearby_places" }) +
      frame({ type: "tool_finished", tool_name: "get_nearby_places" }) +
      frame({
        type: "message_delta",
        text: "Great news — it's very quiet in your area right now!",
      }) +
      frame({ type: "done" });

    const chunks = translateZentraSse(sse, stableId);

    expect(chunks).toEqual([
      { type: "text-start", id: "id-1" },
      {
        type: "text-delta",
        id: "id-1",
        delta: "Let me check what's around you and how busy it is",
      },
      { type: "text-end", id: "id-1" },
      {
        type: TOOL_STATUS_DATA_TYPE,
        id: "id-2",
        data: { toolName: "get_nearby_places", status: "running" },
      },
      {
        type: TOOL_STATUS_DATA_TYPE,
        id: "id-3",
        data: { toolName: "get_nearby_places", status: "done" },
      },
      { type: "text-start", id: "id-4" },
      {
        type: "text-delta",
        id: "id-4",
        delta: "\n\nGreat news — it's very quiet in your area right now!",
      },
      { type: "text-end", id: "id-4" },
    ]);
  });

  it("emits an error chunk for a Zentra error event", () => {
    counter = 0;
    const sse =
      frame({ type: "message_delta", text: "partial" }) +
      frame({ type: "error", code: "LLM_ERROR", message: "boom" });

    const chunks = translateZentraSse(sse, stableId);

    expect(chunks).toEqual([
      { type: "text-start", id: "id-1" },
      { type: "text-delta", id: "id-1", delta: "partial" },
      { type: "text-end", id: "id-1" },
      { type: "error", errorText: "boom" },
    ]);
  });

  it("closes an open text block when the stream ends without a done event", () => {
    counter = 0;
    const chunks = translateZentraSse(frame({ type: "message_delta", text: "hi" }), stableId);

    expect(chunks).toEqual([
      { type: "text-start", id: "id-1" },
      { type: "text-delta", id: "id-1", delta: "hi" },
      { type: "text-end", id: "id-1" },
    ]);
  });
});

describe("createAgentUiMessageStream", () => {
  function sseBody(payload: string): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    // Split mid-frame across two chunks to exercise buffering.
    const mid = Math.floor(payload.length / 2);
    const parts = [payload.slice(0, mid), payload.slice(mid)];
    return new ReadableStream({
      start(controller) {
        for (const part of parts) {
          controller.enqueue(encoder.encode(part));
        }
        controller.close();
      },
    });
  }

  async function collect(
    stream: ReadableStream<UIMessageChunk>,
  ): Promise<UIMessageChunk[]> {
    const chunks: UIMessageChunk[] = [];
    const reader = stream.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return chunks;
  }

  it("produces a valid text UI message stream from a chunked agent SSE body", async () => {
    const payload =
      frame({ type: "message_delta", text: "Hello " }) +
      frame({ type: "message_delta", text: "there" }) +
      frame({ type: "done", conversation_id: "c1" });

    const chunks = await collect(createAgentUiMessageStream(sseBody(payload)));
    const types = chunks.map((chunk) => chunk.type);

    // A text part is delimited by text-start ... text-end; useChat builds the
    // assistant message from these (start/finish are optional enrichment).
    expect(types[0]).toBe("text-start");
    expect(types.at(-1)).toBe("text-end");
    expect(types.filter((type) => type === "text-delta")).toHaveLength(2);

    const text = chunks
      .filter((chunk) => chunk.type === "text-delta")
      .map((chunk) => (chunk as { delta: string }).delta)
      .join("");
    expect(text).toBe("Hello there");
  });
});

describe("recommendation cards", () => {
  const event = {
    type: "recommendations",
    data: {
      source: "nearby",
      items: [
        {
          candidate_id: "google:place-a",
          rank: 1,
          reason: "Quiet and nearby",
          name: "Blue Bottle Coffee",
          lat: 40.7585,
          lng: -73.986,
          subtitle: "1 Main St",
          detail: "Coffee shop · ★ 4.5",
        },
        {
          candidate_id: "google:place-c",
          rank: 2,
          reason: "Good value",
          name: "Cafe Two",
          lat: 40.75,
          lng: -73.98,
          subtitle: "2 Main St",
          detail: "Cafe",
        },
      ],
    },
  };

  it("maps only the structured recommendation event", () => {
    expect(buildRecommendationCards(event)).toEqual({
      source: "nearby",
      items: [
        {
          candidateId: "google:place-a",
          rank: 1,
          reason: "Quiet and nearby",
          name: "Blue Bottle Coffee",
          lat: 40.7585,
          lng: -73.986,
          subtitle: "1 Main St",
          detail: "Coffee shop · ★ 4.5",
        },
        expect.objectContaining({ candidateId: "google:place-c", rank: 2 }),
      ],
    });
  });

  it("restores the same shape from a persisted data part", () => {
    expect(
      parsePersistedPlaceCards({ type: PLACE_CARDS_DATA_TYPE, data: event.data }),
    ).toEqual(buildRecommendationCards(event));
  });

  it("rejects lifecycle events and malformed recommendation items", () => {
    expect(buildRecommendationCards({ type: "tool_finished" })).toBeNull();
    expect(
      buildRecommendationCards({
        type: "recommendations",
        data: { source: "nearby", items: [{ name: "Missing coordinates" }] },
      }),
    ).toBeNull();
  });

  it("accepts backend recommendation source", () => {
    expect(
      buildRecommendationCards({
        type: "recommendations",
        data: {
          source: "recommend",
          items: [
            {
              candidate_id: "recommend:fort-tryon",
              rank: 1,
              reason: "",
              name: "Fort Tryon Park",
              lat: 40.8617,
              lng: -73.9326,
              subtitle: "Washington Heights",
              detail: "park · Very quiet",
            },
          ],
        },
      }),
    ).toEqual({
      source: "recommend",
      items: [
        {
          candidateId: "recommend:fort-tryon",
          rank: 1,
          reason: "",
          name: "Fort Tryon Park",
          lat: 40.8617,
          lng: -73.9326,
          subtitle: "Washington Heights",
          detail: "park · Very quiet",
        },
      ],
    });
  });

  it("accepts itinerary source", () => {
    expect(
      buildRecommendationCards({
        type: "recommendations",
        data: {
          source: "itinerary",
          items: [
            {
              candidate_id: "itinerary:essex-market",
              rank: 1,
              reason: "Vegetarian-friendly dinner",
              name: "Essex Market",
              lat: 40.7185,
              lng: -73.9877,
              subtitle: "20:10 · Lower East Side",
              detail: "food · Moderate · 08:00-21:00",
            },
          ],
        },
      }),
    ).toEqual({
      source: "itinerary",
      items: [
        {
          candidateId: "itinerary:essex-market",
          rank: 1,
          reason: "Vegetarian-friendly dinner",
          name: "Essex Market",
          lat: 40.7185,
          lng: -73.9877,
          subtitle: "20:10 · Lower East Side",
          detail: "food · Moderate · 08:00-21:00",
        },
      ],
    });
  });


  it("emits cards in the structured array order", () => {
    const chunks = translateZentraSse(
      frame({ type: "message_delta", text: "Here are my picks." }) +
        frame(event) +
        frame({ type: "done" }),
    );
    const dataChunk = chunks.find((chunk) => chunk.type === PLACE_CARDS_DATA_TYPE) as
      | { type: string; data: { items: Array<{ candidateId: string }> } }
      | undefined;

    expect(dataChunk?.data.items.map((item) => item.candidateId)).toEqual([
      "google:place-a",
      "google:place-c",
    ]);
  });
});

describe("getActiveToolFromParts", () => {
  it("returns the active tool from the latest running status", () => {
    const parts = [
      {
        type: TOOL_STATUS_DATA_TYPE,
        data: { toolName: "get_user_preferences", status: "running" },
      },
    ] as Parameters<typeof getActiveToolFromParts>[0];

    expect(getActiveToolFromParts(parts)).toBe("get_user_preferences");
  });

  it("clears the active tool after a matching finished event", () => {
    const parts = [
      {
        type: TOOL_STATUS_DATA_TYPE,
        data: { toolName: "get_user_preferences", status: "running" },
      },
      {
        type: TOOL_STATUS_DATA_TYPE,
        data: { toolName: "get_user_preferences", status: "done" },
      },
    ] as Parameters<typeof getActiveToolFromParts>[0];

    expect(getActiveToolFromParts(parts)).toBeNull();
  });

  it("tracks nested tool calls in order", () => {
    const parts = [
      {
        type: TOOL_STATUS_DATA_TYPE,
        data: { toolName: "tool_a", status: "running" },
      },
      {
        type: TOOL_STATUS_DATA_TYPE,
        data: { toolName: "tool_b", status: "running" },
      },
      {
        type: TOOL_STATUS_DATA_TYPE,
        data: { toolName: "tool_b", status: "done" },
      },
    ] as Parameters<typeof getActiveToolFromParts>[0];

    expect(getActiveToolFromParts(parts)).toBe("tool_a");
  });
});

describe("ZentraUiTranslator", () => {
  it("stops emitting after a terminal event", () => {
    const translator = new ZentraUiTranslator(stableId);
    translator.handle({ type: "done" });
    expect(translator.handle({ type: "message_delta", text: "late" })).toEqual([]);
    expect(translator.finish()).toEqual([]);
  });
});
