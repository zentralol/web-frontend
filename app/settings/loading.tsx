import { spaceGrotesk } from "@/app/ui/fonts";

const chipWidths = ["w-20", "w-24", "w-16", "w-28", "w-20", "w-24"];

export default function SettingsLoading() {
  return (
    <div
      className="mx-auto max-w-3xl animate-pulse px-6 py-10"
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
          Travel preferences
        </h1>
        <div className="mt-4 h-4 w-80 max-w-full rounded-full bg-white/10" />
      </div>

      <div className="space-y-10">
        <CardSection />
        <ChipSection />
        <CardSection />
        <ChipSection />
      </div>
    </div>
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
