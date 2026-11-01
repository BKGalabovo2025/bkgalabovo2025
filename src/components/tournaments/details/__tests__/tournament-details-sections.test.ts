import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getActiveTournamentSectionId,
  TOURNAMENT_DETAILS_SECTIONS,
} from "../tournament-details-sections";

const TOURNAMENT_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/tournaments/[id]/(tabs)"
);

describe("tournament details sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = TOURNAMENT_DETAILS_SECTIONS.map((s) => s.id);
    const suffixes = TOURNAMENT_DETAILS_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(
    TOURNAMENT_DETAILS_SECTIONS.map((s) => [s.id, s.pathSuffix] as const)
  )("секция %s сочи към съществуваща page.tsx", (_id, suffix) => {
    const file = path.join(TOURNAMENT_ROUTE_DIR, suffix, "page.tsx");
    expect(fs.existsSync(file)).toBe(true);
  });

  it("всяка page.tsx под (tabs) е регистрирана в навигацията", () => {
    const dirs = fs
      .readdirSync(TOURNAMENT_ROUTE_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => `/${d.name}`);
    const registered = [
      ...TOURNAMENT_DETAILS_SECTIONS.map((s) => s.pathSuffix),
      "/participants",
    ];
    for (const dir of dirs) {
      expect(registered).toContain(dir);
    }
  });

  it("определя активната секция по път", () => {
    expect(getActiveTournamentSectionId("/tournaments/t1", "t1")).toBe(
      "participants"
    );
    expect(
      getActiveTournamentSectionId("/tournaments/t1/participants", "t1")
    ).toBe("participants");
    expect(getActiveTournamentSectionId("/tournaments/t1/bracket", "t1")).toBe(
      "bracket"
    );
    expect(getActiveTournamentSectionId("/tournaments/t1/matches", "t1")).toBe(
      "matches"
    );
    expect(getActiveTournamentSectionId("/tournaments/t1/results", "t1")).toBe(
      "results"
    );
    expect(
      getActiveTournamentSectionId("/tournaments/t1/unknown", "t1")
    ).toBeNull();
  });
});
