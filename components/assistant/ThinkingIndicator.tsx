import { Bot } from "lucide-react";

export function ThinkingIndicator() {
  return (
    <div
      className="animate-fade-in mr-auto flex max-w-[85%] gap-3"
      role="status"
      aria-live="polite"
      aria-label="Assistant is thinking"
    >
      <div className="animate-breath flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-accent">
        <Bot className="h-3.5 w-3.5" />
      </div>
      <div className="animate-breath rounded-xl border border-white/5 bg-surface px-4 py-3 text-sm text-white/55">
        Thinking...
      </div>
    </div>
  );
}
