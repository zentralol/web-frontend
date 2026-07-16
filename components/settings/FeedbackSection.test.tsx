// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FeedbackSection } from "./FeedbackSection";

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

describe("FeedbackSection", () => {
  afterEach(() => {
    cleanup();
  });

  test("shows the support address and opens a pre-addressed email", () => {
    render(<FeedbackSection />);

    expect(screen.getByText("hi@zentra.lol")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Email us" }).getAttribute("href"))
      .toBe("mailto:hi@zentra.lol?subject=Zentra%20feedback");
  });
});
