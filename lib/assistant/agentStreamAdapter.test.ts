import { describe, expect, it } from "vitest";
import type { UIMessageChunk } from "ai";
import {
  buildPlaceCards,
  createAgentUiMessageStream,
  parseZentraSse,
  PLACE_CARDS_DATA_TYPE,
  selectRecommendedPlaceCards,
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

  it("ignores warnings and tool lifecycle events", () => {
    counter = 0;
    const sse =
      frame({ type: "warning", message: "heads up" }) +
      frame({ type: "tool_started", tool_name: "get_user_preferences" }) +
      frame({ type: "message_delta", text: "hi" }) +
      frame({ type: "tool_finished", tool_name: "get_user_preferences" }) +
      frame({ type: "done" });

    const chunks = translateZentraSse(sse, stableId);

    expect(chunks).toEqual([
      { type: "text-start", id: "id-1" },
      { type: "text-delta", id: "id-1", delta: "hi" },
      { type: "text-end", id: "id-1" },
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

describe("buildPlaceCards", () => {
  const poiEvent = {
    type: "tool_finished",
    tool_name: "get_nearby_places",
    result: {
      status: "success",
      data: {
        places: [
          {
            name: "Blue Bottle Coffee",
            address: "1 Main St",
            primary_type: "Coffee shop",
            lat: 40.7585,
            lng: -73.986,
            rating: 4.5,
            distance_km: 0.3,
          },
          { name: "No Coords Cafe", address: "2 Main St" }, // dropped
        ],
      },
    },
  };

  it("maps a nearby-places result to card items with coordinates", () => {
    const cards = buildPlaceCards(poiEvent);
    expect(cards).toEqual({
      source: "nearby",
      items: [
        {
          name: "Blue Bottle Coffee",
          lat: 40.7585,
          lng: -73.986,
          subtitle: "1 Main St",
          detail: "Coffee shop · ★ 4.5 · 0.3 km",
        },
      ],
    });
  });

  it("maps an attractions result", () => {
    const cards = buildPlaceCards({
      type: "tool_finished",
      tool_name: "get_nearest_attractions",
      result: {
        status: "success",
        data: {
          attractions: [
            {
              name: "The High Line",
              neighborhood: "Chelsea",
              category: "Park",
              lat: 40.748,
              lng: -74.0048,
              distance_km: 1.2,
            },
          ],
        },
      },
    });
    expect(cards?.source).toBe("attractions");
    expect(cards?.items[0]).toMatchObject({
      name: "The High Line",
      lat: 40.748,
      lng: -74.0048,
      subtitle: "Chelsea",
    });
  });

  it("returns null for other tools or non-success results", () => {
    expect(buildPlaceCards({ type: "tool_finished", tool_name: "predict_crowd_level" })).toBeNull();
    expect(
      buildPlaceCards({
        type: "tool_finished",
        tool_name: "get_nearby_places",
        result: { status: "warning" },
      }),
    ).toBeNull();
  });

  it("does not emit candidate cards when the model does not recommend them", () => {
    const chunks = translateZentraSse(
      `data: ${JSON.stringify(poiEvent)}\n\n` + frame({ type: "done" }),
    );
    const dataChunk = chunks.find((c) => c.type === PLACE_CARDS_DATA_TYPE) as
      | { type: string; data: { items: unknown[] } }
      | undefined;
    expect(dataChunk).toBeUndefined();
  });

  it("emits only model-recommended cards in natural-language order", () => {
    const chunks = translateZentraSse(
      `data: ${JSON.stringify(poiEvent)}\n\n` +
        frame({
          type: "tool_finished",
          tool_name: "get_nearest_attractions",
          result: {
            status: "success",
            data: {
              attractions: [
                {
                  name: "The High Line",
                  neighborhood: "Chelsea",
                  category: "Park",
                  lat: 40.748,
                  lng: -74.0048,
                  distance_km: 1.2,
                },
                {
                  name: "Washington Square Park",
                  neighborhood: "Greenwich Village",
                  category: "Park",
                  lat: 40.7308,
                  lng: -73.9973,
                },
              ],
            },
          },
        }) +
        frame({
          type: "message_delta",
          text: "I recommend The High Line first, followed by Blue Bottle Coffee.",
        }) +
        frame({ type: "done" }),
    );
    const dataChunk = chunks.find((c) => c.type === PLACE_CARDS_DATA_TYPE) as
      | { type: string; data: { items: Array<{ name: string }> } }
      | undefined;

    expect(dataChunk?.data.items.map((item) => item.name)).toEqual([
      "The High Line",
      "Blue Bottle Coffee",
    ]);
  });
});

describe("selectRecommendedPlaceCards", () => {
  const candidates = [
    {
      name: "Blue Bottle Coffee",
      lat: 40.7585,
      lng: -73.986,
      subtitle: "1 Main St",
      detail: "Coffee shop",
    },
    {
      name: "The High Line",
      lat: 40.748,
      lng: -74.0048,
      subtitle: "Chelsea",
      detail: "Park",
    },
    {
      name: "Washington Square Park",
      lat: 40.7308,
      lng: -73.9973,
      subtitle: "Greenwich Village",
      detail: "Park",
    },
  ];

  it("returns only named candidates in the order they appear", () => {
    const selected = selectRecommendedPlaceCards(
      "Start with Washington Square Park, then try Blue Bottle Coffee.",
      candidates,
    );

    expect(selected.map((item) => item.name)).toEqual([
      "Washington Square Park",
      "Blue Bottle Coffee",
    ]);
  });

  it("matches punctuation and accents without matching a shorter nested name", () => {
    const selected = selectRecommendedPlaceCards(
      "Café Mía is my first pick, followed by Central Park.",
      [
        {
          name: "Cafe Mia",
          lat: 40.7,
          lng: -73.9,
          subtitle: "",
          detail: "",
        },
        {
          name: "Park",
          lat: 40.71,
          lng: -73.91,
          subtitle: "",
          detail: "",
        },
        {
          name: "Central Park",
          lat: 40.72,
          lng: -73.92,
          subtitle: "",
          detail: "",
        },
      ],
    );

    expect(selected.map((item) => item.name)).toEqual([
      "Cafe Mia",
      "Central Park",
    ]);
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
