"use client";

import { Gauge, PiggyBank, Share2, Volume2 } from "lucide-react";
import { spaceGrotesk, jetbrainsMono } from "@/app/ui/fonts";
import type { RouteLocation, RouteOption, TravelMode } from "@/lib/routes/types";

const TRAVEL_MODE_PARAM: Record<TravelMode, string> = {
  walk: "walking",
  transit: "transit",
  bicycle: "bicycling",
};

type RouteActionBarProps = {
  route: RouteOption | undefined;
  origin: RouteLocation;
  destination: RouteLocation;
};

export default function RouteActionBar({
  route,
  origin,
  destination,
}: RouteActionBarProps) {
  if (!route || route.error) return null;

  const handleShare = async () => {
    const text = `${route.name}: ${origin.label} → ${destination.label} (${route.durationMinutes} min)`;
    if (navigator.share) {
      await navigator.share({ title: route.name, text });
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  const handleGo = () => {
    const params = new URLSearchParams({
      api: "1",
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      travelmode: TRAVEL_MODE_PARAM[route.id],
    });
    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 flex justify-center lg:inset-x-8">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-4 rounded-2xl border border-white/10 bg-surface/95 p-4 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5">
        <div className="min-w-0">
          <p
            className={`text-[9px] font-bold uppercase tracking-widest text-white/40 ${jetbrainsMono.className}`}
          >
            Current Selection
          </p>
          <p
            className={`${spaceGrotesk.className} truncate text-xl font-semibold text-accent`}
          >
            {route.name}
          </p>
        </div>

        <div className="grid flex-1 grid-cols-3 gap-3 sm:max-w-md">
          <Metric icon={Gauge} label="Efficiency" value={route.efficiency} />
          <Metric
            icon={Volume2}
            label="Noise Level"
            value={route.noiseLevel}
          />
          <Metric icon={PiggyBank} label="Cost" value={route.cost} />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void handleShare()}
            aria-label="Share route"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-white/60 transition-colors hover:border-white/20 hover:text-white"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleGo}
            className={`${spaceGrotesk.className} h-11 rounded-xl bg-accent px-8 text-sm font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90 active:scale-95`}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="text-center sm:text-left">
      <div className="flex items-center justify-center gap-1.5 sm:justify-start">
        <Icon className="h-3.5 w-3.5 text-white/40" />
        <span
          className={`text-[9px] uppercase tracking-wide text-white/40 ${jetbrainsMono.className}`}
        >
          {label}
        </span>
      </div>
      <p
        className={`mt-0.5 text-sm font-medium text-white ${spaceGrotesk.className}`}
      >
        {value}
      </p>
    </div>
  );
}
