const NEW_YORK_TIME_ZONE = "America/New_York";

/**
 * Format a Date as naive ISO 8601 wall-clock time in America/New_York.
 * API requests use this format without a timezone offset.
 */
export function formatInNewYork(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: NEW_YORK_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  const hour = parts.find((part) => part.type === "hour")?.value;
  const minute = parts.find((part) => part.type === "minute")?.value;
  const second = parts.find((part) => part.type === "second")?.value;

  if (!year || !month || !day || !hour || !minute || !second) {
    throw new Error("Failed to format time in America/New_York");
  }

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}

/** Advance a Date by the given number of hours (UTC-safe duration math). */
export function addHoursInNewYork(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}
