"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ControlPosition,
  Map,
  MapControl,
  Marker,
  Polyline,
  useMap,
  useMapsLibrary,
  type MapMouseEvent,
} from "@vis.gl/react-google-maps";
import { Crosshair, Minus, Plus } from "lucide-react";
import { fetchLocationDetails } from "@/lib/map/fetchLocationDetails";
import type { RouteLocation } from "@/lib/routes/types";

const ORIGIN_MARKER_COLOR = "#34C759";
const DESTINATION_MARKER_COLOR = "#FF3B30";
const ROUTE_HALO_COLOR = "#ffffff";
const ROUTE_STROKE_COLOR = "#00BFFF";

type PendingClick = {
  lat: number;
  lng: number;
  placeId?: string | null;
};

type RouteMapProps = {
  origin: RouteLocation;
  destination: RouteLocation;
  encodedPolyline: string;
  onMapLocationPick: (location: RouteLocation) => void;
};

function toRouteLocation(
  selected: Awaited<ReturnType<typeof fetchLocationDetails>>,
): RouteLocation {
  const label =
    selected.address ??
    selected.name ??
    `${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}`;

  return {
    lat: selected.lat,
    lng: selected.lng,
    label,
  };
}

function FitBounds({
  encodedPolyline,
  origin,
  destination,
}: {
  encodedPolyline: string;
  origin: RouteLocation;
  destination: RouteLocation;
}) {
  const map = useMap();
  const geometryLib = useMapsLibrary("geometry");

  useEffect(() => {
    if (!map || !geometryLib) return;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: origin.lat, lng: origin.lng });
    bounds.extend({ lat: destination.lat, lng: destination.lng });

    if (encodedPolyline) {
      const path = geometryLib.encoding.decodePath(encodedPolyline);
      path.forEach((point) => bounds.extend(point));
    }

    map.fitBounds(bounds, 64);
  }, [map, geometryLib, encodedPolyline, origin, destination]);

  return null;
}

function MapZoomControls() {
  const map = useMap();

  if (!map) return null;

  return (
    <MapControl position={ControlPosition.TOP_RIGHT}>
      <div className="mr-3 mt-3 flex flex-col overflow-hidden rounded-lg border border-white/10 bg-surface/90 shadow-lg">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={() => map.setZoom((map.getZoom() ?? 13) + 1)}
          className="flex h-9 w-9 items-center justify-center text-white/70 transition-colors hover:bg-white/5 hover:text-accent"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => map.setZoom((map.getZoom() ?? 13) - 1)}
          className="flex h-9 w-9 items-center justify-center border-t border-white/10 text-white/70 transition-colors hover:bg-white/5 hover:text-accent"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Recenter route"
          onClick={() => {
            map.panTo(map.getCenter()!);
          }}
          className="flex h-9 w-9 items-center justify-center border-t border-white/10 text-white/70 transition-colors hover:bg-white/5 hover:text-accent"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>
    </MapControl>
  );
}

function LocationMarker({
  location,
  letter,
  color,
}: {
  location: RouteLocation;
  letter: string;
  color: string;
}) {
  const position = { lat: location.lat, lng: location.lng };

  return (
    <Marker
      position={position}
      zIndex={letter === "A" ? 2 : 1}
      label={{
        text: letter,
        color: "#ffffff",
        fontWeight: "bold",
        fontSize: "14px",
      }}
      icon={{
        path: google.maps.SymbolPath.CIRCLE,
        scale: 18,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      }}
    />
  );
}

function MapContent({
  origin,
  destination,
  encodedPolyline,
  onMapLocationPick,
}: RouteMapProps) {
  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");
  const [pendingClick, setPendingClick] = useState<PendingClick | null>(null);
  const onMapLocationPickRef = useRef(onMapLocationPick);

  useEffect(() => {
    onMapLocationPickRef.current = onMapLocationPick;
  }, [onMapLocationPick]);

  const handleClick = useCallback((ev: MapMouseEvent) => {
    const { latLng, placeId } = ev.detail;
    if (!latLng) return;

    if (placeId) {
      ev.stop();
    }

    setPendingClick({
      lat: latLng.lat,
      lng: latLng.lng,
      placeId,
    });
  }, []);

  useEffect(() => {
    if (!pendingClick) return;

    const { lat, lng, placeId } = pendingClick;
    let cancelled = false;

    (async () => {
      try {
        const selected = await fetchLocationDetails(
          { lat, lng },
          placeId,
          placesLib,
          geocodingLib,
        );
        if (cancelled) return;
        onMapLocationPickRef.current(toRouteLocation(selected));
      } catch {
        // Ignore geocode failures; user can retry or use autocomplete.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pendingClick, placesLib, geocodingLib]);

  const center = {
    lat: (origin.lat + destination.lat) / 2,
    lng: (origin.lng + destination.lng) / 2,
  };

  return (
    <Map
      defaultCenter={center}
      defaultZoom={13}
      gestureHandling="greedy"
      disableDefaultUI
      clickableIcons={false}
      onClick={handleClick}
      style={{ width: "100%", height: "100%" }}
    >
      <FitBounds
        encodedPolyline={encodedPolyline}
        origin={origin}
        destination={destination}
      />
      {encodedPolyline ? (
        <>
          <Polyline
            encodedPath={encodedPolyline}
            strokeColor={ROUTE_HALO_COLOR}
            strokeWeight={10}
            strokeOpacity={0.9}
          />
          <Polyline
            encodedPath={encodedPolyline}
            strokeColor={ROUTE_STROKE_COLOR}
            strokeWeight={6}
            strokeOpacity={1}
          />
        </>
      ) : null}
      <LocationMarker
        location={origin}
        letter="A"
        color={ORIGIN_MARKER_COLOR}
      />
      <LocationMarker
        location={destination}
        letter="B"
        color={DESTINATION_MARKER_COLOR}
      />
      <MapZoomControls />
    </Map>
  );
}

export default function RouteMap({
  origin,
  destination,
  encodedPolyline,
  onMapLocationPick,
}: RouteMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContent
        origin={origin}
        destination={destination}
        encodedPolyline={encodedPolyline}
        onMapLocationPick={onMapLocationPick}
      />
    </div>
  );
}
