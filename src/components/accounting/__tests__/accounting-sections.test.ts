import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ACCOUNTING_SECTIONS,
  getAccountingSectionHref,
  getActiveAccountingSectionId,
} from "../accounting-sections";

const ACCOUNTING_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/accounting"
);

describe("accounting sections", () => {
  it("има уникални id, pathSuffix и генерирани href", () => {
    const ids = ACCOUNTING_SECTIONS.map((s) => s.id);
    const suffixes = ACCOUNTING_SECTIONS.map((s) => s.pathSuffix);
    const hrefs = ACCOUNTING_SECTIONS.map((s) =>
      getAccountingSectionHref(s.id)
    );

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("съдържа очакваните счетоводни секции с валидни метаданни", () => {
    expect(ACCOUNTING_SECTIONS.map((s) => s.id)).toEqual([
      "all",
      "non-commercial",
      "commercial",
    ]);

    for (const section of ACCOUNTING_SECTIONS) {
      expect(section.label.trim().length).toBeGreaterThan(0);
      expect(section.tooltip.trim().length).toBeGreaterThan(0);
      expect(section.icon).toBeDefined();
    }
  });

  it.each(ACCOUNTING_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = suffix
        ? path.join(ACCOUNTING_ROUTE_DIR, suffix, "page.tsx")
        : path.join(ACCOUNTING_ROUTE_DIR, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("генерира коректни href адреси за всяка секция", () => {
    expect(getAccountingSectionHref("all")).toBe("/accounting");
    expect(getAccountingSectionHref("non-commercial")).toBe(
      "/accounting/non-commercial"
    );
    expect(getAccountingSectionHref("commercial")).toBe(
      "/accounting/commercial"
    );
  });

  it("определя активната секция по pathname", () => {
    expect(getActiveAccountingSectionId("/accounting")).toBe("all");
    expect(getActiveAccountingSectionId("/accounting/")).toBe("all");
    expect(getActiveAccountingSectionId("/accounting/non-commercial")).toBe(
      "non-commercial"
    );
    expect(getActiveAccountingSectionId("/accounting/non-commercial/")).toBe(
      "non-commercial"
    );
    expect(getActiveAccountingSectionId("/accounting/commercial")).toBe(
      "commercial"
    );
    expect(getActiveAccountingSectionId("/accounting/trips/trip-1")).toBeNull();
    expect(getActiveAccountingSectionId("/accounting/unknown")).toBeNull();
    expect(getActiveAccountingSectionId("/members")).toBeNull();
    expect(getActiveAccountingSectionId("/")).toBeNull();
  });
});
