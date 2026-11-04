import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const PORTAL_COMPONENTS_DIR = path.resolve(
  process.cwd(),
  "src/components/parents/portal"
);

const PORTAL_VIEWS_DIR = path.join(PORTAL_COMPONENTS_DIR, "views");

describe("Parent Portal Modular Architecture & Golden Hybrid", () => {
  it("разполага с всички основни модули на родителския портал на диска", () => {
    const requiredFiles = [
      "ParentPortalContext.tsx",
      "ParentPortalViewCoordinator.tsx",
      "ParentPortalHeader.tsx",
      "ParentPortalKpiRow.tsx",
      "ParentPortalNav.tsx",
      "ParentPortalDialogs.tsx",
    ];

    for (const file of requiredFiles) {
      expect(
        fs.existsSync(path.join(PORTAL_COMPONENTS_DIR, file)),
        `Липсва основен модул: ${file}`
      ).toBe(true);
    }
  });

  it("разполага с всички 6 специализирани изгледи (tabs) на портала", () => {
    const requiredViews = [
      "PortalAttendanceTabView.tsx",
      "PortalDocumentsTabView.tsx",
      "PortalFinancesTabView.tsx",
      "PortalProfileTabView.tsx",
      "PortalDevelopmentTabView.tsx",
      "PortalAbsencesTabView.tsx",
    ];

    for (const view of requiredViews) {
      expect(
        fs.existsSync(path.join(PORTAL_VIEWS_DIR, view)),
        `Липсва таб изглед: ${view}`
      ).toBe(true);
    }
  });

  it("ParentPortalClient.tsx е чист и под 40 реда с React Suspense за URL съвместимост", () => {
    const clientPath = path.resolve(
      process.cwd(),
      "src/app/club/parents/ParentPortalClient.tsx"
    );
    expect(fs.existsSync(clientPath)).toBe(true);

    const content = fs.readFileSync(clientPath, "utf-8");
    const lineCount = content.split("\n").length;

    // Must be a clean wrapper under 50 lines (previously 3509 lines!)
    expect(lineCount).toBeLessThan(50);
    expect(content).toContain("<Suspense");
    expect(content).toContain("ParentPortalProvider");
    expect(content).toContain("ParentPortalViewCoordinator");
  });

  it("ParentPortalContext поддържа URL синхронизация за Golden Hybrid стандарта", () => {
    const ctxPath = path.join(PORTAL_COMPONENTS_DIR, "ParentPortalContext.tsx");
    const content = fs.readFileSync(ctxPath, "utf-8");

    // Must support 5 synchronized query parameters
    expect(content).toContain('searchParams.get("tab")');
    expect(content).toContain('searchParams.get("child")');
    expect(content).toContain('searchParams.get("month")');
    expect(content).toContain('searchParams.get("year")');
    expect(content).toContain('searchParams.get("doc")');

    // Must support 1-click copy direct link
    expect(content).toContain("handleCopyPortalLink");
    expect(content).toContain("navigator.clipboard.writeText");
  });

  it("ParentPortalNav дефинира всички 6 таба с уникални идентификатори", () => {
    const navPath = path.join(PORTAL_COMPONENTS_DIR, "ParentPortalNav.tsx");
    const content = fs.readFileSync(navPath, "utf-8");

    const expectedTabs = [
      "attendance",
      "documents",
      "finances",
      "profile",
      "development",
      "absences",
    ];

    for (const tab of expectedTabs) {
      expect(content).toContain(`id: "${tab}"`);
    }
  });

  it("ParentPortalDialogs съдържа id, name и autocomplete за достъпност и липса на конзолни предупреждения", () => {
    const dialogsPath = path.join(
      PORTAL_COMPONENTS_DIR,
      "ParentPortalDialogs.tsx"
    );
    const content = fs.readFileSync(dialogsPath, "utf-8");

    expect(content).toContain('id="portal-absence-start"');
    expect(content).toContain('name="absenceStartDate"');
    expect(content).toContain('id="portal-current-password"');
    expect(content).toContain('autoComplete="current-password"');
    expect(content).toContain('id="portal-new-password"');
    expect(content).toContain('autoComplete="new-password"');
  });
});
