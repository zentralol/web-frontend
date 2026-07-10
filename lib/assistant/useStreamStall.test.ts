import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  getInFlightAssistantText,
  shouldEndThinkingOnTextChange,
} from "./useStreamStall";

const assistantMessage = (
  id: string,
  text: string,
  extraParts: UIMessage["parts"] = [],
): UIMessage => ({
  id,
  role: "assistant",
  parts: [{ type: "text", text }, ...extraParts],
});

describe("getInFlightAssistantText", () => {
  it("returns only the in-flight assistant text", () => {
    const messages: UIMessage[] = [
      { id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
      assistantMessage("a1", "Hello", [
        { type: "data-tool-status", data: { toolName: "search", status: "running" } } as UIMessage["parts"][number],
      ]),
    ];

    expect(getInFlightAssistantText(messages, "a1")).toBe("Hello");
  });

  it("returns null when there is no in-flight assistant message", () => {
    const messages: UIMessage[] = [
      { id: "u1", role: "user", parts: [{ type: "text", text: "hi" }] },
    ];

    expect(getInFlightAssistantText(messages, null)).toBeNull();
  });
});

describe("shouldEndThinkingOnTextChange", () => {
  it("ends thinking when assistant text grows", () => {
    expect(shouldEndThinkingOnTextChange("Hello", "Hello world")).toBe(true);
  });

  it("does not end thinking when only non-text parts would change", () => {
    expect(shouldEndThinkingOnTextChange("Hello", "Hello")).toBe(false);
  });

  it("does not end thinking when text shrinks or stays the same length", () => {
    expect(shouldEndThinkingOnTextChange("Hello", "Hell")).toBe(false);
    expect(shouldEndThinkingOnTextChange("", "")).toBe(false);
  });
});
