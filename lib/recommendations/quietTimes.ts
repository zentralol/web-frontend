import type { QuietTime } from "./types";

/** Contract boundary: 0-20 is very quiet and 21-40 is quiet. */
export const QUIET_TIME_MAX_BUSYNESS_SCORE = 40;

export function isQuietTime(quietTime: QuietTime): boolean {
  return quietTime.busynessScore <= QUIET_TIME_MAX_BUSYNESS_SCORE;
}
