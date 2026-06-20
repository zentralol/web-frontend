"use client";

import { useCallback, useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { fetchLocationDetails } from "@/lib/map/fetchLocationDetails";
import type { LocationSelectionState } from "@/lib/map/types";

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

type PendingClick = {
  lat: number;
  lng: number;
  placeId?: string | null;
};

type MapViewProps = {
  onLoadingStart: (lat: number, lng: number) => void;
  onMapDragStart: () => void;
  onSelectionChange: (selection: LocationSelectionState) => void;
};

function MapContent({
  onLoadingStart,
  onMapDragStart,
  onSelectionChange,
}: MapViewProps) {
  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");
  const [pendingClick, setPendingClick] = useState<PendingClick | null>(null);

  const handleClick = useCallback(
    (ev: MapMouseEvent) => {
      const { latLng, placeId } = ev.detail;
      if (!latLng) return;

      if (placeId) {
        ev.stop();
      }

      onLoadingStart(latLng.lat, latLng.lng);
      setPendingClick({
        lat: latLng.lat,
        lng: latLng.lng,
        placeId,
      });
    },
    [onLoadingStart],
  );

  useEffect(() => {
    if (!pendingClick) return;

    const { lat, lng, placeId } = pendingClick;
    let cancelled = false;

    (async () => {
      try {
        const location = await fetchLocationDetails(
          { lat, lng },
          placeId,
          placesLib,
          geocodingLib,
        );
        if (cancelled) return;
        onSelectionChange({ status: "ready", location });
      } catch {
        if (cancelled) return;
        onSelectionChange({
          status: "error",
          message: "Could not load location details.",
          lat,
          lng,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingClick, placesLib, geocodingLib, onSelectionChange]);

  return (
    <Map
      defaultCenter={{ lat: 40.7831, lng: -73.9712 }}
      defaultZoom={12}
      style={{ width: "100%", height: "100%" }}
      onClick={handleClick}
      onDragstart={onMapDragStart}
    />
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
