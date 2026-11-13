import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShareAthleteDialog } from "../ShareAthleteDialog";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ShareAthleteDialog", () => {
  const mockMember = {
    id: "athlete-123",
    siteId: "bkgalabovo",
    firstName: "Християн",
    lastName: "Христов",
    name: "Християн Христов",
    registrationDate: "2026-01-01T00:00:00.000Z",
    skillLevel: "advanced" as const,
    ageGroupDisplay: "U11",
    educationInstitution: "СУ „Васил Левски“ - Гълъбово",
    tournaments: ["Държавно лично първенство U11"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when open is false", async () => {
    let container: HTMLElement;
    await act(async () => {
      const res = render(
        <ShareAthleteDialog
          member={mockMember}
          open={false}
          onOpenChange={vi.fn()}
        />
      );
      container = res.container;
    });
    expect(container!).toBeEmptyDOMElement();
  });

  it("renders athlete name and direct URL link when open", async () => {
    await act(async () => {
      render(
        <ShareAthleteDialog
          member={mockMember}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
    });

    expect(screen.getAllByText("Християн Христов").length).toBeGreaterThan(0);
    expect(
      screen.getByText(/\/club\/team\?athlete=athlete-123/)
    ).toBeInTheDocument();

    const directLink = screen.getByTitle("Отвори URL страницата");
    expect(directLink).toHaveAttribute(
      "href",
      "/club/team?athlete=athlete-123"
    );
    expect(screen.getByText("Сподели")).toBeInTheDocument();
  });

  it("copies direct link to clipboard when clicking copy button", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    await act(async () => {
      render(
        <ShareAthleteDialog
          member={mockMember}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
    });

    const copyBtn = screen.getByText("Копирай линк").closest("button");
    expect(copyBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(copyBtn!);
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("/club/team?athlete=athlete-123")
    );
  });
});
