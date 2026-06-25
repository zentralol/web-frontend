import type {
  ComputeRoutesError,
  ComputeRoutesResponse,
  RouteLocation,
  RouteOption,
} from "./types";

export class RouteFetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RouteFetchError";
    this.status = status;
  }
}

export async function fetchRouteOptions(
  origin: RouteLocation,
  destination: RouteLocation,
): Promise<RouteOption[]> {
  const response = await fetch("/api/routes/compute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ origin, destination }),
  });

  const data = (await response.json()) as
    | ComputeRoutesResponse
    | ComputeRoutesError;

  if (!response.ok) {
    const message =
      "error" in data ? data.error : "Failed to compute routes";
    throw new RouteFetchError(message, response.status);
  }

  if (!("routes" in data)) {
    throw new RouteFetchError("Invalid route response", response.status);
  }

  return data.routes;
}
