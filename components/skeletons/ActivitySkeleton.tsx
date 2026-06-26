import { spaceGrotesk } from "@/app/ui/fonts";

const ACTIVITY_CARD_COUNT = 3;
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: ACTIVITY_CARD_COUNT }, (_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>

      <div className="mt-8 space-y-3">
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
