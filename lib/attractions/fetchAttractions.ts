import type { Attraction } from "./types";

type AttractionsResponse = {
  attractions?: Attraction[];
  error?: string;
};

export async function fetchAttractions(): Promise<Attraction[]> {
  const response = await fetch("/api/attractions");

  if (!response.ok) {
    throw new Error("Could not load attractions.");
  }

  const payload = (await response.json()) as AttractionsResponse;

  if (!Array.isArray(payload.attractions)) {
    throw new Error(payload.error ?? "Could not load attractions.");
  }

  return payload.attractions;
}
