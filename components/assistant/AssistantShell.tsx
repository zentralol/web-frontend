"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { ConversationSidebar } from "@/components/assistant/ConversationSidebar";
import { ConversationEmptinessProvider } from "@/components/assistant/conversationEmptinessContext";
import {
  canDeleteConversation as evaluateCanDeleteConversation,
  resolveVisiblePendingId,
} from "@/lib/assistant/conversationState";
import { scheduleSidebarRefresh } from "@/lib/assistant/refreshSidebar";
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
  const [optimisticTitles, setOptimisticTitles] = useState<
    Record<string, string>
  >({});

  const refreshCleanupRef = useRef<(() => void) | null>(null);

  const visiblePendingConversationId = resolveVisiblePendingId(
    pendingConversationId,
    activeConversationId,
  );

  const requestSidebarRefresh = useCallback(() => {
    refreshCleanupRef.current?.();
    refreshCleanupRef.current = scheduleSidebarRefresh(() => {
      router.refresh();
    });
  }, [router]);

  const setOptimisticTitle = useCallback(
    (conversationId: string, title: string) => {
      setOptimisticTitles((current) => ({
        ...current,
        [conversationId]: title,
      }));
    },
    [],
  );

  useEffect(() => {
    return () => {
      refreshCleanupRef.current?.();
    };
  }, []);

  useEffect(() => {
    setOptimisticTitles((current) => {
      let changed = false;
      const next = { ...current };

      for (const conversation of conversations) {
        if (conversation.title && next[conversation.id]) {
          delete next[conversation.id];
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [conversations]);

  const sidebarConversations = useMemo(
    () =>
      conversations.map((conversation) => ({
        ...conversation,
        title:
          conversation.title ?? optimisticTitles[conversation.id] ?? null,
      })),
    [conversations, optimisticTitles],
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

  const shellContextValue = useMemo(
    () => ({
      isActiveConversationEmpty,
      setActiveConversationEmpty,
      requestSidebarRefresh,
      setOptimisticTitle,
    }),
    [
      isActiveConversationEmpty,
      requestSidebarRefresh,
      setOptimisticTitle,
    ],
  );

  return (
    <ConversationEmptinessProvider value={shellContextValue}>
      <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] w-full max-w-6xl flex-col overflow-hidden lg:flex-row">
        <ConversationSidebar
          conversations={sidebarConversations}
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
