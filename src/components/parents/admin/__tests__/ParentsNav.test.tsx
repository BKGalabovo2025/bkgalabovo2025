import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUsePathname, mockUseParentAdminContext } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
  mockUseParentAdminContext: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

vi.mock("../ParentAdminContext", () => ({
  useParentAdminContext: mockUseParentAdminContext,
}));

import { PARENT_ADMIN_SECTIONS } from "../parent-admin-sections";
import { ParentsNav } from "../ParentsNav";

function makeContextValue(overrides: Record<string, unknown> = {}) {
  return {
    stats: {
      pendingRequestsCount: 2,
      pendingAbsencesCount: 3,
      pendingCorrectionsCount: 1,
    },
    parents: [{ id: "p1" }, { id: "p2" }, { id: "p3" }, { id: "p4" }],
    absences: [{ id: "a1" }, { id: "a2" }, { id: "a3" }],
    corrections: [{ id: "c1" }],
    onlineParentsCount: 2,
    communications: [
      { id: "m1" },
      { id: "m2" },
      { id: "m3" },
      { id: "m4" },
      { id: "m5" },
    ],
    ...overrides,
  };
}

describe("ParentsNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/parents");
    mockUseParentAdminContext.mockReturnValue(makeContextValue());
  });

  it("рендерира всички 6 секции с валидни href и tooltip", () => {
    render(<ParentsNav />);

    const nav = screen.getByRole("navigation", {
      name: "Секции на родителския портал",
    });
    expect(nav).toBeInTheDocument();

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);

    for (const section of PARENT_ADMIN_SECTIONS) {
      const link = links.find(
        (el) => el.getAttribute("href") === `/parents${section.pathSuffix}`
      );
      expect(link).toBeDefined();
      expect(link).toHaveAttribute("title", section.tooltip);
      expect(link).toHaveTextContent(section.label);
    }
  });

  it("поставя aria-current='page' само на активния таб спрямо pathname", () => {
    mockUsePathname.mockReturnValue("/parents/absences");
    render(<ParentsNav />);

    const links = screen.getAllByRole("link");
    const absencesLink = links.find(
      (el) => el.getAttribute("href") === "/parents/absences"
    );
    const requestsLink = links.find(
      (el) => el.getAttribute("href") === "/parents"
    );
    const messagesLink = links.find(
      (el) => el.getAttribute("href") === "/parents/messages"
    );

    expect(absencesLink).toHaveAttribute("aria-current", "page");
    expect(requestsLink).not.toHaveAttribute("aria-current");
    expect(messagesLink).not.toHaveAttribute("aria-current");
  });

  it("рендерира сървърни stats badges за заявки, отсъствия, корекции, онлайн и комуникация", () => {
    render(<ParentsNav />);

    expect(screen.getByText("2")).toBeInTheDocument(); // pendingRequestsCount
    expect(screen.getByText("4")).toBeInTheDocument(); // parents.length
    expect(screen.getByText("3 нови")).toBeInTheDocument(); // pendingAbsencesCount
    expect(screen.getByText("1 нови")).toBeInTheDocument(); // pendingCorrectionsCount
    expect(screen.getByText("2 на живо")).toBeInTheDocument(); // onlineParentsCount
    expect(screen.getByText("5")).toBeInTheDocument(); // communications.length
  });

  it("скрива badges с 0 за отсъствия и корекции, когато няма чакащи и записи", () => {
    mockUseParentAdminContext.mockReturnValue(
      makeContextValue({
        stats: {
          pendingRequestsCount: 0,
          pendingAbsencesCount: 0,
          pendingCorrectionsCount: 0,
        },
        absences: [],
        corrections: [],
        onlineParentsCount: 0,
        communications: [],
      })
    );

    render(<ParentsNav />);

    const links = screen.getAllByRole("link");
    const absencesLink = links.find(
      (el) => el.getAttribute("href") === "/parents/absences"
    );
    const correctionsLink = links.find(
      (el) => el.getAttribute("href") === "/parents/corrections"
    );

    expect(absencesLink?.textContent?.trim()).toBe("Отсъствия");
    expect(correctionsLink?.textContent?.trim()).toBe("Корекции");
    expect(screen.queryByText(/0 нови/i)).not.toBeInTheDocument();
  });

  it("запазва акцентния цвят на badge-а при активен таб", () => {
    mockUsePathname.mockReturnValue("/parents/absences");
    render(<ParentsNav />);

    const absencesBadge = screen.getByText("3 нови");
    expect(absencesBadge).toHaveClass("bg-orange-600", "text-white");

    const correctionsBadge = screen.getByText("1 нови");
    expect(correctionsBadge).toHaveClass("bg-indigo-600", "text-white");

    const activityBadge = screen.getByText("2 на живо");
    expect(activityBadge).toHaveClass("bg-emerald-600", "text-white");

    const requestsLink = screen
      .getAllByRole("link")
      .find((el) => el.getAttribute("href") === "/parents");
    const requestsBadge = requestsLink?.querySelector("span.rounded-full");
    expect(requestsBadge).toHaveClass(
      "bg-amber-100",
      "text-amber-900",
      "dark:bg-amber-950/60",
      "dark:text-amber-200"
    );
  });

  it("поддържа dark: класове за навигацията, активния и неактивните табове", () => {
    mockUsePathname.mockReturnValue("/parents/messages");
    render(<ParentsNav />);

    const nav = screen.getByRole("navigation", {
      name: "Секции на родителския портал",
    });
    expect(nav).toHaveClass("dark:border-zinc-800", "dark:bg-zinc-900");

    const links = screen.getAllByRole("link");
    const activeLink = links.find(
      (el) => el.getAttribute("href") === "/parents/messages"
    );
    const inactiveLink = links.find(
      (el) => el.getAttribute("href") === "/parents/activity"
    );

    expect(activeLink).toHaveClass("dark:bg-zinc-950", "dark:text-white");
    expect(inactiveLink).toHaveClass(
      "dark:text-zinc-300",
      "dark:hover:bg-zinc-800",
      "dark:hover:text-white"
    );
  });
});
