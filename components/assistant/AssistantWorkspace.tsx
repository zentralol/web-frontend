"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AssistantChat } from "@/components/assistant/AssistantChat";
import { AssistantChatSkeleton } from "@/components/assistant/AssistantChatSkeleton";
import { ConversationSidebar } from "@/components/assistant/ConversationSidebar";
import type { ConversationSummary } from "@/lib/assistant/types";
import type { UIMessage } from "ai";
import {
  createConversationAction,
  deleteConversationAction,
} from "@/lib/assistant/actions";

type AssistantWorkspaceProps = {
  conversations: ConversationSummary[];
  activeConversationId: string;
  initialMessages: UIMessage[];
};

export function AssistantWorkspace({
  conversations,
  activeConversationId,
  initialMessages,
}: AssistantWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);

  const visiblePendingConversationId =
    pendingConversationId === activeConversationId ? null : pendingConversationId;
  const isSwitchingConversation = visiblePendingConversationId !== null;
  const isActiveConversationEmpty = initialMessages.length === 0;

  const canDeleteConversation = (conversationId: string) => {
    if (conversations.length > 1) {
      return true;
    }
    return (
      conversationId === activeConversationId && !isActiveConversationEmpty
    );
  };

  const handleNewChat = () => {
    if (isActiveConversationEmpty) {
      return;
    }

    startTransition(async () => {
      const newId = await createConversationAction();
      setPendingConversationId(newId);
      router.push(`/assistant/${newId}`);
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId === activeConversationId) {
      return;
    }

    setPendingConversationId(conversationId);
    startTransition(() => {
      router.push(`/assistant/${conversationId}`);
    });
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (!canDeleteConversation(conversationId)) {
      return;
    }

    startTransition(async () => {
      const nextId = await deleteConversationAction(conversationId);

      if (conversationId === activeConversationId && nextId) {
        setPendingConversationId(nextId);
        router.push(`/assistant/${nextId}`);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] w-full max-w-6xl flex-col overflow-hidden lg:flex-row">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        pendingConversationId={visiblePendingConversationId}
        isPending={isPending}
        isActiveConversationEmpty={isActiveConversationEmpty}
        canDeleteConversation={canDeleteConversation}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {isSwitchingConversation ? (
          <AssistantChatSkeleton />
        ) : (
          <AssistantChat
            key={activeConversationId}
            conversationId={activeConversationId}
            initialMessages={initialMessages}
          />
        )}
      </section>
    </div>
  );
}
