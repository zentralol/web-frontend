import { describe, expect, test } from "vitest";
import {
  findLatestJobAnchor,
  parseNaiveIsoMs,
  resolveHeatmapTargetTime,
} from "./heatmapTargetTimeResolve";

describe("heatmapTargetTimeResolve", () => {
  const distinct = [
    "2026-07-14T11:44:09",
    "2026-07-14T12:44:09",
    "2026-07-14T13:44:09",
    "2026-07-14T14:44:09",
    "2026-07-14T15:44:09",
    "2026-07-14T16:44:09",
    "2026-07-14T17:44:09",
    "2026-07-14T18:44:09",
    "2026-07-14T19:44:09",
  ];

  test("findLatestJobAnchor picks the newest full nine-bucket run", () => {
    expect(findLatestJobAnchor(distinct)).toBe("2026-07-14T11:44:09");
  });

  test("resolveHeatmapTargetTime maps live Now requests onto the nearest stored bucket", () => {
    expect(resolveHeatmapTargetTime("2026-07-14T12:52:39", distinct)).toBe(
      "2026-07-14T12:44:09",
    );
  });

  test("resolveHeatmapTargetTime maps future-hour requests onto the matching bucket", () => {
    expect(resolveHeatmapTargetTime("2026-07-14T14:52:39", distinct)).toBe(
      "2026-07-14T14:44:09",
    );
  });

  test("parseNaiveIsoMs treats values as wall-clock components", () => {
    expect(parseNaiveIsoMs("2026-07-14T12:44:09")).toBe(
      Date.UTC(2026, 6, 14, 12, 44, 9),
    );
  });
});
