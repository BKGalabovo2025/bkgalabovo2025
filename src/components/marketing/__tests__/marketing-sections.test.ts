import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getActiveMarketingSectionId,
  MARKETING_SECTIONS,
} from "../marketing-sections";

const MARKETING_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/marketing"
);

describe("marketing sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = MARKETING_SECTIONS.map((s) => s.id);
    const suffixes = MARKETING_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(MARKETING_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = path.join(MARKETING_ROUTE_DIR, suffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("определя активната секция по път", () => {
    expect(getActiveMarketingSectionId("/marketing")).toBe("contacts");
    expect(getActiveMarketingSectionId("/marketing/")).toBe("contacts");
    expect(getActiveMarketingSectionId("/marketing/contacts")).toBe("contacts");
    expect(getActiveMarketingSectionId("/marketing/composer")).toBe("composer");
    expect(getActiveMarketingSectionId("/marketing/templates")).toBe(
      "templates"
    );
    expect(getActiveMarketingSectionId("/marketing/history")).toBe("history");
    expect(getActiveMarketingSectionId("/marketing/automations")).toBe(
      "automations"
    );
    expect(getActiveMarketingSectionId("/marketing/unknown")).toBeNull();
    expect(getActiveMarketingSectionId("/dashboard")).toBeNull();
  });
});
