import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  FEEDBACK_SECTIONS,
  getActiveFeedbackSectionId,
} from "../feedback-sections";

const FEEDBACK_ROUTE_DIR = path.resolve(
  process.cwd(),
  "src/app/(protected)/feedback"
);

describe("feedback sections (hierarchical sub-pages)", () => {
  it("има уникални id и pathSuffix", () => {
    const ids = FEEDBACK_SECTIONS.map((s) => s.id);
    const suffixes = FEEDBACK_SECTIONS.map((s) => s.pathSuffix);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(suffixes).size).toBe(suffixes.length);
  });

  it.each(FEEDBACK_SECTIONS.map((s) => [s.id, s.pathSuffix] as const))(
    "секция %s сочи към съществуваща page.tsx",
    (_id, suffix) => {
      const file = path.join(FEEDBACK_ROUTE_DIR, suffix, "page.tsx");
      expect(fs.existsSync(file)).toBe(true);
    }
  );

  it("определя активната секция по път", () => {
    expect(getActiveFeedbackSectionId("/feedback")).toBe("submissions");
    expect(getActiveFeedbackSectionId("/feedback/")).toBe("submissions");
    expect(getActiveFeedbackSectionId("/feedback/submissions")).toBe(
      "submissions"
    );
    expect(getActiveFeedbackSectionId("/feedback/campaigns")).toBe("campaigns");
    expect(getActiveFeedbackSectionId("/feedback/templates")).toBe("templates");
    expect(getActiveFeedbackSectionId("/feedback/unknown")).toBeNull();
    expect(getActiveFeedbackSectionId("/dashboard")).toBeNull();
  });
});
