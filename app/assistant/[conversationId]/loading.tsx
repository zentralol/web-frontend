import { AssistantChatSkeleton } from "@/components/assistant/AssistantChatSkeleton";

export default function AssistantConversationLoading() {
  return (
    <div className="mx-auto flex h-[calc(100vh-var(--viewport-top))] max-w-6xl flex-col lg:flex-row">
      <AssistantChatSkeleton />
    </div>
  );
}
