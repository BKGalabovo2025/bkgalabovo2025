import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUsePathname, mockUseSearchParams } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
  mockUseSearchParams: vi.fn<() => URLSearchParams>(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
  useSearchParams: mockUseSearchParams,
}));

import { ACCOUNTING_SECTIONS } from "../accounting-sections";
import { AccountingNav } from "../AccountingNav";

describe("AccountingNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/accounting");
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("рендерира всички счетоводни секции с валидни Link href и tooltip", () => {
    render(<AccountingNav />);

    const nav = screen.getByRole("navigation", {
      name: "Навигация в счетоводни отчети",
    });
    expect(nav).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(ACCOUNTING_SECTIONS.length);

    expect(
      screen.getByRole("link", { name: "Всички дейности" })
    ).toHaveAttribute("href", "/accounting");
    expect(
      screen.getByRole("link", { name: "Нестопанска дейност" })
    ).toHaveAttribute("href", "/accounting/non-commercial");
    expect(
      screen.getByRole("link", { name: "Стопанска дейност" })
    ).toHaveAttribute("href", "/accounting/commercial");

    for (const section of ACCOUNTING_SECTIONS) {
      const link = screen.getByRole("link", { name: section.label });
      expect(link).toHaveAttribute("title", section.tooltip);
    }
  });

  it("маркира активния таб спрямо текущия pathname", () => {
    mockUsePathname.mockReturnValue("/accounting/commercial");
    render(<AccountingNav />);

    const commercialLink = screen.getByRole("link", {
      name: "Стопанска дейност",
    });
    const allLink = screen.getByRole("link", { name: "Всички дейности" });
    const nonCommercialLink = screen.getByRole("link", {
      name: "Нестопанска дейност",
    });

    expect(commercialLink).toHaveAttribute("aria-current", "page");
    expect(allLink).not.toHaveAttribute("aria-current");
    expect(nonCommercialLink).not.toHaveAttribute("aria-current");
  });

  it("пада към 'Всички дейности', когато pathname не съответства на подсекция", () => {
    mockUsePathname.mockReturnValue("/accounting/trips/trip-42");
    render(<AccountingNav />);

    expect(
      screen.getByRole("link", { name: "Всички дейности" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("поддържа dark: класове за навигацията, активния таб, неактивните табове и иконите", () => {
    mockUsePathname.mockReturnValue("/accounting/non-commercial");
    render(<AccountingNav className="custom-nav-class" />);

    const nav = screen.getByRole("navigation", {
      name: "Навигация в счетоводни отчети",
    });
    expect(nav).toHaveClass(
      "custom-nav-class",
      "dark:border-zinc-800",
      "dark:bg-zinc-900/60"
    );

    const activeLink = screen.getByRole("link", {
      name: "Нестопанска дейност",
    });
    expect(activeLink).toHaveClass("dark:bg-zinc-800", "dark:text-white");
    const activeIcon = activeLink.querySelector("svg");
    expect(activeIcon).toHaveClass("dark:text-emerald-400");

    const inactiveLink = screen.getByRole("link", {
      name: "Стопанска дейност",
    });
    expect(inactiveLink).toHaveClass(
      "dark:text-zinc-400",
      "dark:hover:bg-zinc-800/50",
      "dark:hover:text-zinc-200"
    );
    const inactiveIcon = inactiveLink.querySelector("svg");
    expect(inactiveIcon).toHaveClass("dark:text-zinc-500");
  });

  it("запазва разрешените query параметри (month, status, incomplete, view) и игнорира останалите", () => {
    mockUseSearchParams.mockReturnValue(
      new URLSearchParams(
        "month=2026-04&status=draft&incomplete=1&view=cards&ignored=yes"
      )
    );
    render(<AccountingNav />);

    const expectedQuery = "month=2026-04&status=draft&incomplete=1&view=cards";

    expect(
      screen.getByRole("link", { name: "Всички дейности" })
    ).toHaveAttribute("href", `/accounting?${expectedQuery}`);
    expect(
      screen.getByRole("link", { name: "Нестопанска дейност" })
    ).toHaveAttribute("href", `/accounting/non-commercial?${expectedQuery}`);
    expect(
      screen.getByRole("link", { name: "Стопанска дейност" })
    ).toHaveAttribute("href", `/accounting/commercial?${expectedQuery}`);
  });
});
