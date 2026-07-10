"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { AlertCircle, Bot, Send, User } from "lucide-react";
import { type UIMessage } from "ai";
import { createAgentChatTransport } from "@/lib/assistant/agentChatTransport";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import { useGeolocation } from "@/lib/geo/useGeolocation";
import { spaceGrotesk } from "@/app/ui/fonts";
import { MarkdownMessage } from "@/components/assistant/MarkdownMessage";
import { PlaceCards } from "@/components/assistant/PlaceCards";
import {
  getActiveToolFromParts,
  PLACE_CARDS_DATA_TYPE,
  type PlaceCardsData,
} from "@/lib/assistant/agentStreamAdapter";
import { useConversationEmptiness } from "@/components/assistant/conversationEmptinessContext";
import { extractMessageText } from "@/lib/assistant/mappers";
import { useAssistantThinking } from "@/lib/assistant/useStreamStall";
import {
  WELCOME_MESSAGE_ID,
  isConversationEmpty,
} from "@/lib/assistant/conversationState";
import { titleFromUserMessage } from "@/lib/assistant/titleUtils";

const WELCOME_MESSAGE: UIMessage = {
  id: WELCOME_MESSAGE_ID,
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hello! I'm your Zentra assistant. Ask me about routes, commute options, or getting around the city.",
    },
  ],
};

const SUGGESTED_QUESTIONS = [
  "Plan a relaxed day in Greenwich Village",
  "Where in Manhattan can I avoid crowds tonight?",
  "Budget-friendly lunch spots near Central Park",
  "Accessible museums on the Upper West Side",
] as const;

type AssistantChatProps = {
  conversationId: string;
  initialMessages: UIMessage[];
};

type AssistantMessageRowProps = {
  content: string;
  parts: UIMessage["parts"];
  isThinking: boolean;
  isStreaming: boolean;
};

function AssistantMessageRow({
  content,
  parts,
  isThinking,
  isStreaming,
}: AssistantMessageRowProps) {
  return (
    <div
      className="mr-auto flex max-w-[85%] gap-3"
      role={isThinking ? "status" : undefined}
      aria-live={isThinking ? "polite" : undefined}
      aria-label={isThinking ? "Assistant is thinking" : undefined}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 ${
          isThinking ? "animate-breath text-accent" : ""
        }`}
      >
        <Bot className="h-3.5 w-3.5" />
      </div>

      <div
        className={`rounded-xl border border-white/5 bg-surface px-4 py-3 text-sm leading-relaxed text-white/75 ${
          isThinking ? "animate-breath" : ""
        }`}
      >
        {isThinking && !content ? (
          <span className="text-white/55">Thinking...</span>
        ) : (
          <>
            {content ? <MarkdownMessage content={content} /> : null}
            {isStreaming && (
              <span className="ml-0.5 animate-pulse text-accent align-baseline">
                ▍
              </span>
            )}
            {parts
              .filter((part) => part.type === PLACE_CARDS_DATA_TYPE)
              .map((part, index) => (
                <PlaceCards
                  key={index}
                  {...((part as { data: PlaceCardsData }).data)}
                />
              ))}
          </>
        )}
      </div>
    </div>
  );
}

export function AssistantChat({
  conversationId,
  initialMessages,
}: AssistantChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const backendFetch = useAuthenticatedBackendFetch();
  const transport = useMemo(
    () => createAgentChatTransport(backendFetch),
    [backendFetch],
  );
  const { coords } = useGeolocation();

  const seedMessages =
    initialMessages.length > 0 ? initialMessages : [WELCOME_MESSAGE];

  const { setActiveConversationEmpty, requestSidebarRefresh, setOptimisticTitle } =
    useConversationEmptiness();

  const previousStatusRef = useRef<string | null>(null);

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    transport,
    messages: seedMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasUserMessages = messages.some((message) => message.role === "user");
  const showSuggestedQuestions = !hasUserMessages && !isLoading;

  const lastMessage = messages[messages.length - 1];
  const isActiveTurn = status === "submitted" || status === "streaming";
  const activeAssistantMessageId =
    isActiveTurn && lastMessage?.role === "assistant" ? lastMessage.id : null;
  const lastAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const activeTool = lastAssistantMessage
    ? getActiveToolFromParts(lastAssistantMessage.parts)
    : null;
  const showThinking = useAssistantThinking(
    status,
    messages,
    activeAssistantMessageId,
    activeTool,
  );
  const needsThinkingPlaceholder =
    showThinking && status === "submitted" && activeAssistantMessageId === null;

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;

    if (
      (previousStatus === "streaming" || previousStatus === "submitted") &&
      status === "ready"
    ) {
      requestSidebarRefresh();
    }
  }, [status, requestSidebarRefresh]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status, showThinking]);

  useEffect(() => {
    setActiveConversationEmpty(isConversationEmpty(messages));
  }, [messages, setActiveConversationEmpty]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const trimmed = text.trim();
    setInputValue("");

    if (!hasUserMessages) {
      setOptimisticTitle(conversationId, titleFromUserMessage(trimmed));
    }

    await sendMessage(
      { text: trimmed },
      coords ? { body: { lat: coords.lat, lng: coords.lng } } : undefined,
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden px-4 py-6 sm:px-6">
      <div className="mb-6 shrink-0">
        <h1
          className={`${spaceGrotesk.className} text-2xl font-light tracking-tight text-white sm:text-3xl`}
        >
          Chat with Zentra
        </h1>
        <p className="mt-3 text-base text-white/55">
          Ask questions about routes and getting around the city.
        </p>
      </div>

      <div className="flex min-h-0 min-w-0 max-w-full flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.map((message) => {
            const isUser = message.role === "user";
            const content = extractMessageText(message);

            if (!isUser) {
              const isThinkingBubble =
                showThinking && message.id === activeAssistantMessageId;
              const isStreamingAssistant =
                status === "streaming" &&
                message.id === lastMessage?.id &&
                !showThinking;

              return (
                <AssistantMessageRow
                  key={message.id}
                  content={content}
                  parts={message.parts}
                  isThinking={isThinkingBubble}
                  isStreaming={isStreamingAssistant}
                />
              );
            }

            return (
              <div
                key={message.id}
                className="ml-auto flex max-w-[85%] flex-row-reverse gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
                  <User className="h-3.5 w-3.5" />
                </div>

                <div className="rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm leading-relaxed text-white">
                  <p className="whitespace-pre-wrap">{content}</p>
                </div>
              </div>
            );
          })}

          {needsThinkingPlaceholder && (
            <AssistantMessageRow
              key="thinking-placeholder"
              content=""
              parts={[]}
              isThinking
              isStreaming={false}
            />
          )}

          {showSuggestedQuestions && (
            <div className="mr-auto flex w-full max-w-[85%] flex-col gap-2 pl-11">
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void handleSendMessage(question)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="mx-auto flex max-w-[90%] items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error.message}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="shrink-0 border-t border-white/10 p-4">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void handleSendMessage(inputValue);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="Ask about routes, transit, or walking options..."
              className="flex-1 rounded-lg border border-white/10 bg-surface px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-accent/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className={`${spaceGrotesk.className} rounded-lg bg-accent px-4 py-3 text-surface transition-opacity hover:opacity-90 disabled:opacity-40`}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
