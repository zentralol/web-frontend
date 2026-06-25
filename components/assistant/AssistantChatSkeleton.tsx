function MessageBubbleSkeleton({ align }: { align: "left" | "right" }) {
  const isUser = align === "right";

  return (
    <div
      className={`flex max-w-[85%] gap-3 ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
    >
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-white/10" />
      <div
        className={`animate-pulse rounded-xl border px-4 py-3 ${
          isUser
            ? "border-accent/10 bg-accent/5"
            : "border-white/5 bg-white/[0.03]"
        }`}
      >
        <div className="space-y-2">
          <div className="h-3 w-48 rounded bg-white/10" />
          <div className="h-3 w-36 rounded bg-white/10" />
          {!isUser && <div className="h-3 w-28 rounded bg-white/10" />}
        </div>
      </div>
    </div>
  );
}

export function AssistantChatSkeleton() {
  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-6 sm:px-6"
      aria-busy="true"
      aria-label="Loading conversation"
    >
      <div className="mb-6 shrink-0 animate-pulse space-y-3">
        <div className="h-8 w-56 rounded bg-white/10 sm:w-64" />
        <div className="h-4 w-80 max-w-full rounded bg-white/10" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <div className="flex-1 space-y-4 overflow-hidden p-4 sm:p-6">
          <MessageBubbleSkeleton align="right" />
          <MessageBubbleSkeleton align="left" />
          <MessageBubbleSkeleton align="right" />
          <MessageBubbleSkeleton align="left" />
        </div>

        <div className="shrink-0 border-t border-white/10 p-4">
          <div className="flex animate-pulse gap-2">
            <div className="h-12 flex-1 rounded-lg bg-white/10" />
            <div className="h-12 w-12 shrink-0 rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
