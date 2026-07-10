import { haversineDistanceKm } from "@/lib/geo/haversineDistance";
import type { TravelInterest } from "@/lib/onboarding/types";
import { scoreAttractionInterests } from "./interestMatching";
import type { Attraction } from "./types";

export type AttractionSortMode = "recommended" | "near_me" | "name";

export type FilterAttractionsOptions = {
  query?: string;
  category?: string | null;
  sortMode?: AttractionSortMode;
  userCoords?: { lat: number; lng: number } | null;
  interests?: TravelInterest[];
};

export function extractCategories(attractions: Attraction[]): string[] {
  const categories = new Set<string>();
  for (const attraction of attractions) {
    const category = attraction.category.trim();
    if (category) {
      categories.add(category);
    }
  }
  return [...categories].sort((a, b) => a.localeCompare(b));
}

function matchesQuery(attraction: Attraction, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  const haystack = [
    attraction.name,
    attraction.category,
    attraction.neighborhood,
    attraction.description,
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function matchesCategory(attraction: Attraction, category: string | null | undefined): boolean {
  if (!category) {
    return true;
  }
  return attraction.category === category;
}

function compareByName(a: Attraction, b: Attraction): number {
  return a.name.localeCompare(b.name);
}

export function filterAttractions(
  attractions: Attraction[],
  options: FilterAttractionsOptions = {},
): Attraction[] {
  const {
    query = "",
    category = null,
    sortMode = "recommended",
    userCoords = null,
    interests = [],
  } = options;

  const filtered = attractions.filter(
    (attraction) => matchesQuery(attraction, query) && matchesCategory(attraction, category),
  );

  if (sortMode === "name") {
    return [...filtered].sort(compareByName);
  }

  if (sortMode === "near_me" && userCoords) {
    return [...filtered].sort((a, b) => {
      const distanceA = haversineDistanceKm(
        userCoords.lat,
        userCoords.lng,
        a.lat,
        a.lng,
      );
      const distanceB = haversineDistanceKm(
        userCoords.lat,
        userCoords.lng,
        b.lat,
        b.lng,
      );
      if (distanceA !== distanceB) {
        return distanceA - distanceB;
      }
      return compareByName(a, b);
    });
  }

  return [...filtered].sort((a, b) => {
    const scoreA = scoreAttractionInterests(a, interests);
    const scoreB = scoreAttractionInterests(b, interests);
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }
    return compareByName(a, b);
  });
}

export function pickRecommendedAttractions(
  attractions: Attraction[],
  interests: TravelInterest[],
  limit: number,
): Attraction[] {
  return filterAttractions(attractions, {
    sortMode: "recommended",
    interests,
  }).slice(0, limit);
}
