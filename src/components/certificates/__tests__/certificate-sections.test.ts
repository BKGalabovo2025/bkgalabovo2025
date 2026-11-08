import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CERTIFICATE_SECTIONS,
  getActiveCertificateSectionId,
} from "../certificate-sections";

const CERTIFICATES_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/certificates"
);

describe("certificates sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = CERTIFICATE_SECTIONS.map((s) => s.id);
    const suffixes = CERTIFICATE_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(CERTIFICATE_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const cleanSuffix = suffix.replace(/^\/+/, "");
      const file = path.join(CERTIFICATES_ROUTE_DIR, cleanSuffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("определя активната секция по път", () => {
    expect(getActiveCertificateSectionId("/certificates")).toBe("issue");
    expect(getActiveCertificateSectionId("/certificates/")).toBe("issue");
    expect(getActiveCertificateSectionId("/certificates/issue")).toBe("issue");
    expect(getActiveCertificateSectionId("/certificates/studio")).toBe(
      "studio"
    );
    expect(getActiveCertificateSectionId("/certificates/templates")).toBe(
      "templates"
    );
    expect(getActiveCertificateSectionId("/certificates/issued")).toBe(
      "issued"
    );
    expect(getActiveCertificateSectionId("/certificates/unknown")).toBeNull();
    expect(getActiveCertificateSectionId("/dashboard")).toBeNull();
  });
});
