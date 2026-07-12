/** Full datetime: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss (NY local, no offset). */
export const TARGET_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export function isValidTargetTime(value: string): boolean {
  return TARGET_TIME_PATTERN.test(value.trim());
}

/** Normalize to YYYY-MM-DDTHH:mm:ss for storage. */
export function normalizeTargetTime(value: string): string {
  const trimmed = value.trim();
  if (!isValidTargetTime(trimmed)) {
    throw new Error("Invalid target time");
  }
  if (trimmed.length === 16) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

/** Display date + time from stored NY-local ISO, e.g. "Jul 10, 2026 at 4:00 PM". */
export function formatTargetTimeDisplay(iso: string): string {
  const match = iso.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) {
    return "";
  }
  const [, year, month, day, hour, minute] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Convert stored ISO to datetime-local input value (YYYY-MM-DDTHH:mm). */
export function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) {
    return "";
  }
  const match = iso.trim().match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

/** Convert datetime-local input to stored ISO (appends :00 seconds). */
export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return normalizeTargetTime(trimmed);
}
