import { MapPin } from "lucide-react";

export default function MapSkeleton() {
  return (
    <div
      className="relative h-[calc(100vh-var(--viewport-top))] lg:flex"
      aria-busy="true"
      aria-label="Loading map"
    >
      <div className="absolute inset-0 animate-pulse bg-white/[0.03] lg:relative lg:min-w-0 lg:flex-1">
        <div className="flex h-full items-center justify-center">
          <MapPin className="h-16 w-16 text-white/5" aria-hidden="true" />
        </div>
      </div>

      <aside className="hidden h-full w-96 shrink-0 flex-col border-l border-white/10 bg-surface lg:flex">
        <div className="space-y-4 p-4">
          <div className="h-6 w-40 rounded-full bg-white/10" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-2/3 rounded-full bg-white/10" />
          </div>
        </div>

        <div className="flex-1 space-y-4 p-4 pt-0">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
            >
              <div className="h-4 w-3/4 rounded-full bg-white/10" />
              <div className="h-3 w-full rounded-full bg-white/10" />
              <div className="h-3 w-2/3 rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
