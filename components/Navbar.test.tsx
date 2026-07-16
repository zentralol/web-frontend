// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import Navbar from "./Navbar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/map",
}));

vi.mock("@/app/ui/fonts", () => ({
  spaceGrotesk: { className: "" },
}));

vi.mock("@clerk/nextjs", () => ({
  Show: ({ children }: { children: React.ReactNode }) => children,
  SignInButton: ({ children }: { children: React.ReactNode }) => children,
  SignUpButton: ({ children }: { children: React.ReactNode }) => children,
  UserButton: () => null,
}));

describe("Navbar feedback link", () => {
  afterEach(() => {
    cleanup();
  });

  test("opens a pre-addressed feedback email from desktop and mobile navigation", () => {
    render(<Navbar />);

    const expectedHref = "mailto:hi@zentra.lol?subject=Zentra%20feedback";
    expect(screen.getByRole("link", { name: "Feedback" }).getAttribute("href"))
      .toBe(expectedHref);

    fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const feedbackLinks = screen.getAllByRole("link", { name: "Feedback" });
    expect(feedbackLinks).toHaveLength(2);
    expect(
      feedbackLinks.every((link) => link.getAttribute("href") === expectedHref),
    ).toBe(true);
  });
});
