import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ShareAthleteDialog } from "../ShareAthleteDialog";

// Mock QRCode
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,mockqr"),
  },
}));

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
    tournaments: [
      "Държавно лично първенство U11",
      "Турнир Млади Таланти Севлиево",
      "Коледен турнир Гълъбово",
    ],
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

  it("renders athlete details correctly when open", async () => {
    await act(async () => {
      render(
        <ShareAthleteDialog
          member={mockMember}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
    });

    // Checks name
    expect(screen.getAllByText("Християн Христов").length).toBeGreaterThan(0);
    // Checks skill level badge
    expect(screen.getByText("Състезател")).toBeInTheDocument();
    // Checks school
    expect(
      screen.getByText("СУ „Васил Левски“ - Гълъбово")
    ).toBeInTheDocument();
    // Checks tournament count
    expect(screen.getByText("Участия в Турнири (3)")).toBeInTheDocument();
    // Checks tournament names
    expect(
      screen.getByText("Държавно лично първенство U11")
    ).toBeInTheDocument();
  });

  it("opens Facebook sharer when clicking Facebook share button", async () => {
    const windowOpenSpy = vi
      .spyOn(window, "open")
      .mockImplementation(() => null);

    await act(async () => {
      render(
        <ShareAthleteDialog
          member={mockMember}
          open={true}
          onOpenChange={vi.fn()}
        />
      );
    });

    const fbButton = screen.getByText("Facebook").closest("button");
    expect(fbButton).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(fbButton!);
    });

    expect(windowOpenSpy).toHaveBeenCalledWith(
      expect.stringContaining("facebook.com/sharer/sharer.php"),
      "_blank",
      expect.any(String)
    );
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

    const copyBtn = screen.getByText("Копирай директен линк").closest("button");
    expect(copyBtn).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(copyBtn!);
    });

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("athlete=athlete-123")
    );
  });
});
