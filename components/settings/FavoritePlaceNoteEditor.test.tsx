// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FavoritePlaceNoteEditor } from "./FavoritePlaceNoteEditor";

const mocks = vi.hoisted(() => ({
  updateNote: vi.fn(),
}));

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

vi.mock("@/lib/favorites/actions", () => ({
  updateFavoritePlaceNoteAction: mocks.updateNote,
}));

describe("FavoritePlaceNoteEditor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mocks.updateNote.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  test("auto-saves after the user stops typing", async () => {
    render(
      <FavoritePlaceNoteEditor
        placeKey="google:ChIJ123"
        placeName="Bryant Park"
        initialNote={null}
      />,
    );

    fireEvent.change(screen.getByLabelText("Your note for Bryant Park"), {
      target: { value: "Best near sunset" },
    });

    expect(mocks.updateNote).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(800);
    });

    expect(mocks.updateNote).toHaveBeenCalledWith(
      "google:ChIJ123",
      "Best near sunset",
    );
    expect(
      screen.getByRole("button", { name: /Saved/ }).hasAttribute("disabled"),
    ).toBe(true);
  });

  test("allows the user to clear an existing note manually", async () => {
    render(
      <FavoritePlaceNoteEditor
        placeKey="attraction:42"
        placeName="Bryant Park"
        initialNote="Meet by the fountain"
      />,
    );

    fireEvent.change(screen.getByLabelText("Your note for Bryant Park"), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await act(async () => {
      await Promise.resolve();
    });

    expect(mocks.updateNote).toHaveBeenCalledWith("attraction:42", "");
  });
});
