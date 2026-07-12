export const CROWD_LEVELS = [
  "very_quiet",
  "quiet",
  "moderate",
  "busy",
  "very_busy",
] as const;

export type CrowdLevel = (typeof CROWD_LEVELS)[number];

export type CrowdLevelMeta = {
  label: string;
  badgeClassName: string;
  markerColor: string;
};

const CROWD_LEVEL_META: Record<CrowdLevel, CrowdLevelMeta> = {
  very_quiet: {
    label: "Very quiet",
    badgeClassName: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    markerColor: "#34d399",
  },
  quiet: {
    label: "Quiet",
    badgeClassName: "border-lime-400/30 bg-lime-400/10 text-lime-300",
    markerColor: "#a3e635",
  },
  moderate: {
    label: "Moderate",
    badgeClassName: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
    markerColor: "#facc15",
  },
  busy: {
    label: "Busy",
    badgeClassName: "border-orange-400/30 bg-orange-400/10 text-orange-300",
    markerColor: "#fb923c",
  },
  very_busy: {
    label: "Very busy",
    badgeClassName: "border-red-400/30 bg-red-400/10 text-red-300",
    markerColor: "#f87171",
  },
};

function isCrowdLevel(value: string): value is CrowdLevel {
  return (CROWD_LEVELS as readonly string[]).includes(value);
}

/** Meta for a crowd level string from the database; null when unknown. */
export function crowdLevelMeta(
  level: string | null | undefined,
): CrowdLevelMeta | null {
  if (!level || !isCrowdLevel(level)) {
    return null;
  }
  return CROWD_LEVEL_META[level];
}
