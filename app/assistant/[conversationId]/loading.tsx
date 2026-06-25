import { AssistantChatSkeleton } from "@/components/assistant/AssistantChatSkeleton";

export default function AssistantConversationLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] w-full max-w-6xl flex-col overflow-hidden lg:flex-row">
      <AssistantChatSkeleton />
    </div>
  );
}
