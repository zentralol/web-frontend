export function formatBusynessLevel(level: string): string {
  return level.replaceAll("_", " ");
}

export function busynessScoreBarClass(score: number): string {
  if (score >= 80) {
    return "bg-red-400/80";
  }
  if (score >= 60) {
    return "bg-white/25";
  }
  if (score >= 40) {
    return "bg-accent/60";
  }
  return "bg-white/10";
}

export function busynessLevelBadgeClass(level: string): string {
  switch (level) {
    case "very_busy":
      return "bg-red-400/10 text-red-300";
    case "busy":
      return "bg-orange-400/10 text-orange-300";
    case "moderate":
      return "bg-accent/10 text-accent";
    case "quiet":
      return "bg-emerald-400/10 text-emerald-300";
    case "very_quiet":
      return "bg-white/5 text-white/50";
    default:
      return "bg-white/5 text-white/50";
  }
}
