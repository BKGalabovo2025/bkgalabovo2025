import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CATALOG_SECTIONS,
  getActiveCatalogSectionId,
} from "../catalog-sections";

const CATALOGS_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/catalogs"
);

describe("catalog sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix за всички секции", () => {
    const ids = CATALOG_SECTIONS.map((s) => s.id);
    const suffixes = CATALOG_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it("определя активната секция по pathname коректно", () => {
    expect(getActiveCatalogSectionId("/catalogs")).toBe("trainings");
    expect(getActiveCatalogSectionId("/catalogs/")).toBe("trainings");
    expect(getActiveCatalogSectionId("/catalogs/trainings")).toBe("trainings");
    expect(getActiveCatalogSectionId("/catalogs/trainings/new")).toBe(
      "trainings"
    );
    expect(getActiveCatalogSectionId("/catalogs/club-services")).toBe(
      "club-services"
    );
    expect(getActiveCatalogSectionId("/catalogs/club-services/new")).toBe(
      "club-services"
    );
    expect(getActiveCatalogSectionId("/catalogs/recovery")).toBe("recovery");
    expect(getActiveCatalogSectionId("/catalogs/recovery/new")).toBe(
      "recovery"
    );
    expect(getActiveCatalogSectionId("/catalogs/shop")).toBe("shop");
    expect(getActiveCatalogSectionId("/catalogs/shop/new")).toBe("shop");

    // Aliases
    expect(getActiveCatalogSectionId("/catalogs/services")).toBe("trainings");
    expect(getActiveCatalogSectionId("/catalogs/general")).toBe(
      "club-services"
    );
    expect(getActiveCatalogSectionId("/catalogs/inventory")).toBe("shop");

    // Other routes
    expect(getActiveCatalogSectionId("/dashboard")).toBeNull();
    expect(getActiveCatalogSectionId("/members")).toBeNull();
  });

  it("всички главни секции имат съществуващи страници на диска", () => {
    for (const section of CATALOG_SECTIONS) {
      const pagePath = path.join(
        CATALOGS_ROUTE_DIR,
        section.pathSuffix,
        "page.tsx"
      );
      expect(
        fs.existsSync(pagePath),
        `Липсва страница за секция ${section.id}: ${pagePath}`
      ).toBe(true);
    }
  });
});
