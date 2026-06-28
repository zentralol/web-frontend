import type { UIMessage } from "ai";

export const WELCOME_MESSAGE_ID = "welcome";

/**
 * A conversation is "empty" when it contains no real messages — only the
 * synthetic welcome message shown before the user has said anything.
 */
export function isConversationEmpty(messages: UIMessage[]): boolean {
  return messages.every((message) => message.id === WELCOME_MESSAGE_ID);
}

/**
 * While a navigation is in flight we optimistically highlight the pending
 * conversation. Once the active conversation matches the pending one the
 * navigation has committed, so there is nothing left pending.
 */
export function resolveVisiblePendingId(
  pendingConversationId: string | null,
  activeConversationId: string,
): string | null {
  if (pendingConversationId === activeConversationId) {
    return null;
  }
  return pendingConversationId;
}

/**
 * The conversation the sidebar should visually highlight: the pending one
 * during a transition, otherwise the active one.
 */
export function getHighlightedConversationId(
  pendingConversationId: string | null,
  activeConversationId: string,
): string {
  return pendingConversationId ?? activeConversationId;
}

type CanDeleteConversationArgs = {
  conversationsLength: number;
  conversationId: string;
  activeConversationId: string;
  isActiveConversationEmpty: boolean;
};

/**
 * Any conversation can be deleted when more than one exists. When only a single
 * conversation remains it can only be deleted if it is the active one and is not
 * empty — deleting the last empty conversation would leave nothing usable.
 */
export function canDeleteConversation({
  conversationsLength,
  conversationId,
  activeConversationId,
  isActiveConversationEmpty,
}: CanDeleteConversationArgs): boolean {
  if (conversationsLength > 1) {
    return true;
  }
  return conversationId === activeConversationId && !isActiveConversationEmpty;
}
