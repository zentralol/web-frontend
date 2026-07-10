import { createUIMessageStream } from "ai";
import type { UIMessage, UIMessageChunk } from "ai";

// The agent (via the Express gateway) streams Zentra SSE events. useChat speaks
// the AI SDK UI-message-stream protocol. Tool results remain lifecycle events;
// only the agent's validated `recommendations` event becomes a card data part.

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
  data?: {
    source?: unknown;
    items?: unknown;
  };
};

export const PLACE_CARDS_DATA_TYPE = "data-places";
export const TOOL_STATUS_DATA_TYPE = "data-tool-status";

export type ToolStatusData = {
  toolName: string;
  status: "running" | "done";
};

export type PlaceCardItem = {
  candidateId: string;
  rank: number;
  reason: string;
  name: string;
  lat: number;
  lng: number;
  subtitle: string;
  detail: string;
};

export type PlaceCardsData = {
  source: "nearby" | "attractions" | "recommend" | "mixed";
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

/** Stateful translator from Zentra events to AI SDK UI message chunks. */
export class ZentraUiTranslator {
  private textId: string | null = null;
  private ended = false;
  private needsSegmentSeparator = false;

  constructor(private readonly generateId: () => string = () => crypto.randomUUID()) {}

  handle(event: ZentraEvent): UIMessageChunk[] {
    if (this.ended) {
      return [];
    }

    switch (event.type) {
      case "message_delta":
        return this.handleDelta(event);
      case "recommendations": {
        const cards = buildRecommendationCards(event);
        if (!cards || cards.items.length === 0) {
          return [];
        }
        return [
          {
            type: PLACE_CARDS_DATA_TYPE,
            id: this.generateId(),
            data: cards,
          },
        ];
      }
      case "error": {
        this.ended = true;
        return [
          ...this.closeText(),
          { type: "error", errorText: event.message ?? DEFAULT_ERROR_MESSAGE },
        ];
      }
      case "done":
        this.ended = true;
        return this.closeText();
      case "tool_started": {
        const toolName = event.tool_name;
        if (!toolName) {
          return [];
        }
        return [
          ...this.closeText(),
          {
            type: TOOL_STATUS_DATA_TYPE,
            id: this.generateId(),
            data: { toolName, status: "running" },
          },
        ];
      }
      case "tool_finished": {
        const toolName = event.tool_name;
        if (!toolName) {
          return [];
        }
        return [
          {
            type: TOOL_STATUS_DATA_TYPE,
            id: this.generateId(),
            data: { toolName, status: "done" },
          },
        ];
      }
      default:
        return [];
    }
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
    let delta = event.text;
    if (this.textId === null) {
      this.textId = this.generateId();
      chunks.push({ type: "text-start", id: this.textId });
      if (this.needsSegmentSeparator) {
        delta = `\n\n${delta}`;
        this.needsSegmentSeparator = false;
      }
    }
    chunks.push({ type: "text-delta", id: this.textId, delta });
    return chunks;
  }

  private closeText(): UIMessageChunk[] {
    if (this.textId === null) {
      return [];
    }
    const chunk: UIMessageChunk = { type: "text-end", id: this.textId };
    this.textId = null;
    this.needsSegmentSeparator = true;
    return [chunk];
  }
}

/** Derive the currently running tool from transient tool-status parts. */
export function getActiveToolFromParts(parts: UIMessage["parts"]): string | null {
  const stack: string[] = [];
  for (const part of parts) {
    if (part.type !== TOOL_STATUS_DATA_TYPE) {
      continue;
    }
    const data = (part as { data?: ToolStatusData }).data;
    if (!data?.toolName) {
      continue;
    }
    if (data.status === "running") {
      stack.push(data.toolName);
    } else if (data.status === "done") {
      const index = stack.lastIndexOf(data.toolName);
      if (index !== -1) {
        stack.splice(index, 1);
      }
    }
  }
  return stack.length > 0 ? stack[stack.length - 1]! : null;
}

/** Convert the agent's validated recommendation event into card data. */
export function buildRecommendationCards(
  event: ZentraEvent,
): PlaceCardsData | null {
  if (event.type !== "recommendations" || !event.data) {
    return null;
  }
  return parsePlaceCardsData(event.data);
}

/** Restore a persisted `data-places` part from a database message. */
export function parsePersistedPlaceCards(part: unknown): PlaceCardsData | null {
  if (!isRecord(part) || part.type !== PLACE_CARDS_DATA_TYPE) {
    return null;
  }
  return parsePlaceCardsData(part.data);
}

function parsePlaceCardsData(value: unknown): PlaceCardsData | null {
  if (!isRecord(value) || !isPlaceSource(value.source) || !Array.isArray(value.items)) {
    return null;
  }

  const items = value.items
    .filter(isRecord)
    .map(toPlaceCardItem)
    .filter((item): item is PlaceCardItem => item !== null);

  return items.length > 0 ? { source: value.source, items } : null;
}

function toPlaceCardItem(raw: Record<string, unknown>): PlaceCardItem | null {
  const candidateId = asString(raw.candidate_id ?? raw.candidateId);
  const name = asString(raw.name);
  const lat = asNumber(raw.lat);
  const lng = asNumber(raw.lng);
  const rank = asNumber(raw.rank);
  if (
    !candidateId ||
    !name ||
    lat === null ||
    lng === null ||
    rank === null ||
    !Number.isInteger(rank) ||
    rank < 1
  ) {
    return null;
  }

  return {
    candidateId,
    rank,
    reason: asString(raw.reason),
    name,
    lat,
    lng,
    subtitle: asString(raw.subtitle),
    detail: asString(raw.detail),
  };
}

function isPlaceSource(value: unknown): value is PlaceCardsData["source"] {
  return (
    value === "nearby" ||
    value === "attractions" ||
    value === "recommend" ||
    value === "mixed"
  );
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
