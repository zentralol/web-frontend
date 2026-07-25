import type { ZentraEvent } from "@/lib/assistant/agentStreamAdapter";
import { getDemoAssistantScript } from "./fixtures/assistant";

function encodeSse(event: ZentraEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function chunkText(text: string, size = 24): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [""];
}

export type CreateDemoChatStreamOptions = {
  message: string;
  conversationId?: string;
  /** Delay before the first SSE frame in ms. Use 0 in tests. */
  startDelayMs?: number;
  /** Delay between SSE frames in ms. Use 0 in tests. */
  chunkDelayMs?: number;
};

/**
 * Builds a ReadableStream of Zentra SSE frames that mirrors the live agent
 * protocol (tool lifecycle → message_delta → optional recommendations → done).
 */
export function createDemoChatSseStream(
  options: CreateDemoChatStreamOptions,
): ReadableStream<Uint8Array> {
  const { message, conversationId = "demo-conversation-0001" } = options;
  const startDelayMs = options.startDelayMs ?? 2000;
  const chunkDelayMs = options.chunkDelayMs ?? 18;
  const script = getDemoAssistantScript(message);
  const encoder = new TextEncoder();

  const frames: string[] = [];

  for (const toolName of script.tools ?? []) {
    frames.push(encodeSse({ type: "tool_started", tool_name: toolName }));
    frames.push(encodeSse({ type: "tool_finished", tool_name: toolName }));
  }

  for (const chunk of chunkText(script.text)) {
    frames.push(encodeSse({ type: "message_delta", text: chunk }));
  }

  if (script.recommendations) {
    frames.push(encodeSse(script.recommendations));
  }

  frames.push(
    encodeSse({
      type: "done",
      conversation_id: conversationId,
    } as ZentraEvent),
  );

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      if (startDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, startDelayMs));
      }

      for (const frame of frames) {
        controller.enqueue(encoder.encode(frame));
        if (chunkDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, chunkDelayMs));
        }
      }
      controller.close();
    },
  });
}

export function createDemoChatStreamResponse(
  options: CreateDemoChatStreamOptions,
): Response {
  return new Response(createDemoChatSseStream(options), {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
