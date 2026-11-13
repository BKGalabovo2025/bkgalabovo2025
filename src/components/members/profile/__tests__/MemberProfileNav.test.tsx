import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Member } from "@/types";

const { mockUsePathname, mockUseMemberProfileContext } = vi.hoisted(() => ({
  mockUsePathname: vi.fn<() => string>(),
  mockUseMemberProfileContext: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("../MemberProfileContext", () => ({
  useMemberProfileContext: () => mockUseMemberProfileContext(),
}));

import {
  getMemberSectionHref,
  MEMBER_PROFILE_SECTIONS,
} from "../member-profile-sections";
import { MemberProfileNav } from "../MemberProfileNav";

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    siteId: "bkgalabovo",
    firstName: "Мария",
    lastName: "Иванова",
    name: "Мария Иванова",
    registrationDate: "2025-01-01T00:00:00.000Z",
    isClubMember: true,
    signedDeclarationUrl: "https://example.com/declaration.pdf",
    medicalCertificateUrl: "https://example.com/medical.pdf",
    dateOfBirth: `${new Date().getFullYear() - 25}-03-10`,
    ...overrides,
  };
}

function setupContext({
  memberId = "m1",
  pathname = "/members/m1",
  isOverdue = false,
  memberOverrides = {},
}: {
  memberId?: string;
  pathname?: string;
  isOverdue?: boolean;
  memberOverrides?: Partial<Member>;
} = {}) {
  mockUsePathname.mockReturnValue(pathname);
  mockUseMemberProfileContext.mockReturnValue({
    memberId,
    member: makeMember({ id: memberId, ...memberOverrides }),
    isOverdue,
  });
}

describe("MemberProfileNav", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("рендерира коректни href стойности за всички секции и маркира активния таб", () => {
    setupContext({ memberId: "m42", pathname: "/members/m42/documents" });
    render(<MemberProfileNav />);

    for (const section of MEMBER_PROFILE_SECTIONS) {
      const link = screen.getByRole("link", { name: section.label });
      expect(link).toHaveAttribute(
        "href",
        getMemberSectionHref("m42", section)
      );

      if (section.id === "documents") {
        expect(link).toHaveAttribute("aria-current", "page");
      } else {
        expect(link).not.toHaveAttribute("aria-current", "page");
      }
    }
  });

  it("показва червена статус точка на таб 'sales' при isOverdue: true и я скрива при false", () => {
    setupContext({ isOverdue: true });
    const { rerender } = render(<MemberProfileNav />);

    const salesLinkOverdue = screen.getByRole("link", {
      name: "Финансова история",
    });
    expect(salesLinkOverdue.querySelector(".bg-rose-500")).not.toBeNull();

    setupContext({ isOverdue: false });
    rerender(<MemberProfileNav />);

    const salesLinkOk = screen.getByRole("link", {
      name: "Финансова история",
    });
    expect(salesLinkOk.querySelector(".bg-rose-500")).toBeNull();
  });

  it("показва кехлибарена статус точка на 'documents' за клубен член без декларация или медицинско", () => {
    setupContext({
      memberOverrides: {
        isClubMember: true,
        isGuest: false,
        signedDeclarationUrl: null,
        medicalCertificateUrl: "https://example.com/med.pdf",
      },
    });
    const { rerender } = render(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Документи" })
        .querySelector(".bg-amber-500")
    ).not.toBeNull();

    setupContext({
      memberOverrides: {
        isClubMember: true,
        isGuest: false,
        signedDeclarationUrl: "https://example.com/decl.pdf",
        medicalCertificateUrl: null,
      },
    });
    rerender(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Документи" })
        .querySelector(".bg-amber-500")
    ).not.toBeNull();
  });

  it("не показва статус точка на 'documents' при попълнени документи или при гост", () => {
    setupContext({
      memberOverrides: {
        isClubMember: true,
        signedDeclarationUrl: "https://example.com/decl.pdf",
        medicalCertificateUrl: "https://example.com/med.pdf",
      },
    });
    const { rerender } = render(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Документи" })
        .querySelector(".bg-amber-500")
    ).toBeNull();

    setupContext({
      memberOverrides: {
        isClubMember: true,
        isGuest: true,
        signedDeclarationUrl: null,
        medicalCertificateUrl: null,
      },
    });
    rerender(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Документи" })
        .querySelector(".bg-amber-500")
    ).toBeNull();

    setupContext({
      memberOverrides: {
        isClubMember: true,
        isGuest: false,
        memberType: "guest",
        signedDeclarationUrl: null,
        medicalCertificateUrl: null,
      },
    });
    rerender(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Документи" })
        .querySelector(".bg-amber-500")
    ).toBeNull();
  });

  it("показва кехлибарена статус точка на 'parents' за непълнолетен без родителски контакти и я скрива при пълнолетен или наличен контакт", () => {
    const minorDob = `${new Date().getFullYear() - 12}-06-15`;
    const adultDob = `${new Date().getFullYear() - 22}-06-15`;

    setupContext({
      memberOverrides: {
        dateOfBirth: minorDob,
      },
    });
    const { rerender } = render(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Родителски достъп" })
        .querySelector(".bg-amber-500")
    ).not.toBeNull();

    setupContext({
      memberOverrides: {
        dateOfBirth: minorDob,
        parentPhone: "0888123456",
      },
    });
    rerender(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Родителски достъп" })
        .querySelector(".bg-amber-500")
    ).toBeNull();

    setupContext({
      memberOverrides: {
        dateOfBirth: adultDob,
      },
    });
    rerender(<MemberProfileNav />);

    expect(
      screen
        .getByRole("link", { name: "Родителски достъп" })
        .querySelector(".bg-amber-500")
    ).toBeNull();
  });
});
