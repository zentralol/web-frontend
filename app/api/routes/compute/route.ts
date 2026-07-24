import { computeAllModeRoutes } from "@/lib/routes/googleRoutes";
import type {
  ComputeRoutesResponse,
  RouteLocation,
} from "@/lib/routes/types";
import { demoRoutesJsonResponse } from "@/lib/demo/handlers";
import { isDemoModeFromCookie } from "@/lib/demo/mode";
import { NextResponse } from "next/server";

function isValidLocation(value: unknown): value is RouteLocation {
  if (!value || typeof value !== "object") return false;
  const loc = value as RouteLocation;
  return (
    typeof loc.lat === "number" &&
    typeof loc.lng === "number" &&
    typeof loc.label === "string" &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lng) &&
    loc.lat >= -90 &&
    loc.lat <= 90 &&
    loc.lng >= -180 &&
    loc.lng <= 180
  );
}

function locationsAreSame(a: RouteLocation, b: RouteLocation): boolean {
  return a.lat === b.lat && a.lng === b.lng;
}

export async function POST(request: Request) {
  let body: { origin?: unknown; destination?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { origin, destination } = body;

  if (!isValidLocation(origin) || !isValidLocation(destination)) {
    return NextResponse.json(
      { error: "origin and destination must include lat, lng, and label" },
      { status: 400 },
    );
  }

  if (locationsAreSame(origin, destination)) {
    return NextResponse.json(
      { error: "Origin and destination must differ" },
      { status: 400 },
    );
  }

  if (isDemoModeFromCookie(request.headers.get("cookie"))) {
    return demoRoutesJsonResponse();
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" },
      { status: 500 },
    );
  }

  try {
    const routes = await computeAllModeRoutes(origin, destination, apiKey);

    const payload: ComputeRoutesResponse = { routes };
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to compute routes";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
