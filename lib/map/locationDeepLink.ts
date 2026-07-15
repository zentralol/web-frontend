import type { SelectedLocation } from "./types";

type SearchParamsReader = {
  get: (name: string) => string | null;
};

function readOptionalText(
  searchParams: SearchParamsReader,
  name: string,
): string | undefined {
  const value = searchParams.get(name)?.trim();
  return value || undefined;
}

export function parseLocationDeepLink(
  searchParams: SearchParamsReader,
): SelectedLocation | null {
  if (searchParams.get("id")) return null;

  const rawLat = searchParams.get("lat")?.trim();
  const rawLng = searchParams.get("lng")?.trim();
  if (!rawLat || !rawLng) return null;

  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    return null;
  }

  return {
    lat,
    lng,
    name: readOptionalText(searchParams, "name") ?? "Selected location",
    address: readOptionalText(searchParams, "address"),
    placeId: readOptionalText(searchParams, "placeId"),
    source: "map",
  };
}
