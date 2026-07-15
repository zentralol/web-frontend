// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SavedPlacesSection } from "./SavedPlacesSection";
import type { FavoritePlace } from "@/lib/favorites/types";

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
}));

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

vi.mock("@/lib/favorites/actions", () => ({
  removeFavoritePlaceAction: mocks.remove,
}));

vi.mock("@/components/settings/FavoritePlaceNoteEditor", () => ({
  FavoritePlaceNoteEditor: () => null,
}));

const place: FavoritePlace = {
  id: "favorite-1",
  placeKey: "google:ChIJ123",
  source: "google",
  sourcePlaceId: "ChIJ123",
  name: "Bryant Park",
  address: "New York, NY",
  lat: 40.7536,
  lng: -73.9832,
  category: "Park",
  neighborhood: "Midtown",
  note: null,
  createdAt: "2026-07-15T12:00:00.000Z",
};

function deferredRemoval() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function confirmRemoval() {
  fireEvent.click(
    screen.getByRole("button", {
      name: "Remove Bryant Park from saved places",
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
}

describe("SavedPlacesSection", () => {
  beforeEach(() => {
    mocks.remove.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("removes a place immediately while the server request is pending", async () => {
    const removal = deferredRemoval();
    mocks.remove.mockReturnValueOnce(removal.promise);
    render(<SavedPlacesSection initialPlaces={[place]} />);

    confirmRemoval();

    expect(mocks.remove).toHaveBeenCalledWith(place.placeKey);
    expect(
      screen.queryByRole("heading", { name: place.name }),
    ).toBeNull();
    expect(screen.getByText(/No saved places yet/)).toBeTruthy();

    await act(async () => {
      removal.resolve();
      await removal.promise;
    });
  });

  test("restores an optimistically removed place when deletion fails", async () => {
    const removal = deferredRemoval();
    mocks.remove.mockReturnValueOnce(removal.promise);
    render(<SavedPlacesSection initialPlaces={[place]} />);

    confirmRemoval();
    expect(
      screen.queryByRole("heading", { name: place.name }),
    ).toBeNull();

    await act(async () => {
      removal.reject(new Error("database unavailable"));
      try {
        await removal.promise;
      } catch {
        // The component handles the failed request and restores the place.
      }
    });

    expect(screen.getByRole("heading", { name: place.name })).toBeTruthy();
    expect(
      screen.getByText("Could not remove this place. Please try again."),
    ).toBeTruthy();
  });
});
