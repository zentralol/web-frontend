import { AssistantChatSkeleton } from "@/components/assistant/AssistantChatSkeleton";
import { ConversationSidebarSkeleton } from "@/components/assistant/ConversationSidebarSkeleton";

export default function AssistantConversationLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] w-full max-w-6xl flex-col overflow-hidden lg:flex-row">
      <ConversationSidebarSkeleton />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AssistantChatSkeleton />
      </section>
    </div>
  );
}
