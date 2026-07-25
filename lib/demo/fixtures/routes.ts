import type { ComputeRoutesResponse, RouteOption } from "@/lib/routes/types";
import snapshot from "./routes.json";

type RoutesSnapshot = {
  routes: RouteOption[];
};

/**
 * Real Google Routes API snapshot for High Line → Washington Square Park
 * (walk / transit / bicycle), captured for offline demo mode.
 */
export const DEMO_ROUTES_RESPONSE: ComputeRoutesResponse = {
  routes: (snapshot as RoutesSnapshot).routes,
};

export const DEMO_HIGH_LINE_TO_WSP_POLYLINE =
  DEMO_ROUTES_RESPONSE.routes.find((route) => route.id === "walk")
    ?.encodedPolyline ?? "";
