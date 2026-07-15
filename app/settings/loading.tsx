import { spaceGrotesk } from "@/app/ui/fonts";

const chipWidths = ["w-20", "w-24", "w-16", "w-28", "w-20", "w-24"];

export default function SettingsLoading() {
  return (
    <div
      className="mx-auto max-w-3xl animate-pulse px-4 py-10 sm:px-6"
      aria-label="Loading settings"
      aria-busy="true"
    >
      <div className="mb-10">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Settings
        </p>
        <h1
          className={`${spaceGrotesk.className} mt-3 text-3xl font-light tracking-tight text-white`}
        >
          Your settings
        </h1>
        <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-white/10" />
      </div>

      <div className="space-y-12">
        <SavedPlacesSkeleton />
        <section className="border-t border-white/10 pt-10">
          <div className="mb-6 space-y-2">
            <div className="h-3 w-24 rounded-full bg-white/15" />
            <div className="h-6 w-48 rounded-full bg-white/10" />
          </div>
          <div className="space-y-10">
            <CardSection />
            <ChipSection />
            <CardSection />
            <ChipSection />
          </div>
        </section>
      </div>
    </div>
  );
}

function SavedPlacesSkeleton() {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-28 rounded-full bg-white/15" />
        <div className="h-6 w-64 max-w-full rounded-full bg-white/10" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="h-5 w-44 max-w-full rounded-full bg-white/15" />
                <div className="h-4 w-64 max-w-full rounded-full bg-white/10" />
                <div className="h-4 w-28 rounded-full bg-white/10" />
              </div>
              <div className="h-9 w-9 rounded-lg bg-white/10" />
            </div>
            <div className="mt-5 flex gap-2">
              <div className="h-9 w-28 rounded-lg bg-white/10" />
              <div className="h-9 w-28 rounded-lg bg-white/10" />
            </div>
            <div className="mt-4 border-t border-white/5 pt-4">
              <div className="h-3 w-20 rounded-full bg-white/10" />
              <div className="mt-2 h-16 rounded-lg bg-white/[0.06]" />
              <div className="mt-2 ml-auto h-8 w-20 rounded-lg bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CardSection() {
  return (
    <section className="space-y-4">
      <SectionHeading />
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-20 rounded-2xl border border-white/10 bg-white/[0.03]"
          />
        ))}
      </div>
    </section>
  );
}

function ChipSection() {
  return (
    <section className="space-y-4">
      <SectionHeading />
      <div className="flex flex-wrap gap-2">
        {chipWidths.map((width, index) => (
          <div
            key={`${width}-${index}`}
            className={`h-9 rounded-full border border-white/10 bg-white/[0.03] ${width}`}
          />
        ))}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <div className="space-y-2">
      <div className="h-5 w-28 rounded-full bg-white/15" />
      <div className="h-3 w-56 max-w-full rounded-full bg-white/10" />
    </div>
  );
}
