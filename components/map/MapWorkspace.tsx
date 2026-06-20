"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import MapView from "@/components/map/MapView";
import LocationPanel from "@/components/map/LocationPanel";
import type { LocationSelectionState } from "@/lib/map/types";

export default function MapWorkspace() {
  const [selection, setSelection] = useState<LocationSelectionState>({
    status: "idle",
  });
  const lastStableSelectionRef = useRef<LocationSelectionState>({
    status: "idle",
  });

  useEffect(() => {
    if (selection.status !== "loading") {
      lastStableSelectionRef.current = selection;
    }
  }, [selection]);

  const handleMapInteractionStart = useCallback(() => {
    flushSync(() => {
      setSelection({ status: "loading", lat: 0, lng: 0 });
    });
  }, []);

  const handleLoadingStart = useCallback((lat: number, lng: number) => {
    flushSync(() => {
      setSelection({ status: "loading", lat, lng });
    });
  }, []);

  const handleInteractionCancel = useCallback(() => {
    flushSync(() => {
      setSelection(lastStableSelectionRef.current);
    });
  }, []);

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <div
        className="min-w-0 flex-1"
        onPointerDown={handleMapInteractionStart}
      >
        <MapView
          onLoadingStart={handleLoadingStart}
          onInteractionCancel={handleInteractionCancel}
          onSelectionChange={setSelection}
        />
      </div>
      <LocationPanel selection={selection} />
    </div>
  );
}
