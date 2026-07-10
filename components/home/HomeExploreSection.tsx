"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Search } from "lucide-react";
import { spaceGrotesk } from "@/app/ui/fonts";
import type { Attraction } from "@/lib/attractions/types";

type HomeExploreSectionProps = {
  recommendedAttractions: Attraction[];
};

export default function HomeExploreSection({
  recommendedAttractions,
}: HomeExploreSectionProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/map");
      return;
    }
    router.push(`/map?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="mt-10 space-y-8">
      <form onSubmit={handleSearch} className="max-w-xl">
        <label htmlFor="home-map-search" className="sr-only">
          Search attractions
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
            aria-hidden
          />
          <input
            id="home-map-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search attractions on the map…"
            className="w-full rounded-full border border-white/10 bg-white/[0.03] py-3.5 pl-11 pr-36 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-accent/40"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-accent px-5 py-2 text-xs font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
          >
            Search
          </button>
        </div>
      </form>

      {recommendedAttractions.length > 0 && (
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-accent/80">
            Recommended for you
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {recommendedAttractions.map((attraction) => (
              <Link
                key={attraction.id}
                href={`/map?id=${attraction.id}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 hover:border-accent/40 hover:bg-accent/5"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                  <div className="min-w-0">
                    <h2
                      className={`${spaceGrotesk.className} truncate text-base font-semibold text-white`}
                    >
                      {attraction.name}
                    </h2>
                    <p className="mt-1 truncate text-sm text-white/50">
                      {attraction.category}
                      {attraction.neighborhood
                        ? ` · ${attraction.neighborhood}`
                        : ""}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/map"
          className="rounded-full bg-accent px-8 py-3 text-sm font-bold uppercase tracking-widest text-surface transition-opacity hover:opacity-90"
        >
          Open map
        </Link>
        <Link
          href="/settings"
          className="rounded-full border border-white/15 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          Preferences
        </Link>
      </div>
    </div>
  );
}
