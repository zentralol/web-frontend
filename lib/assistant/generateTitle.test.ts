import { describe, expect, it, vi } from "vitest";
import { generateText } from "ai";
import { generateConversationTitle } from "./generateTitle";

vi.mock("ai", () => ({
  generateText: vi.fn(),
}));

vi.mock("./deepseek", () => ({
  getDeepSeekModel: vi.fn(() => "mock-model"),
}));

function createMessage(
  role: "user" | "assistant",
  text: string,
): { id: string; role: "user" | "assistant"; parts: [{ type: "text"; text: string }] } {
  return {
    id: `${role}-${text}`,
    role,
    parts: [{ type: "text", text }],
  };
}

describe("generateConversationTitle", () => {
  it("throws when there is no user message", async () => {
    await expect(generateConversationTitle([])).rejects.toThrow("No user message");
  });

  it("returns the LLM title when it is within limits", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ text: "Plan a trip" } as never);

    const title = await generateConversationTitle([
      createMessage("user", "Plan a trip to Paris"),
    ]);

    expect(title).toBe("Plan a trip");
  });

  it("enforces the 6-word limit when the LLM returns more words", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: "one two three four five six seven",
    } as never);

    const title = await generateConversationTitle([
      createMessage("user", "Some message"),
    ]);

    expect(title).toBe("one two three four five six");
  });

  it("truncates at the last complete word when the LLM title exceeds 50 characters", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: "Transportation recommendations around magnificent historical districts today",
    } as never);

    const title = await generateConversationTitle([
      createMessage("user", "Some message"),
    ]);

    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(50);
  });

  it("strips surrounding quotes from the LLM title", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({
      text: "'Quoted title'",
    } as never);

    const title = await generateConversationTitle([
      createMessage("user", "Some message"),
    ]);

    expect(title).toBe("Quoted title");
  });

  it("falls back to titleFromUserMessage when the LLM returns whitespace", async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ text: "   " } as never);

    const title = await generateConversationTitle([
      createMessage("user", "Plan a trip"),
    ]);

    expect(title).toBe("Plan a trip");
  });

  it("falls back to titleFromUserMessage when generateText throws", async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error("LLM error"));

    const title = await generateConversationTitle([
      createMessage("user", "Plan a trip"),
    ]);

    expect(title).toBe("Plan a trip");
  });

  it("includes assistant context in the prompt when available", async () => {
    const generateTextMock = vi.mocked(generateText).mockResolvedValueOnce({
      text: "Title",
    } as never);

    await generateConversationTitle([
      createMessage("user", "User question"),
      createMessage("assistant", "Assistant answer"),
    ]);

    expect(generateTextMock).toHaveBeenCalledWith(
      expect.objectContaining({
        prompt: "User: User question\nAssistant: Assistant answer",
      }),
    );
  });
});
