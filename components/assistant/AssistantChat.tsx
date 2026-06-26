"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { AlertCircle, Bot, Send, User } from "lucide-react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { spaceGrotesk } from "@/app/ui/fonts";
import { MarkdownMessage } from "@/components/assistant/MarkdownMessage";
import { extractMessageText } from "@/lib/assistant/mappers";

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
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

export function AssistantChat({
  conversationId,
  initialMessages,
}: AssistantChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/assistant",
        prepareSendMessagesRequest({ id, messages }) {
          return {
            body: {
              id,
              message: messages[messages.length - 1],
            },
          };
        },
      }),
    [],
  );

  const seedMessages =
    initialMessages.length > 0 ? initialMessages : [WELCOME_MESSAGE];

  const { messages, sendMessage, status, error } = useChat({
    id: conversationId,
    transport,
    messages: seedMessages,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const hasUserMessages = messages.some((message) => message.role === "user");
  const showSuggestedQuestions = !hasUserMessages && !isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const trimmed = text.trim();
    setInputValue("");

    await sendMessage({ text: trimmed });
  };

  const lastMessage = messages[messages.length - 1];
  const showThinking = status === "submitted";

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
            const isStreamingAssistant =
              !isUser &&
              status === "streaming" &&
              message.id === lastMessage?.id;

            if (!isUser && !content && status === "submitted") {
              return null;
            }

            return (
              <div
                key={message.id}
                className={`flex max-w-[85%] gap-3 ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                    isUser
                      ? "border-accent/20 bg-accent/10 text-accent"
                      : "border-white/10 bg-white/5 text-white/70"
                  }`}
                >
                  {isUser ? (
                    <User className="h-3.5 w-3.5" />
                  ) : (
                    <Bot className="h-3.5 w-3.5" />
                  )}
                </div>

                <div
                  className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                    isUser
                      ? "border-accent/25 bg-accent/10 text-white"
                      : "border-white/5 bg-surface text-white/75"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{content}</p>
                  ) : (
                    <>
                      <MarkdownMessage content={content} />
                      {isStreamingAssistant && (
                        <span className="ml-0.5 animate-pulse text-accent align-baseline">
                          ▍
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}

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

          {showThinking && (
            <div className="mr-auto flex max-w-[85%] gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-accent">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-xl border border-white/5 bg-surface px-4 py-3 text-sm text-white/55">
                Thinking...
              </div>
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
