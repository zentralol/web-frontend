import { DEMO_ATTRACTIONS } from "./fixtures/attractions";
import { demoHeatmapResponse } from "./fixtures/heatmap";
import { DEMO_ROUTES_RESPONSE } from "./fixtures/routes";

export function demoAttractionsJsonResponse(): Response {
  return Response.json({ attractions: DEMO_ATTRACTIONS });
}

export function demoHeatmapJsonResponse(targetTime: string): Response {
  return Response.json(demoHeatmapResponse(targetTime));
}

export function demoRoutesJsonResponse(): Response {
  return Response.json(DEMO_ROUTES_RESPONSE);
}
