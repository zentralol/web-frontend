import { useEffect, useMemo, useRef, useState } from "react";
import type { UIMessage } from "ai";
import { extractMessageText } from "@/lib/assistant/mappers";

export const STREAM_STALL_MS = 800;
const TICK_MS = 200;

/** Text content for the in-flight assistant message only (ignores tool/card parts). */
export function getInFlightAssistantText(
  messages: UIMessage[],
  activeAssistantMessageId: string | null,
): string | null {
  if (!activeAssistantMessageId) {
    return null;
  }
  const message = messages.find((item) => item.id === activeAssistantMessageId);
  if (!message) {
    return null;
  }
  return extractMessageText(message);
}

/** True when new assistant text tokens arrived (length grew). */
export function shouldEndThinkingOnTextChange(
  prevText: string,
  nextText: string,
): boolean {
  return nextText.length > prevText.length;
}

/**
 * Whether the assistant should show the thinking effect for the current turn.
 * Sticky until real text tokens arrive; non-text stream events do not cancel it.
 */
export function useAssistantThinking(
  status: string,
  messages: UIMessage[],
  activeAssistantMessageId: string | null,
  activeTool: string | null,
): boolean {
  const [stickyThinking, setStickyThinking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const prevTextLenRef = useRef(0);
  const lastTextAtRef = useRef<number | null>(null);

  const inFlightText = useMemo(
    () => getInFlightAssistantText(messages, activeAssistantMessageId) ?? "",
    [messages, activeAssistantMessageId],
  );

  const isActiveTurn = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!isActiveTurn) {
      setStickyThinking(false);
      lastTextAtRef.current = null;
      prevTextLenRef.current = 0;
      return;
    }

    if (activeTool !== null) {
      setStickyThinking(true);
    }

    const textLen = inFlightText.length;
    if (textLen > prevTextLenRef.current) {
      setStickyThinking(false);
      lastTextAtRef.current = Date.now();
      prevTextLenRef.current = textLen;
      return;
    }

    if (status === "streaming" && lastTextAtRef.current === null) {
      lastTextAtRef.current = Date.now();
      prevTextLenRef.current = textLen;
    }
  }, [isActiveTurn, inFlightText, activeTool, status]);

  useEffect(() => {
    if (!isActiveTurn) {
      return;
    }
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, [isActiveTurn]);

  useEffect(() => {
    if (status !== "streaming" || activeTool !== null) {
      return;
    }
    const lastTextAt = lastTextAtRef.current;
    if (lastTextAt === null) {
      return;
    }
    if (now - lastTextAt >= STREAM_STALL_MS) {
      setStickyThinking(true);
    }
  }, [status, activeTool, now]);

  return status === "submitted" || activeTool !== null || stickyThinking;
}
