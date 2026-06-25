import { AssistantChatSkeleton } from "@/components/assistant/AssistantChatSkeleton";

export default function AssistantConversationLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] w-full max-w-6xl flex-col overflow-hidden lg:flex-row">
      {/* Reserve the sidebar column (no skeleton) so the chat skeleton stays in the right column. */}
      <div
        aria-hidden="true"
        className="hidden shrink-0 border-r border-white/10 bg-surface lg:block lg:w-[300px] xl:w-[320px]"
      />
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AssistantChatSkeleton />
      </section>
    </div>
  );
}
