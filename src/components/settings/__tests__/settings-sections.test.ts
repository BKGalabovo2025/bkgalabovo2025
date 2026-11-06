import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getActiveSettingsSectionId,
  SETTINGS_SECTIONS,
} from "../settings-sections";

const SETTINGS_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/settings"
);

describe("settings sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = SETTINGS_SECTIONS.map((s) => s.id);
    const suffixes = SETTINGS_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(SETTINGS_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = path.join(SETTINGS_ROUTE_DIR, suffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("определя активната секция по път", () => {
    expect(getActiveSettingsSectionId("/settings")).toBe("general");
    expect(getActiveSettingsSectionId("/settings/")).toBe("general");
    expect(getActiveSettingsSectionId("/settings/general")).toBe("general");
    expect(getActiveSettingsSectionId("/settings/branding")).toBe("branding");
    expect(getActiveSettingsSectionId("/settings/security")).toBe("security");
    expect(getActiveSettingsSectionId("/settings/profile")).toBe("profile");
    expect(getActiveSettingsSectionId("/settings/recovery")).toBe("recovery");
    expect(getActiveSettingsSectionId("/settings/team")).toBe("team");
    expect(getActiveSettingsSectionId("/settings/audit")).toBe("audit");
    expect(getActiveSettingsSectionId("/settings/backup")).toBe("backup");
    expect(getActiveSettingsSectionId("/settings/unknown")).toBeNull();
    expect(getActiveSettingsSectionId("/dashboard")).toBeNull();
  });
});
