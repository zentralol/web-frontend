const METERS_PER_KILOMETER = 1000;

export function formatCoordinate(value: number): string {
  return value.toFixed(5);
}

export function formatDistanceKm(km: number): string {
  if (km < 1) {
    return `${Math.round(km * METERS_PER_KILOMETER)} m`;
  }
  return `${km.toFixed(1)} km`;
}
