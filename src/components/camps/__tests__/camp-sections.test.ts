import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { CAMP_SECTIONS, getActiveCampSectionId } from "../camp-sections";

const CAMPS_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/training/camps/[id]"
);

describe("camp sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = CAMP_SECTIONS.map((s) => s.id);
    const suffixes = CAMP_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(CAMP_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = path.join(CAMPS_ROUTE_DIR, suffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("определя активната секция по път", () => {
    expect(getActiveCampSectionId("/training/camps/camp123", "camp123")).toBe(
      "itinerary"
    );
    expect(getActiveCampSectionId("/training/camps/camp123/", "camp123")).toBe(
      "itinerary"
    );
    expect(
      getActiveCampSectionId("/training/camps/camp123/itinerary", "camp123")
    ).toBe("itinerary");
    expect(
      getActiveCampSectionId("/training/camps/camp123/attendees", "camp123")
    ).toBe("attendees");
    expect(
      getActiveCampSectionId("/training/camps/camp123/unknown", "camp123")
    ).toBeNull();
    expect(
      getActiveCampSectionId("/training/camps/other/itinerary", "camp123")
    ).toBeNull();
  });
});
