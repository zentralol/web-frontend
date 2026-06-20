import type { SelectedLocation } from "./types";

type LatLng = { lat: number; lng: number };

function geocodeAsync(
  geocoder: google.maps.Geocoder,
  location: LatLng,
): Promise<google.maps.GeocoderResult[]> {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results?.length) {
        resolve(results);
        return;
      }
      reject(new Error(status));
    });
  });
}

export async function fetchLocationDetails(
  latLng: LatLng,
  placeId: string | null | undefined,
  placesLib: google.maps.PlacesLibrary | null,
  geocodingLib: google.maps.GeocodingLibrary | null,
): Promise<SelectedLocation> {
  const base: SelectedLocation = {
    lat: latLng.lat,
    lng: latLng.lng,
    placeId: placeId ?? undefined,
  };

  if (placeId && placesLib) {
    const place = new placesLib.Place({ id: placeId });
    await place.fetchFields({
      fields: ["displayName", "formattedAddress"],
    });
    return {
      ...base,
      name: place.displayName ?? undefined,
      address: place.formattedAddress ?? undefined,
    };
  }

  if (geocodingLib) {
    const geocoder = new geocodingLib.Geocoder();
    const results = await geocodeAsync(geocoder, latLng);
    return {
      ...base,
      address: results[0]?.formatted_address,
    };
  }

  throw new Error("Location libraries not loaded");
}
