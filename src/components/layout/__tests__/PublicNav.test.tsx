import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUsePathname } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

vi.mock("@/components/shared/GoogleTranslateWidget", () => ({
  GoogleTranslateWidget: () => <div data-testid="google-translate-widget" />,
}));

vi.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => <button type="button" data-testid="theme-toggle" />,
}));

import { PublicNav } from "../public-nav";

describe("PublicNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/club");
  });

  it("renders navigation links for /club, /club/team, /club/catalog, /club/schedule, and /club/reviews", () => {
    render(<PublicNav />);

    const logoLink = screen.getByRole("link", { name: /БК ГЪЛЪБОВО/i });
    expect(logoLink).toHaveAttribute("href", "/club");

    expect(screen.getByRole("link", { name: "Отбор" })).toHaveAttribute(
      "href",
      "/club/team"
    );
    expect(screen.getByRole("link", { name: "Услуги" })).toHaveAttribute(
      "href",
      "/club/catalog"
    );
    expect(screen.getByRole("link", { name: "График" })).toHaveAttribute(
      "href",
      "/club/schedule"
    );
    expect(screen.getByRole("link", { name: /Отзиви/i })).toHaveAttribute(
      "href",
      "/club/reviews"
    );
  });

  it("applies active styling and aria-current='page' for /club/schedule", () => {
    mockUsePathname.mockReturnValue("/club/schedule");
    render(<PublicNav />);

    const scheduleLink = screen.getByRole("link", { name: "График" });
    const teamLink = screen.getByRole("link", { name: "Отбор" });
    const catalogLink = screen.getByRole("link", { name: "Услуги" });
    const reviewsLink = screen.getByRole("link", { name: /Отзиви/i });

    expect(scheduleLink).toHaveAttribute("aria-current", "page");
    expect(scheduleLink).toHaveClass("text-blue-400");

    expect(teamLink).not.toHaveAttribute("aria-current");
    expect(teamLink).not.toHaveClass("text-blue-400");

    expect(catalogLink).not.toHaveAttribute("aria-current");
    expect(reviewsLink).not.toHaveAttribute("aria-current");
  });

  it("applies active styling and aria-current='page' for /club/team and sub-routes", () => {
    mockUsePathname.mockReturnValue("/club/team/players");
    render(<PublicNav />);

    const teamLink = screen.getByRole("link", { name: "Отбор" });
    const scheduleLink = screen.getByRole("link", { name: "График" });

    expect(teamLink).toHaveAttribute("aria-current", "page");
    expect(teamLink).toHaveClass("text-blue-400");

    expect(scheduleLink).not.toHaveAttribute("aria-current");
    expect(scheduleLink).not.toHaveClass("text-blue-400");
  });

  it("applies active styling and aria-current='page' for /club/reviews", () => {
    mockUsePathname.mockReturnValue("/club/reviews");
    render(<PublicNav />);

    const reviewsLink = screen.getByRole("link", { name: /Отзиви/i });
    expect(reviewsLink).toHaveAttribute("aria-current", "page");
    expect(reviewsLink).toHaveClass("text-amber-300");
  });

  it("renders Brand Switcher links to /recovery-zone (Recovery Zone) and / (Портал)", () => {
    render(<PublicNav />);

    const recoveryLink = screen.getByRole("link", { name: "Recovery Zone" });
    expect(recoveryLink).toHaveAttribute("href", "/recovery-zone");

    const portalLink = screen.getByRole("link", { name: "Портал" });
    expect(portalLink).toHaveAttribute("href", "/");
  });
});
