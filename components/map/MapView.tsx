"use client";

import { useCallback, useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { fetchAttractions } from "@/lib/attractions/fetchAttractions";
import type { Attraction } from "@/lib/attractions/types";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import { fetchLocationDetails } from "@/lib/map/fetchLocationDetails";
import { fetchBusynessData } from "@/lib/map/fetchPredictions";
import type { LocationSelectionState } from "@/lib/map/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const ATTRACTION_MARKER_COLOR = "#00BFFF";

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
