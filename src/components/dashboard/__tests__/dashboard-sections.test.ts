import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DASHBOARD_SECTIONS,
  getActiveDashboardSectionId,
} from "../dashboard-sections";

const DASHBOARD_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/dashboard"
);

describe("dashboard sections (hierarchical sub-pages standard)", () => {
  it("има уникални id и pathSuffix за всички секции", () => {
    const ids = DASHBOARD_SECTIONS.map((s) => s.id);
    const suffixes = DASHBOARD_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it("определя активната секция по pathname коректно", () => {
    expect(getActiveDashboardSectionId("/dashboard")).toBe("overview");
    expect(getActiveDashboardSectionId("/dashboard/")).toBe("overview");
    expect(getActiveDashboardSectionId("/dashboard/overview")).toBe("overview");
    expect(getActiveDashboardSectionId("/dashboard/activity")).toBe("activity");
    expect(getActiveDashboardSectionId("/dashboard/logs")).toBe("logs");
    expect(getActiveDashboardSectionId("/members")).toBeNull();
    expect(getActiveDashboardSectionId("/catalogs")).toBeNull();
  });

  it("всяка секция от конфига има съществуваща страница page.tsx на диска", () => {
    for (const section of DASHBOARD_SECTIONS) {
      const pageFile =
        section.id === "overview"
          ? path.join(DASHBOARD_ROUTE_DIR, "page.tsx")
          : path.join(DASHBOARD_ROUTE_DIR, section.pathSuffix, "page.tsx");

      expect(
        fs.existsSync(pageFile),
        `Липсва page.tsx за секция "${section.id}" на път: ${pageFile}`
      ).toBe(true);
    }
  });

  it("секцията overview има и алтернативен път /dashboard/overview на диска", () => {
    const overviewPageFile = path.join(
      DASHBOARD_ROUTE_DIR,
      "overview",
      "page.tsx"
    );
    expect(fs.existsSync(overviewPageFile)).toBe(true);
  });
});
