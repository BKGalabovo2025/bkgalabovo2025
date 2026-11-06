/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from "@testing-library/react";
import * as nextThemes from "next-themes";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeToggle } from "../theme-toggle";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

describe("ThemeToggle Component", () => {
  const mockSetTheme = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles to light when currently dark", () => {
    vi.mocked(nextThemes.useTheme).mockReturnValue({
      theme: "dark",
      resolvedTheme: "dark",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: "dark",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", {
      name: /Превключи на светла тема/i,
    });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("toggles to dark when currently light", () => {
    vi.mocked(nextThemes.useTheme).mockReturnValue({
      theme: "light",
      resolvedTheme: "light",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);

    const button = screen.getByRole("button", {
      name: /Превключи на тъмна тема/i,
    });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });
});
