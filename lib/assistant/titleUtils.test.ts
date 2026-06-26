import { describe, expect, it } from "vitest";
import {
  limitWordCount,
  titleFromUserMessage,
  truncateToLastCompleteWord,
} from "./titleUtils";

describe("limitWordCount", () => {
  it("returns text unchanged when word count is within limit", () => {
    expect(limitWordCount("Plan a trip", 6)).toBe("Plan a trip");
  });

  it("truncates to maxWords when exceeded", () => {
    expect(limitWordCount("one two three four five six seven", 6)).toBe(
      "one two three four five six",
    );
  });

  it("preserves original whitespace when word count is within limit", () => {
    expect(limitWordCount("  one   two  three  ", 6)).toBe("  one   two  three  ");
  });

  it("returns empty string for empty input", () => {
    expect(limitWordCount("", 6)).toBe("");
  });
});

describe("truncateToLastCompleteWord", () => {
  it("returns text unchanged when within limit", () => {
    expect(truncateToLastCompleteWord("Short title", 50)).toBe("Short title");
  });

  it("truncates at the last complete word when the text exceeds the limit", () => {
    const text = "Transportation recommendations around magnificent historical districts";
    const result = truncateToLastCompleteWord(text, 35);
    expect(result.endsWith("…")).toBe(true);
    expect(result).not.toMatch(/recommendation…$/);
    expect(result).toMatch(/^Transportation recommendations/);
  });

  it("falls back to character truncation for a single long word", () => {
    const word = "a".repeat(60);
    const result = truncateToLastCompleteWord(word, 50);
    expect(result).toBe(`${"a".repeat(49)}…`);
  });
});

describe("titleFromUserMessage", () => {
  it("returns normalized text unchanged when within limits", () => {
    expect(titleFromUserMessage("  Plan a trip  ")).toBe("Plan a trip");
  });

  it("enforces the 6-word limit", () => {
    expect(titleFromUserMessage("one two three four five six seven")).toBe(
      "one two three four five six",
    );
  });

  it("truncates at the last complete word when the 6-word result exceeds 50 characters", () => {
    const text = "Transportation recommendations around magnificent historical districts today";
    const result = titleFromUserMessage(text);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("handles a single word longer than 50 characters", () => {
    const text = "a".repeat(60);
    expect(titleFromUserMessage(text)).toBe(`${"a".repeat(49)}…`);
  });

  it("returns empty string for empty or whitespace-only input", () => {
    expect(titleFromUserMessage("")).toBe("");
    expect(titleFromUserMessage("   ")).toBe("");
  });
});
