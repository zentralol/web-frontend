"use client";

import { createContext, useContext } from "react";

type ConversationEmptinessContextValue = {
  isActiveConversationEmpty: boolean;
  setActiveConversationEmpty: (isEmpty: boolean) => void;
};

/**
 * Bridges the active conversation's "empty" state from the chat (rendered as a
 * route child) up to the persistent sidebar (rendered in the layout shell).
 * A safe default keeps the chat usable even if it is ever rendered without the
 * provider.
 */
const ConversationEmptinessContext =
  createContext<ConversationEmptinessContextValue>({
    isActiveConversationEmpty: false,
    setActiveConversationEmpty: () => {},
  });

export const ConversationEmptinessProvider =
  ConversationEmptinessContext.Provider;

export function useConversationEmptiness(): ConversationEmptinessContextValue {
  return useContext(ConversationEmptinessContext);
}
