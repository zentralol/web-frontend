import { spaceGrotesk } from "@/app/ui/fonts";

const ACTIVITY_ROW_COUNT = 4;

export default function ActivitySkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl animate-pulse px-4 py-10 sm:px-6"
      aria-busy="true"
      aria-label="Loading activity"
    >
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Activity
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-3 text-3xl font-light tracking-tight text-white`}
        >
          Your journey
        </h1>
        <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-white/10" />
      </div>

      <div className="mb-12 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.03] lg:col-span-7" />
        <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.03] lg:col-span-5" />
      </div>

      <div className="mb-4 h-3 w-24 rounded-full bg-white/10" />

      <div className="space-y-3">
        {Array.from({ length: ACTIVITY_ROW_COUNT }, (_, index) => (
          <div
            key={index}
            className="h-16 rounded-xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}
