"use client";

import { Clock, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { spaceGrotesk } from "@/app/ui/fonts";
import { buildRoutesHref } from "@/lib/attractions/buildRoutesHref";
import type { TopLandmarksResult } from "@/lib/activity/fetchTopLandmarks";
import {
  busynessLevelBadgeClass,
  formatBusynessLevel,
} from "@/lib/activity/busynessDisplay";

type SectionState = "idle" | "loading" | "ready" | "error";

interface TopLandmarksSectionProps {
  state: SectionState;
  result: TopLandmarksResult;
}

function formatTargetTimeLabel(isoLike: string): string {
  const match = isoLike.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    return isoLike;
  }
  const [, year, month, day, hour, minute] = match;
  const hourNum = Number(hour);
  const suffix = hourNum >= 12 ? "PM" : "AM";
  const hour12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthLabel = monthNames[Number(month) - 1] ?? month;
  return `${monthLabel} ${Number(day)}, ${year} · ${hour12}:${minute} ${suffix} ET`;
}

export function TopLandmarksSection({
  state,
  result,
}: TopLandmarksSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
            Top landmarks
          </p>
          <h2
            className={`${spaceGrotesk.className} mt-2 text-lg font-light text-white`}
          >
            Busiest right now
          </h2>
        </div>
        {result.targetTime && state === "ready" && (
          <span className="shrink-0 text-[10px] font-mono text-white/40">
            {formatTargetTimeLabel(result.targetTime)}
          </span>
        )}
      </div>

      {state === "loading" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading predictions…
        </div>
      )}

      {state === "error" && (
        <p className="mt-6 text-sm text-red-400/90">
          {result.error ?? "Could not load top landmarks."}
        </p>
      )}

      {state === "ready" && result.landmarks.length === 0 && (
        <p className="mt-6 text-sm text-white/50">
          No busyness predictions available for landmarks right now.
        </p>
      )}

      {state === "ready" && result.landmarks.length > 0 && (
        <ul className="mt-5 space-y-3">
          {result.landmarks.map((item) => (
            <li
              key={item.attraction.id}
              className="rounded-xl border border-white/5 bg-[#121314]/55 p-3.5"
            >
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/map?id=${item.attraction.id}`}
                      className={`${spaceGrotesk.className} text-sm font-semibold text-white hover:text-accent`}
                    >
                      {item.attraction.name}
                    </Link>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${busynessLevelBadgeClass(item.busynessLevel)}`}
                    >
                      {formatBusynessLevel(item.busynessLevel)}
                    </span>
                  </div>

                  <p className="mt-1 text-[11px] text-white/45">
                    {item.attraction.category}
                    {item.attraction.neighborhood
                      ? ` · ${item.attraction.neighborhood}`
                      : ""}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-accent">
                      Score {item.busynessScore}
                    </span>
                    <Link
                      href={buildRoutesHref({
                        lat: item.attraction.lat,
                        lng: item.attraction.lng,
                        name: item.attraction.name,
                      })}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/45 hover:text-accent"
                    >
                      <MapPin className="h-3 w-3" aria-hidden />
                      Route
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
