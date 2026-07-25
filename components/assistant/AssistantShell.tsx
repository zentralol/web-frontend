"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageSquarePlus, PanelLeft } from "lucide-react";
import { ConversationSidebar } from "@/components/assistant/ConversationSidebar";
import { ConversationEmptinessProvider } from "@/components/assistant/conversationEmptinessContext";
import {
  canDeleteConversation as evaluateCanDeleteConversation,
  isConversationListBlocked,
  resolveVisiblePendingId,
} from "@/lib/assistant/conversationState";
import { logger } from "@/lib/logger";
import {
  resolveSidebarRefreshDelays,
  scheduleSidebarRefresh,
} from "@/lib/assistant/refreshSidebar";
import type { ConversationSummary } from "@/lib/assistant/types";
import {
  createConversationAction,
  deleteConversationAction,
  listConversationsAction,
} from "@/lib/assistant/actions";
import {
  createDemoConversation,
  deleteDemoConversation,
  ensureDemoConversations,
  listDemoConversations,
} from "@/lib/demo/conversationStore";
import {
  getDemoModeClient,
  getDemoModeServerSnapshot,
  subscribeDemoMode,
} from "@/lib/demo/mode";
import { spaceGrotesk } from "@/app/ui/fonts";

function subscribeAlways() {
  return () => {};
}

function getClientHydrated() {
  return true;
}

function getServerHydrated() {
  return false;
}

type AssistantShellProps = {
  initialConversations: ConversationSummary[];
  children: ReactNode;
};

export function AssistantShell({
  initialConversations,
  children,
}: AssistantShellProps) {
  const router = useRouter();
  const params = useParams<{ conversationId: string }>();
  const activeConversationId = params.conversationId;
  const isDemo = useSyncExternalStore(
    subscribeDemoMode,
    getDemoModeClient,
    getDemoModeServerSnapshot,
  );

  const [isPending, startTransition] = useTransition();
  const [conversations, setConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [pendingConversationId, setPendingConversationId] = useState<
    string | null
  >(null);
  const [isActiveConversationEmpty, setActiveConversationEmpty] =
    useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<
    string | null
  >(null);
  const [optimisticTitles, setOptimisticTitles] = useState<
    Record<string, string>
  >({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Previous-value trackers so dependent state is reconciled during render
  // instead of in effects (avoids cascading re-renders / set-state-in-effect).
  const [prevInitialConversations, setPrevInitialConversations] =
    useState(initialConversations);
  const [titleReconciledConversations, setTitleReconciledConversations] =
    useState<ConversationSummary[]>(initialConversations);
  const [sidebarSyncedConversationId, setSidebarSyncedConversationId] =
    useState(activeConversationId);

  const refreshCleanupRef = useRef<(() => void) | null>(null);
  const conversationsRef = useRef(conversations);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  // Adopt fresh server-provided conversations when the prop reference changes.
  // Demo mode keeps the localStorage-backed list instead.
  if (initialConversations !== prevInitialConversations) {
    setPrevInitialConversations(initialConversations);
    if (!isDemo) {
      setConversations(initialConversations);
    }
  }

  // Drop optimistic titles once the real title arrives from the server.
  if (conversations !== titleReconciledConversations) {
    setTitleReconciledConversations(conversations);
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
  }

  // Collapse the mobile sidebar whenever the active conversation changes.
  if (activeConversationId !== sidebarSyncedConversationId) {
    setSidebarSyncedConversationId(activeConversationId);
    setIsSidebarOpen(false);
  }

  const visiblePendingConversationId = resolveVisiblePendingId(
    pendingConversationId,
    activeConversationId,
  );

  const isListBlocked = isConversationListBlocked({
    isPending,
    deletingConversationId,
    visiblePendingConversationId,
  });

  const hydrated = useSyncExternalStore(
    subscribeAlways,
    getClientHydrated,
    getServerHydrated,
  );
  const [demoSynced, setDemoSynced] = useState(false);

  // Bootstrap demo conversations from localStorage during render (not in an
  // effect) so we stay compatible with react-hooks/set-state-in-effect.
  if (isDemo && hydrated && !demoSynced) {
    setDemoSynced(true);
    setConversations(ensureDemoConversations());
  }
  if ((!isDemo || !hydrated) && demoSynced) {
    setDemoSynced(false);
    if (!isDemo) {
      setConversations(initialConversations);
    }
  }

  useEffect(() => {
    if (!isDemo || !hydrated || !activeConversationId) {
      return;
    }

    const list = listDemoConversations();
    if (
      list.length > 0 &&
      !list.some((item) => item.id === activeConversationId)
    ) {
      router.replace(`/assistant/${list[0].id}`);
    }
  }, [isDemo, hydrated, activeConversationId, router]);

  const requestSidebarRefresh = useCallback(() => {
    refreshCleanupRef.current?.();

    const conversationId = activeConversationId;
    const waitForTitle = !conversationsRef.current.find(
      (item) => item.id === conversationId,
    )?.title;

    let cancelled = false;

    const cleanup = scheduleSidebarRefresh(async () => {
      if (cancelled) {
        return;
      }

      const fresh = isDemo
        ? listDemoConversations()
        : await listConversationsAction();
      if (cancelled) {
        return;
      }

      setConversations(fresh);

      if (waitForTitle) {
        const active = fresh.find((item) => item.id === conversationId);
        if (active?.title) {
          cancelled = true;
          refreshCleanupRef.current?.();
          refreshCleanupRef.current = null;
        }
      }
    }, resolveSidebarRefreshDelays(waitForTitle));

    refreshCleanupRef.current = () => {
      cancelled = true;
      cleanup();
    };
  }, [activeConversationId, isDemo]);

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

  const sidebarConversations = useMemo(
    () =>
      conversations.map((conversation) => ({
        ...conversation,
        title:
          conversation.title ?? optimisticTitles[conversation.id] ?? null,
      })),
    [conversations, optimisticTitles],
  );

  const activeConversationTitle =
    sidebarConversations.find(
      (conversation) => conversation.id === activeConversationId,
    )?.title ?? "New chat";

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

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
      if (isDemo) {
        const conversation = createDemoConversation();
        setConversations(listDemoConversations());
        setPendingConversationId(conversation.id);
        router.push(`/assistant/${conversation.id}`);
        return;
      }

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
    if (isListBlocked || !canDeleteConversation(conversationId)) {
      return;
    }

    setDeletingConversationId(conversationId);
    startTransition(async () => {
      try {
        if (isDemo) {
          const nextId = deleteDemoConversation(conversationId);
          setConversations(listDemoConversations());
          if (conversationId === activeConversationId) {
            setPendingConversationId(nextId);
            router.push(`/assistant/${nextId}`);
          }
          return;
        }

        const nextId = await deleteConversationAction(conversationId);

        if (conversationId === activeConversationId && nextId) {
          setPendingConversationId(nextId);
          router.push(`/assistant/${nextId}`);
          return;
        }

        const fresh = await listConversationsAction();
        setConversations(fresh);
        router.refresh();
      } catch (error) {
        logger.error("Conversation deletion failed", {
          conversationId,
          error,
        });
      } finally {
        setDeletingConversationId(null);
      }
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

  const sidebarProps = {
    conversations: sidebarConversations,
    activeConversationId,
    pendingConversationId: visiblePendingConversationId,
    isPending,
    isDeleteDisabled: isListBlocked,
    isActiveConversationEmpty,
    canDeleteConversation,
    onNewChat: handleNewChat,
    onSelectConversation: handleSelectConversation,
    onDeleteConversation: handleDeleteConversation,
  };

  const isNewChatDisabled = isPending || isActiveConversationEmpty;

  return (
    <ConversationEmptinessProvider value={shellContextValue}>
      <div className="mx-auto flex h-[calc(100dvh-var(--viewport-top))] w-full max-w-6xl flex-col overflow-hidden lg:flex-row">
        <ConversationSidebar {...sidebarProps} />

        {isSidebarOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 top-[var(--viewport-top)] z-40 bg-black/60 lg:hidden"
              aria-label="Close conversation list"
              onClick={closeSidebar}
            />
            <div
              id="assistant-conversation-drawer"
              className="fixed inset-y-0 left-0 top-[var(--viewport-top)] z-50 w-[min(100%,320px)] border-r border-white/10 bg-surface lg:hidden"
            >
              <ConversationSidebar
                {...sidebarProps}
                variant="drawer"
                onAfterNavigate={closeSidebar}
              />
            </div>
          </>
        )}

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-4 py-3 lg:hidden">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/5 hover:text-accent"
              aria-label="Open conversation list"
              aria-expanded={isSidebarOpen}
              aria-controls="assistant-conversation-drawer"
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <p
              className={`${spaceGrotesk.className} min-w-0 flex-1 truncate text-sm font-medium text-white`}
            >
              {activeConversationTitle}
            </p>
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
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageSquarePlus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {children}
        </section>
      </div>
    </ConversationEmptinessProvider>
  );
}
