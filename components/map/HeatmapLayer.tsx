"use client";

import { useEffect, useRef } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import { cellToBoundary } from "h3-js";
import {
  HEATMAP_FILL_OPACITY,
  heatmapFillColor,
} from "@/lib/map/heatmapColors";
import type { HeatmapPoint } from "@/lib/map/fetchHeatmap";

type HeatmapLayerProps = {
  points: HeatmapPoint[];
  visible: boolean;
};

export default function HeatmapLayer({ points, visible }: HeatmapLayerProps) {
  const map = useMap();
  const polygonsRef = useRef<google.maps.Polygon[]>([]);

  useEffect(() => {
    const clearPolygons = () => {
      for (const polygon of polygonsRef.current) {
        polygon.setMap(null);
      }
      polygonsRef.current = [];
    };

    if (!map || !visible || points.length === 0) {
      clearPolygons();
      return;
    }

    clearPolygons();

    const polygons = points.map((point) => {
      const paths = cellToBoundary(point.h3Cell, true).map(([lat, lng]) => ({
        lat,
        lng,
      }));

      return new google.maps.Polygon({
        paths,
        fillColor: heatmapFillColor(point.crowdLevel),
        fillOpacity: HEATMAP_FILL_OPACITY,
        strokeWeight: 0,
        clickable: false,
        zIndex: 1,
        map,
      });
    });

    polygonsRef.current = polygons;

    return () => {
      clearPolygons();
    };
  }, [map, points, visible]);

  return null;
}
