import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  DOCUMENT_SECTIONS,
  getActiveDocumentSectionId,
} from "../document-sections";

const DOCUMENTS_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/documents"
);

describe("document sections (hierarchical sub-pages standard)", () => {
  it("има уникални id и pathSuffix за всички секции", () => {
    const ids = DOCUMENT_SECTIONS.map((s) => s.id);
    const suffixes = DOCUMENT_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it("определя активната секция по pathname коректно", () => {
    expect(getActiveDocumentSectionId("/documents")).toBe("templates");
    expect(getActiveDocumentSectionId("/documents/")).toBe("templates");
    expect(getActiveDocumentSectionId("/documents/templates")).toBe(
      "templates"
    );
    expect(getActiveDocumentSectionId("/documents/templates/new")).toBe(
      "templates"
    );
    expect(getActiveDocumentSectionId("/documents/signed")).toBe("signed");
    expect(getActiveDocumentSectionId("/documents/signed/item-123")).toBe(
      "signed"
    );
    expect(getActiveDocumentSectionId("/dashboard")).toBeNull();
    expect(getActiveDocumentSectionId("/catalogs")).toBeNull();
  });

  it("всяка секция от конфига има съществуваща страница page.tsx на диска", () => {
    for (const section of DOCUMENT_SECTIONS) {
      const pageFile = path.join(
        DOCUMENTS_ROUTE_DIR,
        section.pathSuffix,
        "page.tsx"
      );
      expect(
        fs.existsSync(pageFile),
        `Липсва page.tsx за секция "${section.id}" на път: ${pageFile}`
      ).toBe(true);
    }
  });

  it("главният индекс /documents/page.tsx съществува на диска", () => {
    const indexPage = path.join(DOCUMENTS_ROUTE_DIR, "page.tsx");
    expect(fs.existsSync(indexPage)).toBe(true);
  });
});
