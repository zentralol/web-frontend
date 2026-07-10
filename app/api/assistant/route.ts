import { auth } from "@clerk/nextjs/server";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { NextResponse } from "next/server";
import { createAgentUiMessageStream } from "@/lib/assistant/agentStreamAdapter";
import { getConversation } from "@/lib/assistant/queries";
import { extractMessageText } from "@/lib/assistant/mappers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export const maxDuration = 60;

const BACKEND_BASE_URL = (
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

type ChatRequestBody = {
  id?: string;
  message?: UIMessage;
};

// The AI conversation now lives behind the Express gateway + agent service.
// This route authenticates the user with Clerk, verifies conversation
// ownership, then forwards the latest message to the gateway and streams the
// agent's response back to useChat. Persistence, history, and titles are owned
// by the agent service — this route no longer talks to a model directly.
export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const conversationId = body.id;
  if (!conversationId) {
    return NextResponse.json({ error: "Missing conversation id" }, { status: 400 });
  }

  if (!body.message) {
    return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 });
  }

  const messageText = extractMessageText(body.message).trim();
  if (!messageText) {
    return NextResponse.json({ error: "Invalid messages payload" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const conversation = await getConversation(supabase, userId, conversationId);
  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let agentResponse: Response;
  try {
    agentResponse = await fetch(`${BACKEND_BASE_URL}/api/v1/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: messageText,
        clientType: "web",
        conversationId,
      }),
    });
  } catch (error) {
    logger.error("Assistant gateway request failed", { conversationId, userId, error });
    return NextResponse.json(
      { error: "Failed to reach the assistant service" },
      { status: 502 },
    );
  }

  if (!agentResponse.ok || !agentResponse.body) {
    logger.error("Assistant gateway returned an error", {
      conversationId,
      userId,
      status: agentResponse.status,
    });
    return NextResponse.json(
      { error: `Assistant service error (${agentResponse.status})` },
      { status: 502 },
    );
  }

  return createUIMessageStreamResponse({
    stream: createAgentUiMessageStream(agentResponse.body),
  });
}
