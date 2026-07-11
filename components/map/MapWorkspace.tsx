"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "next/navigation";
import AttractionBrowseBottomSheet from "@/components/map/AttractionBrowseBottomSheet";
import type { AttractionsLoadState } from "@/components/map/AttractionBrowsePanel";
import MapView from "@/components/map/MapView";
import LocationPanel from "@/components/map/LocationPanel";
import {
  extractCategories,
  filterAttractions,
  type AttractionSortMode,
} from "@/lib/attractions/filterAttractions";
import type { CategoryGroup } from "@/lib/attractions/categoryGroups";
import { fetchAttractions } from "@/lib/attractions/fetchAttractions";
import type { Attraction } from "@/lib/attractions/types";
import { requestCurrentPosition } from "@/lib/geo/requestCurrentPosition";
import type { TravelInterest } from "@/lib/onboarding/types";
import type { LocationSelectionState } from "@/lib/map/types";

const DRAG_THRESHOLD_PX = 5;

type PointerSession = {
  pointerId: number;
  startX: number;
  startY: number;
  dragged: boolean;
};

type MapWorkspaceProps = {
  userInterests?: TravelInterest[];
  initialAttractions?: Attraction[];
  initialLoadState?: AttractionsLoadState;
};

export default function MapWorkspace({
  userInterests = [],
  initialAttractions = [],
  initialLoadState = "ready",
}: MapWorkspaceProps) {
  const searchParams = useSearchParams();
  const [attractions, setAttractions] = useState<Attraction[]>(initialAttractions);
  const [loadState, setLoadState] = useState<AttractionsLoadState>(initialLoadState);
  const [loadError, setLoadError] = useState<string | null>(() =>
    initialLoadState === "error" ? "Could not load attractions." : null,
  );
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get("q") ?? "",
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryGroup | null>(null);
  const [sortMode, setSortMode] = useState<AttractionSortMode>("recommended");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [nearMeError, setNearMeError] = useState<string | null>(null);
  const [locatingNearMe, setLocatingNearMe] = useState(false);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [focusTarget, setFocusTarget] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [selection, setSelection] = useState<LocationSelectionState>({
    status: "idle",
  });
  const [fitBoundsEnabled, setFitBoundsEnabled] = useState(true);
  const lastStableSelectionRef = useRef<LocationSelectionState>({
    status: "idle",
  });
  const activeSessionRef = useRef<PointerSession | null>(null);
  const selectAttractionRef = useRef<(attraction: Attraction) => void>(() => {});
  const initialIdHandledRef = useRef(false);
  const pendingInitialIdRef = useRef<number | null>(null);
  if (pendingInitialIdRef.current === null) {
    const idParam = searchParams.get("id");
    if (idParam) {
      const id = Number(idParam);
      pendingInitialIdRef.current = Number.isFinite(id) ? id : null;
    }
  }

  const loadAttractions = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);

    try {
      const items = await fetchAttractions();
      if (items.length === 0) {
        setAttractions([]);
        setLoadState("empty");
        return;
      }
      setAttractions(items);
      setLoadState("ready");
    } catch {
      setAttractions([]);
      setLoadState("error");
      setLoadError("Could not load attractions.");
    }
  }, []);

  const categories = useMemo(
    () => extractCategories(attractions),
    [attractions],
  );

  const filteredAttractions = useMemo(
    () =>
      filterAttractions(attractions, {
        query: searchQuery,
        category: categoryFilter,
        sortMode,
        userCoords,
        interests: userInterests,
      }),
    [
      attractions,
      searchQuery,
      categoryFilter,
      sortMode,
      userCoords,
      userInterests,
    ],
  );

  const handleSelectAttraction = useCallback((attraction: Attraction) => {
    setHighlightedId(attraction.id);
    setFocusTarget({ lat: attraction.lat, lng: attraction.lng });
    selectAttractionRef.current(attraction);
  }, []);

  const registerAttractionSelector = useCallback(
    (selector: (attraction: Attraction) => void) => {
      selectAttractionRef.current = selector;

      if (initialIdHandledRef.current || loadState !== "ready") {
        return;
      }

      const pendingId = pendingInitialIdRef.current;
      if (pendingId == null) {
        return;
      }

      const attraction = attractions.find((item) => item.id === pendingId);
      if (!attraction) {
        return;
      }

      initialIdHandledRef.current = true;
      pendingInitialIdRef.current = null;
      setFitBoundsEnabled(false);
      setHighlightedId(attraction.id);
      setFocusTarget({ lat: attraction.lat, lng: attraction.lng });
      selector(attraction);
    },
    [attractions, loadState],
  );

  useEffect(() => {
    if (selection.status !== "loading") {
      lastStableSelectionRef.current = selection;
    }
  }, [selection]);

  useEffect(() => {
    window.dispatchEvent(new Event("resize"));
  }, [selection.status]);

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

  const handleDismiss = useCallback(() => {
    setSelection({ status: "idle" });
    setHighlightedId(null);
  }, []);

  const handleBack = useCallback(() => {
    handleDismiss();
  }, [handleDismiss]);

  const handleNearMe = useCallback(async () => {
    setNearMeError(null);
    setLocatingNearMe(true);
    try {
      const coords = await requestCurrentPosition();
      setUserCoords(coords);
      setSortMode("near_me");
    } catch {
      setNearMeError(
        "Couldn't get your location. Check location permissions.",
      );
    } finally {
      setLocatingNearMe(false);
    }
  }, []);

  const handleAttractionInteract = useCallback((attraction: Attraction) => {
    setHighlightedId(attraction.id);
  }, []);

  const handleFocusComplete = useCallback(() => {
    setFocusTarget(null);
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

  const browsePanelProps = {
    loadState,
    loadError,
    filteredAttractions,
    totalCount: attractions.length,
    categories,
    searchQuery,
    categoryFilter,
    sortMode,
    highlightedId,
    nearMeError,
    userCoords,
    onSearchChange: setSearchQuery,
    onCategoryChange: setCategoryFilter,
    onSortModeChange: setSortMode,
    onNearMe: handleNearMe,
    onSelect: handleSelectAttraction,
    onRetry: loadAttractions,
    locatingNearMe,
  };

  const isDetailActive = selection.status !== "idle";

  return (
    <div className="relative h-[calc(100vh-var(--viewport-top))] lg:flex">
      <div
        className="absolute inset-0 lg:relative lg:min-w-0 lg:flex-1"
        onPointerDown={handleMapPointerDown}
      >
        <MapView
          attractions={attractions}
          highlightedId={highlightedId}
          focusTarget={focusTarget}
          fitBoundsEnabled={fitBoundsEnabled}
          onLoadingStart={handleLoadingStart}
          onMapDragStart={handleMapDragStart}
          onSelectionChange={setSelection}
          onAttractionInteract={handleAttractionInteract}
          onFocusComplete={handleFocusComplete}
          onRegisterAttractionSelector={registerAttractionSelector}
        />
      </div>
      <LocationPanel
        selection={selection}
        onDismiss={handleDismiss}
        onBack={handleBack}
        browsePanelProps={browsePanelProps}
      />
      {!isDetailActive && (
        <AttractionBrowseBottomSheet {...browsePanelProps} />
      )}
    </div>
  );
}
