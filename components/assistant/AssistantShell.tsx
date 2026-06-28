"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { ConversationSidebar } from "@/components/assistant/ConversationSidebar";
import { ConversationEmptinessProvider } from "@/components/assistant/conversationEmptinessContext";
import {
  canDeleteConversation as evaluateCanDeleteConversation,
  resolveVisiblePendingId,
} from "@/lib/assistant/conversationState";
import type { ConversationSummary } from "@/lib/assistant/types";
import {
  createConversationAction,
  deleteConversationAction,
} from "@/lib/assistant/actions";

type AssistantShellProps = {
  conversations: ConversationSummary[];
  children: ReactNode;
};

export function AssistantShell({
  conversations,
  children,
}: AssistantShellProps) {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  const activeConversationId = params.conversationId;

  const [isPending, startTransition] = useTransition();
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);
  const [isActiveConversationEmpty, setActiveConversationEmpty] =
    useState(false);

  const visiblePendingConversationId = resolveVisiblePendingId(
    pendingConversationId,
    activeConversationId,
  );

  const canDeleteConversation = (conversationId: string) =>
    evaluateCanDeleteConversation({
      conversationsLength: conversations.length,
      conversationId,
      activeConversationId,
      isActiveConversationEmpty,
    });

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

  const emptinessValue = useMemo(
    () => ({ isActiveConversationEmpty, setActiveConversationEmpty }),
    [isActiveConversationEmpty],
  );

  return (
    <ConversationEmptinessProvider value={emptinessValue}>
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
          {children}
        </section>
      </div>
    </ConversationEmptinessProvider>
  );
}
