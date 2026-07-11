"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Attraction } from "@/lib/attractions/types";

type FitAttractionBoundsProps = {
  attractions: Attraction[];
  enabled?: boolean;
};

export default function FitAttractionBounds({
  attractions,
  enabled = true,
}: FitAttractionBoundsProps) {
  const map = useMap();
  const hasFitRef = useRef(false);

  useEffect(() => {
    if (!map || !enabled || attractions.length === 0 || hasFitRef.current) {
      return;
    }

    hasFitRef.current = true;

    if (attractions.length === 1) {
      const only = attractions[0];
      map.setCenter({ lat: only.lat, lng: only.lng });
      map.setZoom(14);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const attraction of attractions) {
      bounds.extend({ lat: attraction.lat, lng: attraction.lng });
    }
    map.fitBounds(bounds, 64);
  }, [map, attractions, enabled]);

  return null;
}
