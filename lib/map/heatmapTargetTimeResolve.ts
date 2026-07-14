const ONE_HOUR_MS = 60 * 60 * 1000;
const BUCKET_TOLERANCE_MS = 5 * 60 * 1000;

export function parseNaiveIsoMs(value: string): number {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute, second] = timePart.split(":").map(Number);
  return Date.UTC(year, month - 1, day, hour, minute, second);
}

export function findLatestJobAnchor(distinctTargetTimes: string[]): string | null {
  const sorted = [...distinctTargetTimes].sort(
    (left, right) => parseNaiveIsoMs(left) - parseNaiveIsoMs(right),
  );

  let bestAnchor: string | null = null;
  let bestAnchorMs = Number.NEGATIVE_INFINITY;

  for (const candidate of sorted) {
    const anchorMs = parseNaiveIsoMs(candidate);
    let hasFullHorizon = true;

    for (let hoursAhead = 1; hoursAhead <= 8; hoursAhead += 1) {
      const expectedMs = anchorMs + hoursAhead * ONE_HOUR_MS;
      const found = sorted.some(
        (value) =>
          Math.abs(parseNaiveIsoMs(value) - expectedMs) <= BUCKET_TOLERANCE_MS,
      );
      if (!found) {
        hasFullHorizon = false;
        break;
      }
    }

    if (hasFullHorizon && anchorMs > bestAnchorMs) {
      bestAnchorMs = anchorMs;
      bestAnchor = candidate;
    }
  }

  return bestAnchor;
}

function pickNearestStoredTime(
  expectedMs: number,
  distinctTargetTimes: string[],
): string {
  return distinctTargetTimes.reduce((best, candidate) => {
    const candidateDiff = Math.abs(parseNaiveIsoMs(candidate) - expectedMs);
    const bestDiff = Math.abs(parseNaiveIsoMs(best) - expectedMs);
    return candidateDiff < bestDiff ? candidate : best;
  });
}

export function resolveHeatmapTargetTime(
  requestedTargetTime: string,
  distinctTargetTimes: string[],
): string | null {
  if (distinctTargetTimes.length === 0) {
    return null;
  }

  const anchor = findLatestJobAnchor(distinctTargetTimes);
  if (!anchor) {
    return pickNearestStoredTime(
      parseNaiveIsoMs(requestedTargetTime),
      distinctTargetTimes,
    );
  }

  const anchorMs = parseNaiveIsoMs(anchor);
  const requestedMs = parseNaiveIsoMs(requestedTargetTime);
  const bucketIndex = Math.min(
    8,
    Math.max(0, Math.round((requestedMs - anchorMs) / ONE_HOUR_MS)),
  );
  const expectedMs = anchorMs + bucketIndex * ONE_HOUR_MS;

  return pickNearestStoredTime(expectedMs, distinctTargetTimes);
}
