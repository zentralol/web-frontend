function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function addHoursNaive(iso: string, hours: number): string {
  const match = iso.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) {
    const date = new Date();
    date.setHours(date.getHours() + hours, 0, 0, 0);
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00:00`;
  }

  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    0,
    0,
  );
  date.setHours(date.getHours() + hours);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00:00`;
}

function scoreForHour(hour: number): { score: number; level: string } {
  if (hour >= 11 && hour <= 14) return { score: 78, level: "busy" };
  if (hour >= 17 && hour <= 20) return { score: 85, level: "very_busy" };
  if (hour >= 7 && hour <= 9) return { score: 55, level: "moderate" };
  if (hour >= 22 || hour <= 5) return { score: 22, level: "very_quiet" };
  return { score: 40, level: "quiet" };
}

export function demoCurrentPredictionResponse(targetTime?: string) {
  const hour = targetTime
    ? Number(targetTime.slice(11, 13))
    : new Date().getHours();
  const { score, level } = scoreForHour(Number.isFinite(hour) ? hour : 12);

  return {
    success: true,
    data: {
      prediction: {
        busynessScore: score,
        busynessLevel: level,
        period: "hour",
        confidence: 0.91,
      },
    },
  };
}

export function demoForecastResponse(startTime: string, hours = 6) {
  // Future hourly buckets only. Activity prepends a live "now" point, and the
  // map shows current busyness separately — starting at +0h duplicated the
  // current hour label (e.g. two "7 AM" bars).
  const forecast = Array.from({ length: hours }, (_, index) => {
    const timestamp = addHoursNaive(startTime, index + 1);
    const hour = Number(timestamp.slice(11, 13));
    const { score, level } = scoreForHour(hour);
    return {
      timestamp,
      busynessScore: score,
      busynessLevel: level,
    };
  });

  return {
    success: true,
    data: { forecast },
  };
}
