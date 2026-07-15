// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { FavoritePlaceButton } from "./FavoritePlaceButton";

const mocks = vi.hoisted(() => ({
  add: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

vi.mock("@/lib/favorites/actions", () => ({
  addFavoritePlaceAction: mocks.add,
  removeFavoritePlaceAction: mocks.remove,
}));

describe("FavoritePlaceButton", () => {
  beforeEach(() => {
    mocks.add.mockResolvedValue({ placeKey: "attraction:42" });
    mocks.remove.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("saves a place and reports its server-derived key", async () => {
    const onFavoriteChange = vi.fn();
    render(
      <FavoritePlaceButton
        location={{
          name: "Bryant Park",
          lat: 40.7536,
          lng: -73.9832,
          attractionId: 42,
          source: "attraction",
        }}
        isFavorite={false}
        onFavoriteChange={onFavoriteChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save place" }));

    await waitFor(() => {
      expect(mocks.add).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Bryant Park",
          attractionId: 42,
          lat: 40.7536,
          lng: -73.9832,
        }),
      );
      expect(onFavoriteChange).toHaveBeenCalledWith("attraction:42", true);
    });
  });

  test("removes an existing favorite by its place key", async () => {
    const onFavoriteChange = vi.fn();
    render(
      <FavoritePlaceButton
        location={{
          name: "Bryant Park",
          lat: 40.7536,
          lng: -73.9832,
          placeId: "ChIJ123",
          source: "map",
        }}
        isFavorite
        onFavoriteChange={onFavoriteChange}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remove from saved places" }),
    );

    await waitFor(() => {
      expect(mocks.remove).toHaveBeenCalledWith("google:ChIJ123");
      expect(onFavoriteChange).toHaveBeenCalledWith("google:ChIJ123", false);
    });
  });

  test("keeps the favorite state unchanged when saving fails", async () => {
    mocks.add.mockRejectedValueOnce(new Error("database unavailable"));
    const onFavoriteChange = vi.fn();
    render(
      <FavoritePlaceButton
        location={{ name: "Place", lat: 40, lng: -73, source: "map" }}
        isFavorite={false}
        onFavoriteChange={onFavoriteChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save place" }));

    expect(
      await screen.findByText(
        "Could not update this saved place. Please try again.",
      ),
    ).toBeTruthy();
    expect(onFavoriteChange).not.toHaveBeenCalled();
  });
});
