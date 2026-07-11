import type { TravelInterest } from "@/lib/onboarding/types";
import type { Attraction } from "./types";

const INTEREST_KEYWORDS: Record<TravelInterest, string[]> = {
  food: ["food", "restaurant", "market", "dining", "cafe", "culinary", "eat"],
  nature: ["nature", "park", "garden", "beach", "trail", "outdoor", "green"],
  history: [
    "history",
    "historic",
    "museum",
    "landmark",
    "monument",
    "heritage",
    "memorial",
  ],
  art: ["art", "gallery", "museum", "sculpture", "exhibit", "design"],
  nightlife: ["nightlife", "bar", "club", "evening", "entertainment", "music"],
  shopping: ["shopping", "market", "retail", "store", "boutique", "mall"],
  architecture: [
    "architecture",
    "building",
    "cathedral",
    "bridge",
    "skyscraper",
    "landmark",
  ],
  localCulture: [
    "culture",
    "cultural",
    "neighborhood",
    "local",
    "community",
    "tradition",
  ],
};

function searchableText(attraction: Attraction): string {
  return [
    attraction.name,
    attraction.category,
    attraction.neighborhood,
    attraction.description,
  ]
    .join(" ")
    .toLowerCase();
}

/** Count keyword hits from user interests against an attraction's text fields. */
export function scoreAttractionInterests(
  attraction: Attraction,
  interests: TravelInterest[],
): number {
  if (interests.length === 0) {
    return 0;
  }

  const text = searchableText(attraction);
  let score = 0;

  for (const interest of interests) {
    const keywords = INTEREST_KEYWORDS[interest];
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }
  }

  return score;
}
