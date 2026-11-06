/// <reference types="@testing-library/jest-dom" />
import { render } from "@testing-library/react";
import * as nextThemes from "next-themes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeColorMeta } from "../shared/ThemeColorMeta";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

describe("ThemeColorMeta Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.head.innerHTML = "";
  });

  it("updates meta tags to dark values when theme is dark", () => {
    vi.mocked(nextThemes.useTheme).mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
      forcedTheme: undefined,
    });

    render(<ThemeColorMeta />);

    const themeColor = document.querySelector(
      'meta[name="theme-color"]:not([media])'
    );
    expect(themeColor).not.toBeNull();
    expect(themeColor?.getAttribute("content")).toBe("#09090b");

    const appleStatusBar = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    expect(appleStatusBar).not.toBeNull();
    expect(appleStatusBar?.getAttribute("content")).toBe("black-translucent");
  });

  it("updates meta tags to light values when theme is light", () => {
    vi.mocked(nextThemes.useTheme).mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeColorMeta />);

    const themeColor = document.querySelector(
      'meta[name="theme-color"]:not([media])'
    );
    expect(themeColor).not.toBeNull();
    expect(themeColor?.getAttribute("content")).toBe("#ffffff");

    const appleStatusBar = document.querySelector(
      'meta[name="apple-mobile-web-app-status-bar-style"]'
    );
    expect(appleStatusBar).not.toBeNull();
    expect(appleStatusBar?.getAttribute("content")).toBe("default");
  });
});
