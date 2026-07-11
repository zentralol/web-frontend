"use client";

import { createContext, useContext } from "react";

type ConversationEmptinessContextValue = {
  isActiveConversationEmpty: boolean;
  setActiveConversationEmpty: (isEmpty: boolean) => void;
  requestSidebarRefresh: () => void;
  setOptimisticTitle: (conversationId: string, title: string) => void;
};

/**
 * Bridges chat state from the route child up to the persistent layout shell:
 * emptiness for "New chat" disabling, sidebar refresh after turns, and
 * optimistic titles before the server generates one.
 */
const ConversationEmptinessContext =
  createContext<ConversationEmptinessContextValue>({
    isActiveConversationEmpty: false,
    setActiveConversationEmpty: () => {},
    requestSidebarRefresh: () => {},
    setOptimisticTitle: () => {},
  });

export const ConversationEmptinessProvider =
  ConversationEmptinessContext.Provider;

export function useConversationEmptiness(): ConversationEmptinessContextValue {
  return useContext(ConversationEmptinessContext);
}
