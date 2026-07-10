import { createUIMessageStream } from "ai";
import type { UIMessageChunk } from "ai";

// The agent (via the Express gateway) streams Zentra SSE events. useChat speaks
// the AI SDK UI-message-stream protocol. This module translates the former into
// the latter: assistant text deltas become text-start/text-delta/text-end, a
// fatal Zentra error becomes an error chunk, and place/attraction tool results
// become a "data-places" data part the UI renders as cards. Other tool
// lifecycle events and warnings are ignored.

export type ZentraEvent = {
  type: string;
  text?: string;
  message?: string;
  code?: string;
  tool_name?: string;
  result?: {
    status?: string;
    data?: Record<string, unknown>;
  };
};

export const PLACE_CARDS_DATA_TYPE = "data-places";

export type PlaceCardItem = {
  name: string;
  lat: number;
  lng: number;
  subtitle: string;
  detail: string;
};

export type PlaceCardsData = {
  source: "nearby" | "attractions";
  items: PlaceCardItem[];
};

const DATA_PREFIX = "data: ";

const DEFAULT_ERROR_MESSAGE = "The assistant failed to respond.";

/**
 * Parse whole SSE frames out of a buffer. Returns the parsed events plus the
 * trailing partial frame that has not been fully received yet.
 */
export function parseZentraSse(buffer: string): {
  events: ZentraEvent[];
  rest: string;
} {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events: ZentraEvent[] = [];

  for (const block of blocks) {
    for (const line of block.split("\n")) {
      if (!line.startsWith(DATA_PREFIX)) {
        continue;
      }
      try {
        events.push(JSON.parse(line.slice(DATA_PREFIX.length)) as ZentraEvent);
      } catch {
        // Ignore a malformed frame rather than breaking the whole stream.
      }
    }
  }

  return { events, rest };
}

/**
 * Stateful translator from Zentra events to UI message chunks. Kept separate
 * from stream plumbing so the mapping can be unit-tested directly.
 */
export class ZentraUiTranslator {
  private textId: string | null = null;
  private ended = false;

  constructor(private readonly generateId: () => string = () => crypto.randomUUID()) {}

  handle(event: ZentraEvent): UIMessageChunk[] {
    if (this.ended) {
      return [];
    }

    switch (event.type) {
      case "message_delta":
        return this.handleDelta(event);
      case "error": {
        this.ended = true;
        return [
          ...this.closeText(),
          { type: "error", errorText: event.message ?? DEFAULT_ERROR_MESSAGE },
        ];
      }
      case "tool_finished":
        return this.handleToolFinished(event);
      case "done":
        this.ended = true;
        return this.closeText();
      default:
        return [];
    }
  }

  private handleToolFinished(event: ZentraEvent): UIMessageChunk[] {
    const cards = buildPlaceCards(event);
    if (!cards || cards.items.length === 0) {
      return [];
    }
    return [{ type: PLACE_CARDS_DATA_TYPE, id: this.generateId(), data: cards }];
  }

  /** Flush a text-end if the stream ended without an explicit done event. */
  finish(): UIMessageChunk[] {
    if (this.ended) {
      return [];
    }
    this.ended = true;
    return this.closeText();
  }

  private handleDelta(event: ZentraEvent): UIMessageChunk[] {
    if (typeof event.text !== "string" || event.text.length === 0) {
      return [];
    }

    const chunks: UIMessageChunk[] = [];
    if (this.textId === null) {
      this.textId = this.generateId();
      chunks.push({ type: "text-start", id: this.textId });
    }
    chunks.push({ type: "text-delta", id: this.textId, delta: event.text });
    return chunks;
  }

  private closeText(): UIMessageChunk[] {
    if (this.textId === null) {
      return [];
    }
    const chunk: UIMessageChunk = { type: "text-end", id: this.textId };
    this.textId = null;
    return [chunk];
  }
}

/** Translate a complete SSE payload string into ordered UI chunks (test helper). */
export function translateZentraSse(
  sseText: string,
  generateId?: () => string,
): UIMessageChunk[] {
  const translator = new ZentraUiTranslator(generateId);
  const normalized = sseText.endsWith("\n\n") ? sseText : `${sseText}\n\n`;
  const { events } = parseZentraSse(normalized);

  const chunks: UIMessageChunk[] = [];
  for (const event of events) {
    chunks.push(...translator.handle(event));
  }
  chunks.push(...translator.finish());
  return chunks;
}

/** Build a UI message stream that proxies a live agent SSE body. */
export function createAgentUiMessageStream(
  agentBody: ReadableStream<Uint8Array>,
): ReadableStream<UIMessageChunk> {
  return createUIMessageStream({
    onError: (error) =>
      error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
    execute: async ({ writer }) => {
      const reader = agentBody.getReader();
      const decoder = new TextDecoder();
      const translator = new ZentraUiTranslator();
      let buffer = "";

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          const { events, rest } = parseZentraSse(buffer);
          buffer = rest;
          for (const event of events) {
            for (const chunk of translator.handle(event)) {
              writer.write(chunk);
            }
          }
        }
        for (const chunk of translator.finish()) {
          writer.write(chunk);
        }
      } finally {
        reader.releaseLock();
      }
    },
  });
}

/**
 * Turn a successful get_nearby_places / get_nearest_attractions tool result into
 * card data, or null for any other tool. Items without coordinates are dropped
 * (they can't be navigated to).
 */
export function buildPlaceCards(event: ZentraEvent): PlaceCardsData | null {
  if (event.result?.status !== "success") {
    return null;
  }
  const data = event.result.data ?? {};

  if (event.tool_name === "get_nearby_places" && Array.isArray(data.places)) {
    return { source: "nearby", items: mapItems(data.places, toPoiItem) };
  }
  if (
    event.tool_name === "get_nearest_attractions" &&
    Array.isArray(data.attractions)
  ) {
    return {
      source: "attractions",
      items: mapItems(data.attractions, toAttractionItem),
    };
  }
  return null;
}

function mapItems(
  raw: unknown[],
  map: (item: Record<string, unknown>) => PlaceCardItem | null,
): PlaceCardItem[] {
  const items: PlaceCardItem[] = [];
  for (const entry of raw) {
    if (isRecord(entry)) {
      const item = map(entry);
      if (item) items.push(item);
    }
  }
  return items;
}

function toPoiItem(raw: Record<string, unknown>): PlaceCardItem | null {
  const base = baseItem(raw);
  if (!base) return null;
  const detail = joinDetail([
    asString(raw.primary_type),
    typeof raw.rating === "number" ? `★ ${raw.rating}` : "",
    formatDistance(raw.distance_km),
  ]);
  return { ...base, subtitle: asString(raw.address), detail };
}

function toAttractionItem(raw: Record<string, unknown>): PlaceCardItem | null {
  const base = baseItem(raw);
  if (!base) return null;
  const detail = joinDetail([
    asString(raw.category),
    formatDistance(raw.distance_km),
  ]);
  return { ...base, subtitle: asString(raw.neighborhood), detail };
}

function baseItem(
  raw: Record<string, unknown>,
): { name: string; lat: number; lng: number } | null {
  const name = asString(raw.name);
  const lat = asNumber(raw.lat);
  const lng = asNumber(raw.lng);
  if (!name || lat === null || lng === null) {
    return null;
  }
  return { name, lat, lng };
}

function formatDistance(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${value} km` : "";
}

function joinDetail(parts: string[]): string {
  return parts.filter((part) => part.length > 0).join(" · ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
