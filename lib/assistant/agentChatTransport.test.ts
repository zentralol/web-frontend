import { describe, expect, it, vi } from "vitest";
import type { UIMessage } from "ai";
import { createAgentChatTransport } from "./agentChatTransport";

function userMessage(text: string): UIMessage {
  return { id: "m1", role: "user", parts: [{ type: "text", text }] };
}

function sseResponse(): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode('data: {"type":"done"}\n\n'),
      );
      controller.close();
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

async function drain(stream: ReadableStream<unknown>): Promise<void> {
  const reader = stream.getReader();
  for (;;) {
    const { done } = await reader.read();
    if (done) break;
  }
}

describe("createAgentChatTransport", () => {
  it("posts message + conversation id and forwards coordinates from the body", async () => {
    const backendFetch = vi.fn(async () => sseResponse());
    const transport = createAgentChatTransport(backendFetch);

    const stream = await transport.sendMessages({
      trigger: "submit-message",
      chatId: "conv-1",
      messageId: undefined,
      messages: [userMessage("nearby?")],
      abortSignal: undefined,
      body: { lat: 40.758, lng: -73.9855 },
    });
    await drain(stream);

    expect(backendFetch).toHaveBeenCalledTimes(1);
    const [url, init] = backendFetch.mock.calls[0];
    expect(String(url)).toMatch(/\/api\/v1\/chat\/stream$/);
    expect(init?.method).toBe("POST");
    const sent = JSON.parse(init?.body as string);
    expect(sent).toEqual({
      message: "nearby?",
      clientType: "web",
      conversationId: "conv-1",
      lat: 40.758,
      lng: -73.9855,
    });
  });

  it("omits coordinates when none are provided", async () => {
    const backendFetch = vi.fn(async () => sseResponse());
    const transport = createAgentChatTransport(backendFetch);

    const stream = await transport.sendMessages({
      trigger: "submit-message",
      chatId: "conv-1",
      messageId: undefined,
      messages: [userMessage("hi")],
      abortSignal: undefined,
    });
    await drain(stream);

    const sent = JSON.parse(backendFetch.mock.calls[0][1]?.body as string);
    expect(sent).not.toHaveProperty("lat");
    expect(sent).not.toHaveProperty("lng");
  });

  it("throws when the gateway responds with an error", async () => {
    const backendFetch = vi.fn(
      async () => new Response(null, { status: 502 }),
    );
    const transport = createAgentChatTransport(backendFetch);

    await expect(
      transport.sendMessages({
        trigger: "submit-message",
        chatId: "conv-1",
        messageId: undefined,
        messages: [userMessage("hi")],
        abortSignal: undefined,
      }),
    ).rejects.toThrow(/502/);
  });
});
