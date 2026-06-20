"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import MapView from "@/components/map/MapView";
import LocationPanel from "@/components/map/LocationPanel";
import type { LocationSelectionState } from "@/lib/map/types";

const DRAG_THRESHOLD_PX = 5;

type PointerSession = {
  pointerId: number;
  startX: number;
  startY: number;
  dragged: boolean;
};

export default function MapWorkspace() {
  const [selection, setSelection] = useState<LocationSelectionState>({
    status: "idle",
  });
  const lastStableSelectionRef = useRef<LocationSelectionState>({
    status: "idle",
  });
  const activeSessionRef = useRef<PointerSession | null>(null);

  useEffect(() => {
    if (selection.status !== "loading") {
      lastStableSelectionRef.current = selection;
    }
  }, [selection]);

  const showLoadingSkeleton = useCallback(() => {
    flushSync(() => {
      setSelection({ status: "loading", lat: 0, lng: 0 });
    });
  }, []);

  const handleLoadingStart = useCallback((lat: number, lng: number) => {
    flushSync(() => {
      setSelection({ status: "loading", lat, lng });
    });
    activeSessionRef.current = null;
  }, []);

  const handleMapPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const session: PointerSession = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        dragged: false,
      };
      activeSessionRef.current = session;

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== session.pointerId) return;
        const dx = ev.clientX - session.startX;
        const dy = ev.clientY - session.startY;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD_PX) {
          session.dragged = true;
        }
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== session.pointerId) return;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (!session.dragged) {
          showLoadingSkeleton();
        } else {
          activeSessionRef.current = null;
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [showLoadingSkeleton],
  );

  const handleMapDragStart = useCallback(() => {
    const session = activeSessionRef.current;
    if (session) {
      session.dragged = true;
    }
  }, []);

  return (
    <div className="flex h-[calc(100vh-var(--header-height))]">
      <div className="min-w-0 flex-1" onPointerDown={handleMapPointerDown}>
        <MapView
          onLoadingStart={handleLoadingStart}
          onMapDragStart={handleMapDragStart}
          onSelectionChange={setSelection}
        />
      </div>
      <LocationPanel selection={selection} />
    </div>
  );
}
