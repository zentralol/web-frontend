import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import type { FetchLike } from "@/lib/backend/authenticatedFetch";
import { createAgentUiMessageStream } from "./agentStreamAdapter";
import { extractMessageText } from "./mappers";

// Talks to the Express AI gateway directly from the browser, replacing the
// Next.js /api/assistant proxy. The caller supplies an authenticated fetch
// (Clerk bearer). The gateway streams Zentra SSE, which is translated on the
// client into the AI SDK UI-message-stream protocol so useChat is unchanged.

const BACKEND_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

const CHAT_STREAM_PATH = "/api/v1/chat/stream";

export function createAgentChatTransport(
  backendFetch: FetchLike,
): ChatTransport<UIMessage> {
  return {
    async sendMessages({ chatId, messages, abortSignal }) {
      const lastMessage = messages.at(-1);
      const message = lastMessage ? extractMessageText(lastMessage).trim() : "";
      if (!message) {
        throw new Error("Cannot send an empty message.");
      }

      const response = await backendFetch(`${BACKEND_BASE_URL}${CHAT_STREAM_PATH}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          clientType: "web",
          conversationId: chatId,
        }),
        signal: abortSignal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Assistant service error (${response.status}).`);
      }

      return createAgentUiMessageStream(response.body);
    },

    // Streaming is not resumable: a dropped connection ends the turn.
    async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
      return null;
    },
  };
}
