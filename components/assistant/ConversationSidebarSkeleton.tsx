const ROW_WIDTHS = ["w-40", "w-32", "w-44", "w-28", "w-36"] as const;

export function ConversationSidebarSkeleton() {
  return (
    <aside
      className="flex w-full shrink-0 flex-col border-b border-white/10 bg-surface lg:h-full lg:w-[300px] lg:border-b-0 lg:border-r xl:w-[320px]"
      aria-busy="true"
      aria-label="Loading conversations"
    >
      <div className="border-b border-white/10 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-3 w-20 rounded bg-white/10" />
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="mt-1 h-10 w-full rounded-lg bg-white/10" />
        </div>
      </div>

      <div className="flex max-h-48 flex-col gap-2 overflow-hidden p-2 lg:max-h-none lg:flex-1">
        {ROW_WIDTHS.map((width, index) => (
          <div
            key={index}
            className="animate-pulse space-y-2 rounded-lg px-3 py-3"
          >
            <div className={`h-3.5 max-w-full rounded bg-white/10 ${width}`} />
            <div className="h-3 w-16 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </aside>
  );
}
