"use client";

import { spaceGrotesk } from "@/app/ui/fonts";
import { useDemoMode } from "@/lib/demo/useDemoMode";

export function DemoModeSection() {
  const { enabled, hydrated, setDemoMode } = useDemoMode();

  return (
    <section
      aria-labelledby="demo-mode-heading"
      className="border-b border-white/10 pb-10"
    >
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
          Demo
        </p>
        <h2
          id="demo-mode-heading"
          className={`${spaceGrotesk.className} mt-2 text-xl font-light text-white`}
        >
          Demo mode
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
          Uses simulated map, route, activity, and assistant data. Login and
          Google Maps stay online.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <div>
          <p className="text-sm font-medium text-white">
            {enabled ? "Demo mode is on" : "Demo mode is off"}
          </p>
          <p className="mt-1 text-xs text-white/45">
            {enabled
              ? "Backend, database, and route APIs are not contacted."
              : "Live data from your connected services."}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle demo mode"
          disabled={!hydrated}
          onClick={() => setDemoMode(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            enabled ? "bg-accent" : "bg-white/15"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
              enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </section>
  );
}
