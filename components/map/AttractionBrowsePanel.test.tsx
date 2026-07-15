// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import AttractionBrowsePanel, {
  type AttractionBrowsePanelProps,
} from "./AttractionBrowsePanel";

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

afterEach(() => cleanup());

function buildProps(
  overrides: Partial<AttractionBrowsePanelProps> = {},
): AttractionBrowsePanelProps {
  return {
    loadState: "ready",
    filteredAttractions: [],
    totalCount: 0,
    categories: [],
    searchQuery: "",
    categoryFilter: null,
    sortMode: "recommended",
    highlightedId: null,
    onSearchChange: vi.fn(),
    onCategoryChange: vi.fn(),
    onSortModeChange: vi.fn(),
    onNearMe: vi.fn(),
    onQuietAreas: vi.fn(),
    onSelect: vi.fn(),
    onSelectQuietArea: vi.fn(),
    onRetry: vi.fn(),
    ...overrides,
  };
}

describe("AttractionBrowsePanel location filters", () => {
  test("shows a Near me location error before the sort mode changes", () => {
    render(
      <AttractionBrowsePanel
        {...buildProps({
          nearMeError: "Near me location failed.",
          sortMode: "recommended",
        })}
      />,
    );

    expect(screen.getByText("Near me location failed.")).toBeTruthy();
  });

  test("shows a Quiet areas location error before the sort mode changes", () => {
    render(
      <AttractionBrowsePanel
        {...buildProps({
          quietAreasError: "Quiet areas location failed.",
          sortMode: "recommended",
        })}
      />,
    );

    expect(screen.getByText("Quiet areas location failed.")).toBeTruthy();
  });

  test("does not restart Quiet areas when its active filter is clicked", () => {
    const onQuietAreas = vi.fn();
    render(
      <AttractionBrowsePanel
        {...buildProps({
          sortMode: "quiet_areas",
          onQuietAreas,
        })}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Quiet areas" }));

    expect(onQuietAreas).not.toHaveBeenCalled();
  });
});
