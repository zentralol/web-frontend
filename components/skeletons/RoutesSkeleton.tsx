import { MapPin } from "lucide-react";

const ROUTE_CARD_COUNT = 3;

function RouteCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex justify-between">
        <div className="h-4 w-24 rounded bg-white/10" />
        <div className="h-4 w-10 rounded bg-white/10" />
      </div>
      <div className="mt-3 h-3 w-full rounded bg-white/10" />
      <div className="mt-2 h-3 w-2/3 rounded bg-white/10" />
    </div>
  );
}

export default function RoutesSkeleton() {
  return (
    <div
      className="flex h-[calc(100vh-var(--viewport-top))] flex-col lg:flex-row"
      aria-busy="true"
      aria-label="Loading routes"
    >
      <aside className="flex w-full shrink-0 flex-col border-b border-white/10 bg-surface lg:w-[380px] lg:border-b-0 lg:border-r">
        <div className="space-y-3 border-b border-white/10 p-4">
          <div className="h-12 w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
          <div className="h-12 w-full animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />

          <div className="flex items-start gap-2 text-xs text-white/45">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>Set your origin and destination, then tap Plan Route.</span>
          </div>

          <div className="h-12 w-full animate-pulse rounded-xl bg-accent/20" />
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-4">
          {Array.from({ length: ROUTE_CARD_COUNT }, (_, index) => (
            <RouteCardSkeleton key={index} />
          ))}
        </div>
      </aside>

      <div className="relative min-h-[320px] min-w-0 flex-1">
        <div className="absolute inset-0 animate-pulse bg-white/[0.03]" />
      </div>
    </div>
  );
}
