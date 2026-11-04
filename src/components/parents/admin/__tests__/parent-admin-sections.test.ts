import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getActiveParentAdminSectionId,
  PARENT_ADMIN_SECTIONS,
} from "../parent-admin-sections";

const PARENTS_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/parents"
);

const VIEWS_DIR = path.resolve(
  process.cwd(),
  "src/components/parents/admin/views"
);

describe("parents admin sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = PARENT_ADMIN_SECTIONS.map((s) => s.id);
    const suffixes = PARENT_ADMIN_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it("определя активната секция по път", () => {
    expect(getActiveParentAdminSectionId("/parents")).toBe("requests");
    expect(getActiveParentAdminSectionId("/parents/")).toBe("requests");
    expect(getActiveParentAdminSectionId("/parents/requests")).toBe("requests");
    expect(getActiveParentAdminSectionId("/parents/pending")).toBe("requests");
    expect(getActiveParentAdminSectionId("/parents/accounts")).toBe("accounts");
    expect(getActiveParentAdminSectionId("/parents/parents")).toBe("accounts");
    expect(getActiveParentAdminSectionId("/parents/absences")).toBe("absences");
    expect(getActiveParentAdminSectionId("/parents/corrections")).toBe(
      "corrections"
    );
    expect(getActiveParentAdminSectionId("/parents/activity")).toBe("activity");
    expect(getActiveParentAdminSectionId("/parents/messages")).toBe("messages");
    expect(getActiveParentAdminSectionId("/parents/communication")).toBe(
      "messages"
    );
    expect(getActiveParentAdminSectionId("/other")).toBeNull();
  });

  it("всяка секция има съществуваща страница на диска", () => {
    // Root layout, loading, error, and page
    expect(fs.existsSync(path.join(PARENTS_ROUTE_DIR, "layout.tsx"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(PARENTS_ROUTE_DIR, "loading.tsx"))).toBe(
      true
    );
    expect(fs.existsSync(path.join(PARENTS_ROUTE_DIR, "error.tsx"))).toBe(true);
    expect(fs.existsSync(path.join(PARENTS_ROUTE_DIR, "page.tsx"))).toBe(true);

    for (const section of PARENT_ADMIN_SECTIONS) {
      if (section.pathSuffix === "") {
        expect(fs.existsSync(path.join(PARENTS_ROUTE_DIR, "page.tsx"))).toBe(
          true
        );
      } else {
        const pagePath = path.join(
          PARENTS_ROUTE_DIR,
          section.pathSuffix,
          "page.tsx"
        );
        expect(
          fs.existsSync(pagePath),
          `Липсва страница за секция ${section.id}: ${pagePath}`
        ).toBe(true);
      }
    }
  });

  it("всички alias пътища съществуват", () => {
    const aliases = ["pending", "parents", "communication"];
    for (const alias of aliases) {
      const pagePath = path.join(PARENTS_ROUTE_DIR, alias, "page.tsx");
      expect(
        fs.existsSync(pagePath),
        `Липсва alias страница: ${pagePath}`
      ).toBe(true);
    }
  });

  it("всички модулни views компоненти съществуват", () => {
    const views = [
      "ParentRequestsSectionView.tsx",
      "ParentAccountsSectionView.tsx",
      "ParentAbsencesSectionView.tsx",
      "ParentCorrectionsSectionView.tsx",
      "ParentActivitySectionView.tsx",
      "ParentMessagesSectionView.tsx",
    ];

    for (const view of views) {
      const viewPath = path.join(VIEWS_DIR, view);
      expect(
        fs.existsSync(viewPath),
        `Липсва view компонент: ${viewPath}`
      ).toBe(true);
    }
  });

  it("ParentAdminContext поддържа всички златни хибридни URL параметри", () => {
    const contextFilePath = path.resolve(
      process.cwd(),
      "src/components/parents/admin/ParentAdminContext.tsx"
    );
    const content = fs.readFileSync(contextFilePath, "utf-8");

    const expectedQueryParams = [
      "action",
      "approve",
      "reject",
      "call",
      "message",
      "replyAbsence",
      "linkChild",
      "permissions",
      "child",
      "deleteParent",
      "approveCorrection",
      "rejectCorrection",
      "credentials",
      "status",
      "parent",
      "channel",
    ];

    for (const param of expectedQueryParams) {
      expect(
        content.includes(`searchParams.get("${param}")`),
        `ParentAdminContext трябва да следи URL параметър "${param}"`
      ).toBe(true);
    }
  });
});
