import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getActiveMemberSectionId,
  MEMBER_PROFILE_SECTIONS,
} from "../member-profile-sections";

const MEMBER_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/members/[id]/(tabs)"
);

describe("member profile sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = MEMBER_PROFILE_SECTIONS.map((s) => s.id);
    const suffixes = MEMBER_PROFILE_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(MEMBER_PROFILE_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = path.join(MEMBER_ROUTE_DIR, suffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("всяка page.tsx под (tabs) е регистрирана в навигацията", () => {
    const dirs = fs
      .readdirSync(MEMBER_ROUTE_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/${d.name}`);
    // `/personal` е псевдоним на индексната страница ("")
    const registered = [
      ...MEMBER_PROFILE_SECTIONS.map((s) => s.pathSuffix),
      "/personal",
    ];
    for (const dir of dirs) {
      expect(registered).toContain(dir);
    }
  });

  it("определя активната секция по път", () => {
    expect(getActiveMemberSectionId("/members/a1", "a1")).toBe("personal");
    expect(getActiveMemberSectionId("/members/a1/personal", "a1")).toBe(
      "personal"
    );
    expect(getActiveMemberSectionId("/members/a1/documents", "a1")).toBe(
      "documents"
    );
    expect(getActiveMemberSectionId("/members/a1/ai-workouts", "a1")).toBe(
      "ai-workouts"
    );
    expect(
      getActiveMemberSectionId("/members/a1/athlete-card", "a1")
    ).toBeNull();
  });
});
