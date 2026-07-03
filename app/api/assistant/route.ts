import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { getDeepSeekModel } from "@/lib/assistant/deepseek";
import {
  getConversation,
  getMessages,
  insertMessages,
  maybeGenerateConversationTitle,
} from "@/lib/assistant/queries";
import { buildAssistantSystemPrompt } from "@/lib/assistant/preferencesContext";
import { getOnboardingPreferences } from "@/lib/onboarding/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { ConversationRow } from "@/lib/assistant/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  convertToModelMessages,
  createIdGenerator,
  streamText,
  type UIMessage,
} from "ai";
import { after, NextResponse } from "next/server";

export const maxDuration = 60;

const MODEL_NAME = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";

type ChatRequestBody = {
  id?: string;
  message?: UIMessage;
  messages?: UIMessage[];
};

function resolveRequestMessages(body: ChatRequestBody): {
  conversationId: string | undefined;
  messages: UIMessage[] | null;
} {
  if (body.id && body.message) {
    return { conversationId: body.id, messages: null };
  }

  if (body.id && Array.isArray(body.messages) && body.messages.length > 0) {
    return { conversationId: body.id, messages: body.messages };
  }

  if (Array.isArray(body.messages) && body.messages.length > 0) {
    return { conversationId: body.id, messages: body.messages };
  }

  return { conversationId: body.id, messages: null };
}

type PersistTurnParams = {
  supabase: SupabaseClient;
  conversation: ConversationRow;
  conversationId: string;
  userId: string;
  messages: UIMessage[];
  usage:
    | {
        promptTokens?: number;
        completionTokens?: number;
      }
    | undefined;
};

async function persistAssistantTurn({
  supabase,
  conversation,
  conversationId,
  userId,
  messages,
  usage,
}: PersistTurnParams): Promise<void> {
  try {
    await insertMessages(supabase, conversationId, messages, {
      model: MODEL_NAME,
      usage,
    });
    revalidatePath("/assistant");
  } catch (error) {
    logger.error("Assistant message persistence failed", {
      conversationId,
      userId,
      error,
    });
    return;
  }

  try {
    await maybeGenerateConversationTitle(supabase, conversation, messages);
    revalidatePath("/assistant");
  } catch (error) {
    logger.error("Assistant title generation failed", {
      conversationId,
      userId,
      error,
    });
  }
}

export async function POST(request: Request) {
  if (!process.env.DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: "Missing DEEPSEEK_API_KEY" },
      { status: 500 },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { conversationId, messages: clientMessages } = resolveRequestMessages(body);

  if (!conversationId) {
    return NextResponse.json(
      { error: "Missing conversation id" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const conversation = await getConversation(
      supabase,
      userId,
      conversationId,
    );

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    const preferences = await getOnboardingPreferences(supabase, userId);
    const dbMessages = await getMessages(supabase, conversationId);

    let validatedMessages: UIMessage[];

    if (body.message) {
      validatedMessages = [...dbMessages, body.message];
    } else if (clientMessages) {
      validatedMessages = clientMessages;
    } else {
      return NextResponse.json(
        { error: "Invalid messages payload" },
        { status: 400 },
      );
    }

    if (validatedMessages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages payload" },
        { status: 400 },
      );
    }

    // Persist the incoming user message before streaming so a mid-stream
    // refresh or abort cannot lose it; insertMessages dedups by ui_message_id.
    if (body.message) {
      try {
        await insertMessages(supabase, conversationId, [body.message]);
      } catch (error) {
        logger.error("Assistant user message persistence failed", {
          conversationId,
          userId,
          error,
        });
      }
    }

    let usage:
      | {
          promptTokens?: number;
          completionTokens?: number;
        }
      | undefined;

    const result = streamText({
      model: getDeepSeekModel(),
      system: buildAssistantSystemPrompt(preferences),
      messages: await convertToModelMessages(validatedMessages),
      onFinish: ({ usage: streamUsage }) => {
        usage = {
          promptTokens: streamUsage.inputTokens,
          completionTokens: streamUsage.outputTokens,
        };
      },
    });

    result.consumeStream();

    // Keep the runtime alive until post-stream persistence settles. Without
    // this, serverless instances freeze once the response closes and the
    // pending insert is suspended until a later request thaws the instance.
    const { promise: persistenceDone, resolve: resolvePersistence } =
      Promise.withResolvers<void>();
    after(() => persistenceDone);

    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onFinish: ({ messages, isAborted }) => {
        if (isAborted) {
          resolvePersistence();
          return;
        }

        void persistAssistantTurn({
          supabase,
          conversation,
          conversationId,
          userId,
          messages,
          usage,
        }).finally(resolvePersistence);
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to complete chat";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
