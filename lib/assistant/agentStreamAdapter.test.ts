import { describe, expect, it } from "vitest";
import type { UIMessageChunk } from "ai";
import {
  createAgentUiMessageStream,
  parseZentraSse,
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

describe("ZentraUiTranslator", () => {
  it("stops emitting after a terminal event", () => {
    const translator = new ZentraUiTranslator(stableId);
    translator.handle({ type: "done" });
    expect(translator.handle({ type: "message_delta", text: "late" })).toEqual([]);
    expect(translator.finish()).toEqual([]);
  });
});
