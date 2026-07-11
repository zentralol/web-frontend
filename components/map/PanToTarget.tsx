"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";

type PanToTargetProps = {
  target: { lat: number; lng: number } | null;
  onComplete?: () => void;
};

export default function PanToTarget({ target, onComplete }: PanToTargetProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) {
      return;
    }

    map.panTo(target);
    const currentZoom = map.getZoom() ?? 12;
    if (currentZoom < 14) {
      map.setZoom(14);
    }
    onComplete?.();
  }, [map, target, onComplete]);

  return null;
}
