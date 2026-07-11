type RouteDestination = {
  lat: number;
  lng: number;
  name: string;
};

/** Deep-link to the route planner with this place preset as the destination. */
export function buildRoutesHref(item: RouteDestination): string {
  const params = new URLSearchParams({
    destLat: String(item.lat),
    destLng: String(item.lng),
    destLabel: item.name,
  });
  return `/routes?${params.toString()}`;
}
