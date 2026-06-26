import { describe, expect, test } from "vitest";
import {
  getOptimisticActiveHref,
  isActiveRoute,
  isPlainLeftClick,
} from "./navigation";

describe("isActiveRoute", () => {
  test("returns true for exact match", () => {
    expect(isActiveRoute("/map", "/map")).toBe(true);
  });

  test("returns true for nested route", () => {
    expect(isActiveRoute("/assistant/123", "/assistant")).toBe(true);
  });

  test("returns false for different route", () => {
    expect(isActiveRoute("/routes", "/map")).toBe(false);
  });

  test("returns false when href is a prefix of unrelated path", () => {
    expect(isActiveRoute("/mapbox", "/map")).toBe(false);
  });
});

describe("getOptimisticActiveHref", () => {
  test("prefers pendingHref over pathname", () => {
    expect(getOptimisticActiveHref("/routes", "/map", "/routes")).toBe(true);
    expect(getOptimisticActiveHref("/routes", "/map", "/map")).toBe(false);
  });

  test("falls back to isActiveRoute when no pendingHref", () => {
    expect(getOptimisticActiveHref(null, "/assistant/123", "/assistant")).toBe(
      true,
    );
    expect(getOptimisticActiveHref(null, "/map", "/routes")).toBe(false);
  });
});

describe("isPlainLeftClick", () => {
  function createMouseEvent(
    init: Partial<Pick<MouseEvent, "button" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">> = {},
  ) {
    return {
      button: 0,
      ctrlKey: false,
      metaKey: false,
      altKey: false,
      shiftKey: false,
      ...init,
    };
  }

  test("returns true for plain left click", () => {
    expect(isPlainLeftClick(createMouseEvent())).toBe(true);
  });

  test("returns false for non-left button", () => {
    expect(isPlainLeftClick(createMouseEvent({ button: 1 }))).toBe(false);
  });

  test("returns false for modifier clicks", () => {
    expect(isPlainLeftClick(createMouseEvent({ ctrlKey: true }))).toBe(false);
    expect(isPlainLeftClick(createMouseEvent({ metaKey: true }))).toBe(false);
    expect(isPlainLeftClick(createMouseEvent({ altKey: true }))).toBe(false);
    expect(isPlainLeftClick(createMouseEvent({ shiftKey: true }))).toBe(false);
  });
});
