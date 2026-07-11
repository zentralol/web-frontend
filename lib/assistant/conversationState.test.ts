import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import {
  WELCOME_MESSAGE_ID,
  canDeleteConversation,
  getHighlightedConversationId,
  isConversationEmpty,
  isConversationListBlocked,
  resolveVisiblePendingId,
} from "./conversationState";

function message(id: string, role: UIMessage["role"] = "user"): UIMessage {
  return { id, role, parts: [{ type: "text", text: "hi" }] };
}

describe("isConversationEmpty", () => {
  it("returns true for no messages", () => {
    expect(isConversationEmpty([])).toBe(true);
  });

  it("returns true when only the welcome message is present", () => {
    expect(isConversationEmpty([message(WELCOME_MESSAGE_ID, "assistant")])).toBe(
      true,
    );
  });

  it("returns false once a real message exists", () => {
    expect(
      isConversationEmpty([
        message(WELCOME_MESSAGE_ID, "assistant"),
        message("u1", "user"),
      ]),
    ).toBe(false);
  });
});

describe("resolveVisiblePendingId", () => {
  it("returns null when there is no pending id", () => {
    expect(resolveVisiblePendingId(null, "active")).toBeNull();
  });

  it("returns null once pending matches the active conversation", () => {
    expect(resolveVisiblePendingId("active", "active")).toBeNull();
  });

  it("returns the pending id while it differs from the active one", () => {
    expect(resolveVisiblePendingId("pending", "active")).toBe("pending");
  });
});

describe("getHighlightedConversationId", () => {
  it("prefers the pending id when present", () => {
    expect(getHighlightedConversationId("pending", "active")).toBe("pending");
  });

  it("falls back to the active id", () => {
    expect(getHighlightedConversationId(null, "active")).toBe("active");
  });
});

describe("isConversationListBlocked", () => {
  it("returns true while a transition is pending", () => {
    expect(
      isConversationListBlocked({
        isPending: true,
        deletingConversationId: null,
        visiblePendingConversationId: null,
      }),
    ).toBe(true);
  });

  it("returns true while a conversation is being deleted", () => {
    expect(
      isConversationListBlocked({
        isPending: false,
        deletingConversationId: "a",
        visiblePendingConversationId: null,
      }),
    ).toBe(true);
  });

  it("returns true while a conversation switch has not settled", () => {
    expect(
      isConversationListBlocked({
        isPending: false,
        deletingConversationId: null,
        visiblePendingConversationId: "b",
      }),
    ).toBe(true);
  });

  it("returns false when nothing is in flight", () => {
    expect(
      isConversationListBlocked({
        isPending: false,
        deletingConversationId: null,
        visiblePendingConversationId: null,
      }),
    ).toBe(false);
  });
});

describe("canDeleteConversation", () => {
  it("allows deleting any conversation when more than one exists", () => {
    expect(
      canDeleteConversation({
        conversationsLength: 2,
        conversationId: "a",
        activeConversationId: "b",
        isActiveConversationEmpty: true,
      }),
    ).toBe(true);
  });

  it("allows deleting the only conversation when it is active and not empty", () => {
    expect(
      canDeleteConversation({
        conversationsLength: 1,
        conversationId: "a",
        activeConversationId: "a",
        isActiveConversationEmpty: false,
      }),
    ).toBe(true);
  });

  it("blocks deleting the only conversation when it is empty", () => {
    expect(
      canDeleteConversation({
        conversationsLength: 1,
        conversationId: "a",
        activeConversationId: "a",
        isActiveConversationEmpty: true,
      }),
    ).toBe(false);
  });

  it("blocks deleting the only conversation when it is not the active one", () => {
    expect(
      canDeleteConversation({
        conversationsLength: 1,
        conversationId: "a",
        activeConversationId: "b",
        isActiveConversationEmpty: false,
      }),
    ).toBe(false);
  });
});
