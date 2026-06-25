import type {
  GoogleTravelMode,
  RouteLocation,
  RouteOption,
  TravelMode,
} from "./types";
import { withMockData } from "./constants";

type GoogleLatLng = {
  latitude: number;
  longitude: number;
};

type GoogleRoute = {
  duration?: string;
  distanceMeters?: number;
  polyline?: {
    encodedPolyline?: string;
  };
};

type GoogleComputeRoutesResponse = {
  routes?: GoogleRoute[];
};

const MODE_CONFIG: Record<
  TravelMode,
  {
    googleMode: GoogleTravelMode;
    name: string;
    baseTags: string[];
    cost: string;
    efficiency: string;
    noiseLevel: string;
  }
> = {
  walk: {
    googleMode: "WALK",
    name: "Walk",
    baseTags: ["ZEN PATH", "LOW DENSITY"],
    cost: "Free",
    efficiency: "Moderate",
    noiseLevel: "24dB Avg",
  },
  transit: {
    googleMode: "TRANSIT",
    name: "Transit",
    baseTags: ["BUSY STATION"],
    cost: "$2.90",
    efficiency: "High",
    noiseLevel: "38dB Avg",
  },
  bicycle: {
    googleMode: "BICYCLE",
    name: "Bicycle",
    baseTags: ["FASTEST"],
    cost: "$4.50",
    efficiency: "High",
    noiseLevel: "18dB Avg",
  },
};

function parseDurationSeconds(duration?: string): number {
  if (!duration) return 0;
  const match = duration.match(/^(\d+(?:\.\d+)?)s$/);
  return match ? Math.round(Number(match[1])) : 0;
}

const MOCK_NARRATIVES: Record<TravelMode, string> = {
  walk: "Low sidewalk density along the route.",
  transit: "Expect moderate platform density at transfer stations.",
  bicycle: "Docks likely available at both ends.",
};

function buildFactualSummary(
  durationMinutes: number,
  distanceMiles: number,
): string {
  return `${distanceMiles.toFixed(1)} mi · ${durationMinutes} min`;
}

function buildDescription(
  mode: TravelMode,
  durationMinutes: number,
  distanceMiles: number,
): string {
  return `${buildFactualSummary(durationMinutes, distanceMiles)}\n${withMockData(MOCK_NARRATIVES[mode])}`;
}

function mapSingleRoute(
  mode: TravelMode,
  route: GoogleRoute | null,
  isFastest: boolean,
  error?: string,
): RouteOption {
  const config = MODE_CONFIG[mode];

  if (!route || error) {
    return {
      id: mode,
      name: config.name,
      description: error ?? "Route unavailable for this mode.",
      durationMinutes: 0,
      tags: config.baseTags.map(withMockData),
      encodedPolyline: "",
      efficiency: withMockData(config.efficiency),
      noiseLevel: withMockData(config.noiseLevel),
      cost: withMockData(config.cost),
      error: error ?? "Route unavailable",
    };
  }

  const durationSeconds = parseDurationSeconds(route.duration);
  const distanceMeters = route.distanceMeters ?? 0;
  const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
  const distanceMiles = distanceMeters / 1609.34;

  const tags = config.baseTags.map(withMockData);
  if (mode === "bicycle" && isFastest) {
    if (!tags.some((tag) => tag.startsWith("FASTEST"))) {
      tags.unshift(withMockData("FASTEST"));
    }
  }

  return {
    id: mode,
    name: config.name,
    description: buildDescription(mode, durationMinutes, distanceMiles),
    durationMinutes,
    tags,
    encodedPolyline: route.polyline?.encodedPolyline ?? "",
    efficiency: withMockData(config.efficiency),
    noiseLevel: withMockData(config.noiseLevel),
    cost: withMockData(config.cost),
  };
}

export async function computeGoogleRoutes(
  origin: GoogleLatLng,
  destination: GoogleLatLng,
  apiKey: string,
  travelMode: GoogleTravelMode,
): Promise<GoogleRoute | null> {
  const fieldMask = [
    "routes.duration",
    "routes.distanceMeters",
    "routes.polyline.encodedPolyline",
  ].join(",");

  const response = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: origin,
          },
        },
        destination: {
          location: {
            latLng: destination,
          },
        },
        travelMode,
        computeAlternativeRoutes: false,
        languageCode: "en-US",
        units: "IMPERIAL",
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Routes API failed (${response.status})`);
  }

  const data = (await response.json()) as GoogleComputeRoutesResponse;
  return data.routes?.[0] ?? null;
}

export async function computeAllModeRoutes(
  origin: RouteLocation,
  destination: RouteLocation,
  apiKey: string,
): Promise<RouteOption[]> {
  const originLatLng = { latitude: origin.lat, longitude: origin.lng };
  const destLatLng = { latitude: destination.lat, longitude: destination.lng };

  const modes: TravelMode[] = ["walk", "transit", "bicycle"];

  const results = await Promise.all(
    modes.map(async (mode) => {
      try {
        const route = await computeGoogleRoutes(
          originLatLng,
          destLatLng,
          apiKey,
          MODE_CONFIG[mode].googleMode,
        );
        return { mode, route, error: undefined as string | undefined };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to compute route";
        return { mode, route: null, error: message };
      }
    }),
  );

  const durations = results
    .filter((r) => r.route)
    .map((r) => ({
      mode: r.mode,
      seconds: parseDurationSeconds(r.route!.duration),
    }));

  const fastestMode =
    durations.length > 0
      ? durations.reduce((a, b) => (a.seconds <= b.seconds ? a : b)).mode
      : null;

  return results.map(({ mode, route, error }) =>
    mapSingleRoute(mode, route, fastestMode === mode, error),
  );
}
