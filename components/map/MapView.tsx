"use client";

import { useCallback, useEffect, useState } from "react";
import {
  APIProvider,
  ControlPosition,
  Map,
  MapControl,
  Marker,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { LocateFixed, Loader2 } from "lucide-react";
import { fetchAttractions } from "@/lib/attractions/fetchAttractions";
import {
  requestCurrentPosition,
  type Coords,
} from "@/lib/geo/requestCurrentPosition";
import type { Attraction } from "@/lib/attractions/types";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import { fetchLocationDetails } from "@/lib/map/fetchLocationDetails";
import { fetchBusynessData } from "@/lib/map/fetchPredictions";
import type { LocationSelectionState } from "@/lib/map/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ATTRACTION_MARKER_COLOR = "#00BFFF";
const USER_MARKER_COLOR = "#4285F4";
const LOCATION_ERROR_MESSAGE =
  "Couldn't get your location. Check location permissions.";

type PendingSelection =
  | {
      kind: "map";
      lat: number;
      lng: number;
      placeId?: string | null;
    }
  | {
      kind: "attraction";
      attraction: Attraction;
    };

type MapViewProps = {
  onLoadingStart: (lat: number, lng: number) => void;
  onMapDragStart: () => void;
  onSelectionChange: (selection: LocationSelectionState) => void;
};

function UserMarker({ position }: { position: Coords }) {
  return (
    <Marker
      position={position}
      zIndex={10}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: USER_MARKER_COLOR,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      }}
    />
  );
}

function MyLocationControl({
  onLocate,
}: {
  onLocate: (coords: Coords) => void;
}) {
  const map = useMap();
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationError) return;
    const timer = window.setTimeout(() => setLocationError(null), 5000);
    return () => window.clearTimeout(timer);
  }, [locationError]);

  const handleClick = async () => {
    if (locating) return;
    setLocating(true);
    setLocationError(null);
    try {
      const coords = await requestCurrentPosition();
      map?.panTo(coords);
      map?.setZoom(15);
      onLocate(coords);
    } catch {
      setLocationError(LOCATION_ERROR_MESSAGE);
    } finally {
      setLocating(false);
    }
  };

  if (!map) return null;

  return (
    <MapControl position={ControlPosition.TOP_RIGHT}>
      <div className="mr-3 mt-3 flex flex-col items-end gap-1">
        <div className="overflow-hidden rounded-lg border border-white/10 bg-surface/90 shadow-lg">
          <button
            type="button"
            aria-label="Locate me"
            title="Locate me"
            onClick={handleClick}
            disabled={locating}
            className="flex h-9 w-9 items-center justify-center text-white/70 transition-colors hover:bg-white/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LocateFixed className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        {locationError && (
          <p className="max-w-[200px] rounded-lg border border-white/10 bg-surface/95 px-2 py-1 text-right text-[11px] text-[#ff3b30] shadow-lg">
            {locationError}
          </p>
        )}
      </div>
    </MapControl>
  );
}

function AttractionMarker({
  attraction,
  onSelect,
}: {
  attraction: Attraction;
  onSelect: (attraction: Attraction) => void;
}) {
  return (
    <Marker
      position={{ lat: attraction.lat, lng: attraction.lng }}
      title={attraction.name}
      onClick={() => onSelect(attraction)}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: ATTRACTION_MARKER_COLOR,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      }}
    />
  );
}

function MapContent({
  onLoadingStart,
  onMapDragStart,
  onSelectionChange,
}: MapViewProps) {
  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");
  const backendFetch = useAuthenticatedBackendFetch();
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [userPosition, setUserPosition] = useState<Coords | null>(null);
  const [pendingSelection, setPendingSelection] =
    useState<PendingSelection | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchAttractions()
      .then((items) => {
        if (!cancelled) {
          setAttractions(items);
        }
      })
      .catch(() => {
        // Silently degrade: map clicks still work without markers.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleClick = useCallback(
    (ev: MapMouseEvent) => {
      const { latLng, placeId } = ev.detail;
      if (!latLng) return;

      if (placeId) {
        ev.stop();
      }

      onLoadingStart(latLng.lat, latLng.lng);
      setPendingSelection({
        kind: "map",
        lat: latLng.lat,
        lng: latLng.lng,
        placeId,
      });
    },
    [onLoadingStart],
  );

  const handleAttractionClick = useCallback(
    (attraction: Attraction) => {
      onLoadingStart(attraction.lat, attraction.lng);
      setPendingSelection({
        kind: "attraction",
        attraction,
      });
    },
    [onLoadingStart],
  );

  const handleLocate = useCallback(
    (coords: Coords) => {
      setUserPosition(coords);
      onLoadingStart(coords.lat, coords.lng);
      setPendingSelection({
        kind: "map",
        lat: coords.lat,
        lng: coords.lng,
      });
    },
    [onLoadingStart],
  );

  useEffect(() => {
    if (!pendingSelection) return;

    let cancelled = false;

    (async () => {
      try {
        if (pendingSelection.kind === "attraction") {
          const attraction = pendingSelection.attraction;
          const location = {
            lat: attraction.lat,
            lng: attraction.lng,
            name: attraction.name,
            category: attraction.category,
            neighborhood: attraction.neighborhood,
            description: attraction.description,
            attractionId: attraction.id,
            source: "attraction" as const,
          };
          const busynessData = await fetchBusynessData(
            attraction.lat,
            attraction.lng,
            backendFetch,
          );
          if (cancelled) return;
          onSelectionChange({
            status: "ready",
            location: {
              ...location,
              ...busynessData,
            },
          });
          return;
        }

        const { lat, lng, placeId } = pendingSelection;
        const location = await fetchLocationDetails(
          { lat, lng },
          placeId,
          placesLib,
          geocodingLib,
        );
        if (cancelled) return;
        const busynessData = await fetchBusynessData(lat, lng, backendFetch);
        if (cancelled) return;
        onSelectionChange({
          status: "ready",
          location: {
            ...location,
            source: "map",
            ...busynessData,
          },
        });
      } catch {
        if (cancelled) return;
        if (pendingSelection.kind === "attraction") {
          onSelectionChange({
            status: "error",
            message: "Could not load attraction details.",
            lat: pendingSelection.attraction.lat,
            lng: pendingSelection.attraction.lng,
          });
          return;
        }
        onSelectionChange({
          status: "error",
          message: "Could not load location details.",
          lat: pendingSelection.lat,
          lng: pendingSelection.lng,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    pendingSelection,
    placesLib,
    geocodingLib,
    onSelectionChange,
    backendFetch,
  ]);

  return (
    <Map
      defaultCenter={{ lat: 40.7831, lng: -73.9712 }}
      defaultZoom={12}
      style={{ width: "100%", height: "100%" }}
      clickableIcons={false}
      onClick={handleClick}
      onDragstart={onMapDragStart}
    >
      {attractions.map((attraction) => (
        <AttractionMarker
          key={attraction.id}
          attraction={attraction}
          onSelect={handleAttractionClick}
        />
      ))}
      {userPosition ? <UserMarker position={userPosition} /> : null}
      <MyLocationControl onLocate={handleLocate} />
    </Map>
  );
}

export default function MapView(props: MapViewProps) {
  if (!API_KEY) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-white/50">
        Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      </p>
    );
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <MapContent {...props} />
    </APIProvider>
  );
}
