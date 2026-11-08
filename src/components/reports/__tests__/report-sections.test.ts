import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { getActiveReportSectionId, REPORT_SECTIONS } from "../report-sections";

const REPORTS_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/reports"
);

describe("reports sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = REPORT_SECTIONS.map((s) => s.id);
    const suffixes = REPORT_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(REPORT_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = path.join(REPORTS_ROUTE_DIR, suffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("всяка секционна папка под /reports е регистрирана в навигацията", () => {
    const dirs = fs
      .readdirSync(REPORTS_ROUTE_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

    const registered = REPORT_SECTIONS.map((s) => s.pathSuffix);
    for (const dir of dirs) {
      expect(registered).toContain(dir);
    }
  });

  it("определя активната секция по път", () => {
    expect(getActiveReportSectionId("/reports")).toBe("financial");
    expect(getActiveReportSectionId("/reports/")).toBe("financial");
    expect(getActiveReportSectionId("/reports/financial")).toBe("financial");
    expect(getActiveReportSectionId("/reports/liabilities")).toBe(
      "liabilities"
    );
    expect(getActiveReportSectionId("/reports/attendance")).toBe("attendance");
    expect(getActiveReportSectionId("/reports/restock")).toBe("restock");
    expect(getActiveReportSectionId("/reports/annual")).toBe("annual");
    expect(getActiveReportSectionId("/reports/unknown")).toBeNull();
    expect(getActiveReportSectionId("/dashboard")).toBeNull();
  });
});
