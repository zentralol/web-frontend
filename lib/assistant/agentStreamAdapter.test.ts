import { describe, expect, it } from "vitest";
import {
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

describe("ZentraUiTranslator", () => {
  it("stops emitting after a terminal event", () => {
    const translator = new ZentraUiTranslator(stableId);
    translator.handle({ type: "done" });
    expect(translator.handle({ type: "message_delta", text: "late" })).toEqual([]);
    expect(translator.finish()).toEqual([]);
  });
});
