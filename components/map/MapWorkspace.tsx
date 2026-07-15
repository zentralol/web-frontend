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
import { fetchHeatmap, type HeatmapPoint } from "@/lib/map/fetchHeatmap";
import { fetchQuieterAreas } from "@/lib/recommendations/fetchRecommendations";
import type { QuieterAreaRecommendation } from "@/lib/recommendations/types";
import { useAuthenticatedBackendFetch } from "@/lib/backend/useAuthenticatedBackendFetch";
import {
  HEATMAP_OPTIONS_REFRESH_MS,
  useLiveHeatmapTimeOptions,
} from "@/lib/map/useLiveHeatmapTimeOptions";
import { buildHeatmapTimeOptions } from "@/lib/map/heatmapTimeOptions";
import {
  readHeatmapEnabled,
  writeHeatmapEnabled,
} from "@/lib/map/heatmapPreferences";
import type { TravelInterest } from "@/lib/onboarding/types";
import type { LocationSelectionState } from "@/lib/map/types";
import { formatInNewYork } from "@/lib/time/manhattanTime";

const DRAG_THRESHOLD_PX = 5;
const HEATMAP_FETCH_DEBOUNCE_MS = 300;

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
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [selectedHeatmapTimeId, setSelectedHeatmapTimeId] = useState("now");
  const [heatmapTargetTime, setHeatmapTargetTime] = useState(() =>
    formatInNewYork(new Date()),
  );
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [quietAreas, setQuietAreas] = useState<QuieterAreaRecommendation[]>([]);
  const [quietAreasLoading, setQuietAreasLoading] = useState(false);
  const [quietAreasError, setQuietAreasError] = useState<string | null>(null);
  const [locatingQuietAreas, setLocatingQuietAreas] = useState(false);
  const backendFetch = useAuthenticatedBackendFetch();
  const {
    options: heatmapTimeOptions,
    refreshOptions: refreshHeatmapTimeOptions,
  } = useLiveHeatmapTimeOptions(heatmapEnabled);
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
    const frame = requestAnimationFrame(() => {
      const enabled = readHeatmapEnabled();
      setHeatmapEnabled(enabled);
      if (enabled) {
        setHeatmapTargetTime(formatInNewYork(new Date()));
      }
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!heatmapEnabled || selectedHeatmapTimeId !== "now") {
      return;
    }

    const intervalId = window.setInterval(() => {
      setHeatmapTargetTime(formatInNewYork(new Date()));
    }, HEATMAP_OPTIONS_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [heatmapEnabled, selectedHeatmapTimeId]);

  useEffect(() => {
    if (!heatmapEnabled) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setHeatmapLoading(true);
      setHeatmapError(null);

      void (async () => {
        try {
          const data = await fetchHeatmap(heatmapTargetTime);
          if (cancelled) return;
          setHeatmapPoints(data.points);
        } catch (error) {
          if (cancelled) return;
          setHeatmapPoints([]);
          setHeatmapError(
            error instanceof Error
              ? error.message
              : "Could not load crowd heatmap.",
          );
        } finally {
          if (!cancelled) {
            setHeatmapLoading(false);
          }
        }
      })();
    }, HEATMAP_FETCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [heatmapEnabled, heatmapTargetTime]);

  useEffect(() => {
    if (sortMode !== "quiet_areas" || !userCoords) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setQuietAreasLoading(true);
      setQuietAreasError(null);

      void (async () => {
        try {
          const targetTime = heatmapEnabled
            ? heatmapTargetTime
            : formatInNewYork(new Date());
          const result = await fetchQuieterAreas(
            {
              lat: userCoords.lat,
              lng: userCoords.lng,
              targetTime,
              limit: 10,
            },
            backendFetch,
          );
          if (cancelled) return;
          if (result.ok) {
            setQuietAreas(result.data.recommendations);
          } else {
            setQuietAreas([]);
            setQuietAreasError(result.error);
          }
        } catch (error) {
          if (cancelled) return;
          setQuietAreas([]);
          setQuietAreasError(
            error instanceof Error
              ? error.message
              : "Could not load quieter areas.",
          );
        } finally {
          if (!cancelled) {
            setQuietAreasLoading(false);
          }
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [sortMode, userCoords, heatmapEnabled, heatmapTargetTime, backendFetch]);

  const handleHeatmapToggle = useCallback(() => {
    const next = !heatmapEnabled;
    setHeatmapEnabled(next);
    if (!next) {
      setHeatmapLoading(false);
    } else {
      const options = buildHeatmapTimeOptions();
      const selected = options.find((option) => option.id === selectedHeatmapTimeId);
      if (selected) {
        setHeatmapTargetTime(selected.targetTime);
      }
    }
    writeHeatmapEnabled(next);
  }, [heatmapEnabled, selectedHeatmapTimeId]);

  const handleHeatmapTimeChange = useCallback(
    (optionId: string) => {
      setSelectedHeatmapTimeId(optionId);
      const selected = heatmapTimeOptions.find((option) => option.id === optionId);
      if (selected) {
        setHeatmapTargetTime(selected.targetTime);
      }
    },
    [heatmapTimeOptions],
  );

  const handleHeatmapTimeSelectFocus = useCallback(() => {
    refreshHeatmapTimeOptions();
  }, [refreshHeatmapTimeOptions]);

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

  const handleQuietAreas = useCallback(async () => {
    if (sortMode === "quiet_areas") {
      return;
    }
    setQuietAreasError(null);
    if (userCoords) {
      setSortMode("quiet_areas");
      setQuietAreas([]);
      setQuietAreasLoading(true);
      return;
    }
    setLocatingQuietAreas(true);
    try {
      const coords = await requestCurrentPosition();
      setUserCoords(coords);
      setSortMode("quiet_areas");
      setQuietAreas([]);
      setQuietAreasLoading(true);
    } catch {
      setQuietAreasError(
        "Couldn't get your location. Check location permissions.",
      );
    } finally {
      setLocatingQuietAreas(false);
    }
  }, [sortMode, userCoords]);

  const handleSelectQuietArea = useCallback(
    (area: QuieterAreaRecommendation) => {
      setHighlightedId(null);
      setFocusTarget({
        lat: area.coordinates.lat,
        lng: area.coordinates.lng,
      });
      setSelection({
        status: "ready",
        location: {
          lat: area.coordinates.lat,
          lng: area.coordinates.lng,
          source: "map",
          busyness: {
            score: area.busynessScore,
            level: area.busynessLevel,
            period: area.period,
          },
        },
      });
    },
    [],
  );

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
    quietAreas,
    quietAreasLoading,
    quietAreasError,
    locatingQuietAreas,
    userCoords,
    onSearchChange: setSearchQuery,
    onCategoryChange: setCategoryFilter,
    onSortModeChange: setSortMode,
    onNearMe: handleNearMe,
    onQuietAreas: handleQuietAreas,
    onSelect: handleSelectAttraction,
    onSelectQuietArea: handleSelectQuietArea,
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
          heatmapEnabled={heatmapEnabled}
          heatmapLoading={heatmapLoading}
          heatmapError={heatmapError}
          heatmapPoints={heatmapPoints}
          selectedHeatmapTimeId={selectedHeatmapTimeId}
          heatmapTimeOptions={heatmapTimeOptions}
          onHeatmapToggle={handleHeatmapToggle}
          onHeatmapTimeChange={handleHeatmapTimeChange}
          onHeatmapTimeSelectFocus={handleHeatmapTimeSelectFocus}
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
