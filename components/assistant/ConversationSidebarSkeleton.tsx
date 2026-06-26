import { spaceGrotesk } from "@/app/ui/fonts";

const SKELETON_ROWS = 5;

export function ConversationSidebarSkeleton() {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-surface lg:h-full lg:w-[300px] lg:border-b-0 lg:border-r xl:w-[320px]">
      <div className="border-b border-white/10 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
        <div
          className={`${spaceGrotesk.className} mt-2 h-6 w-32 animate-pulse rounded bg-white/15`}
        />
        <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-accent/20" />
      </div>

      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div
            key={index}
            className="space-y-2 rounded-lg border border-transparent px-3 py-3"
          >
            <div className="h-4 w-[85%] animate-pulse rounded bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </aside>
  );
}
