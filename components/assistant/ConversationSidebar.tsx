"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import { getHighlightedConversationId } from "@/lib/assistant/conversationState";
import type { ConversationSummary } from "@/lib/assistant/types";

type ConversationSidebarProps = {
  conversations: ConversationSummary[];
  activeConversationId: string;
  pendingConversationId: string | null;
  isPending: boolean;
  isDeleteDisabled: boolean;
  isActiveConversationEmpty: boolean;
  canDeleteConversation: (conversationId: string) => boolean;
  onNewChat: () => void;
  onSelectConversation: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  className?: string;
  onAfterNavigate?: () => void;
  variant?: "inline" | "drawer";
};

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) {
    return "Just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  pendingConversationId,
  isPending,
  isDeleteDisabled,
  isActiveConversationEmpty,
  canDeleteConversation,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  className,
  onAfterNavigate,
  variant = "inline",
}: ConversationSidebarProps) {
  const highlightedConversationId = getHighlightedConversationId(
    pendingConversationId,
    activeConversationId,
  );
  const isNewChatDisabled = isPending || isActiveConversationEmpty;

  const handleNewChat = () => {
    if (isNewChatDisabled) {
      return;
    }

    onNewChat();
    onAfterNavigate?.();
  };

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId !== activeConversationId) {
      onSelectConversation(conversationId);
    }

    onAfterNavigate?.();
  };

  const variantClassName =
    variant === "drawer"
      ? "flex h-full w-full flex-col"
      : "hidden w-full shrink-0 flex-col lg:flex lg:h-full lg:w-[300px] lg:border-r xl:w-[320px]";

  return (
    <aside
      className={`${variantClassName} border-white/10 bg-surface ${className ?? ""}`}
    >
      <div className="border-b border-white/10 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Assistant
        </p>
        <h2
          className={`${spaceGrotesk.className} mt-2 text-lg font-light tracking-tight text-white`}
        >
          Conversations
        </h2>
        <button
          type="button"
          onClick={handleNewChat}
          disabled={isNewChatDisabled}
          title={
            isActiveConversationEmpty
              ? "Already in a new chat"
              : "Start a new chat"
          }
          aria-label={
            isActiveConversationEmpty
              ? "Already in a new chat"
              : "Start a new chat"
          }
          className={`${spaceGrotesk.className} mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm text-surface transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <MessageSquarePlus className="h-4 w-4" />
          {isActiveConversationEmpty ? "Already in a new chat" : "New chat"}
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className="px-3 py-4 text-sm text-white/45">No conversations yet.</p>
        ) : (
          conversations.map((conversation) => {
            const isActive = conversation.id === highlightedConversationId;

            return (
              <div
                key={conversation.id}
                className={`group flex items-center gap-1 rounded-lg border transition-colors ${
                  isActive
                    ? "border-accent/30 bg-accent/10"
                    : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectConversation(conversation.id)}
                  disabled={isPending}
                  className="min-w-0 flex-1 px-3 py-3 text-left disabled:opacity-50"
                >
                  <p className="truncate text-sm text-white/90">
                    {conversation.title ?? "New chat"}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {formatRelativeTime(conversation.updatedAt)}
                  </p>
                </button>
                {canDeleteConversation(conversation.id) && (
                  <button
                    type="button"
                    onClick={() => onDeleteConversation(conversation.id)}
                    disabled={isDeleteDisabled}
                    aria-label={`Delete ${conversation.title ?? "conversation"}`}
                    className={`mr-2 rounded-md p-2 opacity-100 transition-colors lg:opacity-0 lg:group-hover:opacity-100 ${
                      isDeleteDisabled
                        ? "cursor-not-allowed text-white/15"
                        : "text-white/35 hover:bg-red-500/10 hover:text-red-300"
                    }`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
