"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { AssistantChat } from "@/components/assistant/AssistantChat";
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
      router.push(`/assistant/${newId}`);
    });
  };

  const handleSelectConversation = (conversationId: string) => {
    if (conversationId === activeConversationId) {
      return;
    }
    router.push(`/assistant/${conversationId}`);
  };

  const handleDeleteConversation = (conversationId: string) => {
    if (!canDeleteConversation(conversationId)) {
      return;
    }

    startTransition(async () => {
      const nextId = await deleteConversationAction(conversationId);

      if (conversationId === activeConversationId && nextId) {
        router.push(`/assistant/${nextId}`);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] max-w-6xl flex-col lg:flex-row">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isPending={isPending}
        isActiveConversationEmpty={isActiveConversationEmpty}
        canDeleteConversation={canDeleteConversation}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <AssistantChat
        key={activeConversationId}
        conversationId={activeConversationId}
        initialMessages={initialMessages}
      />
    </div>
  );
}
