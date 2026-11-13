import { describe, expect, it } from "vitest";

import { Member } from "@/types";

import {
  getActiveMemberListSectionId,
  isClubMemberProfile,
  isGuestProfile,
  isRecoveryProfile,
  MEMBER_LIST_SECTIONS,
} from "../member-list-sections";

function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: "m1",
    siteId: "bkgalabovo",
    firstName: "Иван",
    lastName: "Петров",
    name: "Иван Петров",
    registrationDate: "2025-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("member-list-sections predicates", () => {
  it("класифицира член без флагове като клубен член по подразбиране", () => {
    const member = makeMember();
    expect(isClubMemberProfile(member)).toBe(true);
    expect(isRecoveryProfile(member)).toBe(false);
    expect(isGuestProfile(member)).toBe(false);
  });

  it("разпознава самостоятелен гост профил", () => {
    const member = makeMember({ isGuest: true, memberType: "guest" });
    expect(isClubMemberProfile(member)).toBe(false);
    expect(isRecoveryProfile(member)).toBe(false);
    expect(isGuestProfile(member)).toBe(true);
  });

  it("разпознава самостоятелен клиент на Зона Възстановяване", () => {
    const member = makeMember({
      isRecoveryMember: true,
      memberType: "recovery",
    });
    expect(isClubMemberProfile(member)).toBe(false);
    expect(isRecoveryProfile(member)).toBe(true);
    expect(isGuestProfile(member)).toBe(false);
  });

  it("поддържа двойна роля: клубен член + Зона Възстановяване", () => {
    const member = makeMember({
      isClubMember: true,
      isRecoveryMember: true,
      memberType: "regular",
    });
    expect(isClubMemberProfile(member)).toBe(true);
    expect(isRecoveryProfile(member)).toBe(true);
    expect(isGuestProfile(member)).toBe(false);
  });

  it("поддържа двойна роля: клубен член + гост (изрично isClubMember: true)", () => {
    const member = makeMember({
      isClubMember: true,
      isGuest: true,
      memberType: "guest",
    });
    expect(isClubMemberProfile(member)).toBe(true);
    expect(isRecoveryProfile(member)).toBe(false);
    expect(isGuestProfile(member)).toBe(true);
  });

  it("поддържа двойна роля: гост + Зона Възстановяване (без клубен член)", () => {
    const member = makeMember({
      isGuest: true,
      isRecoveryMember: true,
      memberType: "recovery",
    });
    expect(isClubMemberProfile(member)).toBe(false);
    expect(isRecoveryProfile(member)).toBe(true);
    expect(isGuestProfile(member)).toBe(true);
  });

  it("поддържа тройна комбинация на флагове", () => {
    const member = makeMember({
      isClubMember: true,
      isGuest: true,
      isRecoveryMember: true,
    });
    expect(isClubMemberProfile(member)).toBe(true);
    expect(isRecoveryProfile(member)).toBe(true);
    expect(isGuestProfile(member)).toBe(true);
  });

  it("запазва коректна класификация при isCoach в различни роли", () => {
    const clubCoach = makeMember({ isCoach: true, memberType: "regular" });
    expect(isClubMemberProfile(clubCoach)).toBe(true);
    expect(isRecoveryProfile(clubCoach)).toBe(false);
    expect(isGuestProfile(clubCoach)).toBe(false);

    const recoveryCoach = makeMember({
      isCoach: true,
      isClubMember: false,
      isRecoveryMember: true,
      memberType: "recovery",
    });
    expect(isClubMemberProfile(recoveryCoach)).toBe(false);
    expect(isRecoveryProfile(recoveryCoach)).toBe(true);
    expect(isGuestProfile(recoveryCoach)).toBe(false);

    const dualCoach = makeMember({
      isCoach: true,
      isClubMember: true,
      isRecoveryMember: true,
    });
    expect(isClubMemberProfile(dualCoach)).toBe(true);
    expect(isRecoveryProfile(dualCoach)).toBe(true);
    expect(isGuestProfile(dualCoach)).toBe(false);
  });

  it("не разчита само на memberType без съответните булеви флагове", () => {
    const guestTypeOnly = makeMember({ memberType: "guest" });
    expect(isClubMemberProfile(guestTypeOnly)).toBe(true);
    expect(isGuestProfile(guestTypeOnly)).toBe(false);

    const recoveryTypeOnly = makeMember({ memberType: "recovery" });
    expect(isClubMemberProfile(recoveryTypeOnly)).toBe(true);
    expect(isRecoveryProfile(recoveryTypeOnly)).toBe(false);
  });
});

describe("MEMBER_LIST_SECTIONS & getActiveMemberListSectionId", () => {
  it("съдържа уникални id, pathSuffix и консистентни href", () => {
    const ids = MEMBER_LIST_SECTIONS.map((s) => s.id);
    const suffixes = MEMBER_LIST_SECTIONS.map((s) => s.pathSuffix);
    const hrefs = MEMBER_LIST_SECTIONS.map((s) => s.href);

    expect(ids).toEqual(["club", "recovery", "guests", "families"]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);

    for (const section of MEMBER_LIST_SECTIONS) {
      expect(section.href).toBe(`/members/${section.pathSuffix}`);
      expect(section.label.length).toBeGreaterThan(0);
      expect(section.description.length).toBeGreaterThan(0);
      expect(section.icon).toBeDefined();
    }
  });

  it("връща 'all' за коренния маршрут /members (със или без наклонена черта)", () => {
    expect(getActiveMemberListSectionId("/members")).toBe("all");
    expect(getActiveMemberListSectionId("/members/")).toBe("all");
  });

  it("разпознава всяка регистрирана секция по pathname", () => {
    expect(getActiveMemberListSectionId("/members/club")).toBe("club");
    expect(getActiveMemberListSectionId("/members/club/")).toBe("club");
    expect(getActiveMemberListSectionId("/members/recovery")).toBe("recovery");
    expect(getActiveMemberListSectionId("/members/guests")).toBe("guests");
    expect(getActiveMemberListSectionId("/members/families")).toBe("families");
    expect(getActiveMemberListSectionId("/members/families/f1")).toBe(
      "families"
    );
  });

  it("връща null за невалидни или външни пътища", () => {
    expect(getActiveMemberListSectionId("/members/m123")).toBeNull();
    expect(getActiveMemberListSectionId("/members/unknown")).toBeNull();
    expect(getActiveMemberListSectionId("/dashboard")).toBeNull();
    expect(getActiveMemberListSectionId("/")).toBeNull();
  });
});
