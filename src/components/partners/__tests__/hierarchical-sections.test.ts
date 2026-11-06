import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  ACCOUNTING_SECTIONS,
  getAccountingSectionHref,
  getActiveAccountingSectionId,
} from "@/components/accounting/accounting-sections";
import {
  getActiveTripSectionId,
  getTripSectionHref,
  TRIP_DETAIL_SECTIONS,
} from "@/components/business-trips/details/trip-details-sections";
import {
  DECLARATION_SECTIONS,
  getActiveDeclarationSectionId,
  getDeclarationSectionHref,
} from "@/components/declarations/declaration-sections";
import {
  getActiveInquirySectionId,
  getInquirySectionHref,
  INQUIRY_SECTIONS,
} from "@/components/inquiries/inquiry-sections";
import {
  getActiveInventorySectionId,
  getInventorySectionHref,
  INVENTORY_SECTIONS,
} from "@/components/inventory/inventory-sections";
import {
  getActiveParentPortalSectionId,
  PARENT_PORTAL_SECTIONS,
} from "@/components/parents/portal/parent-portal-sections";
import {
  getActivePartnerSectionId,
  getPartnerSectionHref,
  PARTNER_SECTIONS,
} from "@/components/partners/partner-sections";
import {
  getActiveRankingSectionId,
  getRankingSectionHref,
  RANKING_SECTIONS,
} from "@/components/rankings/ranking-sections";
import {
  getActiveSalesListSectionId,
  SALES_LIST_SECTIONS,
} from "@/components/sales/sales-list-sections";
import {
  getActiveScheduleSectionId,
  getScheduleSectionHref,
  SCHEDULE_SECTIONS,
} from "@/components/schedule/schedule-sections";
import {
  getActiveTournamentListSectionId,
  TOURNAMENT_LIST_SECTIONS,
} from "@/components/tournaments/tournament-list-sections";
import {
  ANNUAL_PLAN_SECTIONS,
  getActiveAnnualPlanSection,
} from "@/components/training/annual-plans/annual-plan-sections";
import {
  ASSESSMENT_SECTIONS,
  getActiveAssessmentSection,
} from "@/components/training/assessments/assessment-sections";
import {
  BEEP_TEST_SECTIONS,
  getActiveBeepTestSection,
} from "@/components/training/beep-test/beep-test-sections";
import {
  CAMPS_LIST_SECTIONS,
  getActiveCampsListSection,
} from "@/components/training/camps/camps-list-sections";
import {
  EXERCISE_SECTIONS,
  getActiveExerciseSectionId,
  getExerciseSectionHref,
} from "@/components/training/exercises/exercise-sections";
import {
  getActivePlannerSection,
  PLANNER_SECTIONS,
} from "@/components/training/planner/planner-sections";
import {
  getActiveShadowSection,
  SHADOW_SECTIONS,
} from "@/components/training/shadow/shadow-sections";
import {
  getActiveTheorySection,
  THEORY_SECTIONS,
} from "@/components/training/theory/theory-sections";

const APP = path.resolve(__dirname, "../../../app/(protected)");

const modules = [
  {
    name: "accounting",
    sections: ACCOUNTING_SECTIONS,
    href: getAccountingSectionHref,
    active: getActiveAccountingSectionId,
    base: "accounting",
  },
  {
    name: "schedule",
    sections: SCHEDULE_SECTIONS,
    href: getScheduleSectionHref,
    active: getActiveScheduleSectionId,
    base: "schedule",
  },
  {
    name: "partners",
    sections: PARTNER_SECTIONS,
    href: getPartnerSectionHref,
    active: getActivePartnerSectionId,
    base: "partners",
  },
  {
    name: "exercises",
    sections: EXERCISE_SECTIONS,
    href: getExerciseSectionHref,
    active: getActiveExerciseSectionId,
    base: "training/exercises",
  },
  {
    name: "trip-details",
    sections: TRIP_DETAIL_SECTIONS,
    href: (id: never) => getTripSectionHref("test-trip", id),
    active: (url: string) => getActiveTripSectionId(url, "test-trip"),
    base: "accounting/trips/[id]/(tabs)",
  },
  {
    name: "declarations",
    sections: DECLARATION_SECTIONS,
    href: getDeclarationSectionHref,
    active: getActiveDeclarationSectionId,
    base: "declarations",
  },
  {
    name: "inquiries",
    sections: INQUIRY_SECTIONS,
    href: getInquirySectionHref,
    active: getActiveInquirySectionId,
    base: "inquiries",
  },
  {
    name: "inventory",
    sections: INVENTORY_SECTIONS,
    href: getInventorySectionHref,
    active: getActiveInventorySectionId,
    base: "inventory",
  },
  {
    name: "rankings",
    sections: RANKING_SECTIONS,
    href: getRankingSectionHref,
    active: getActiveRankingSectionId,
    base: "rankings",
  },
] as const;

describe.each(modules)("hierarchical sections: $name", (m) => {
  const sections = m.sections as readonly { id: string; pathSuffix: string }[];
  const href = m.href as (id: never) => string;
  const active = m.active as (p: string) => string | null;

  it("has unique ids and path suffixes", () => {
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    expect(new Set(sections.map((s) => s.pathSuffix)).size).toBe(
      sections.length
    );
  });

  it("every section has a page.tsx", () => {
    for (const s of sections) {
      expect(
        fs.existsSync(path.join(APP, m.base, s.pathSuffix, "page.tsx"))
      ).toBe(true);
    }
  });

  it("resolves the active section from its own href", () => {
    for (const s of sections) {
      expect(active(href(s.id as never))).toBe(s.id);
    }
    expect(active("/dashboard")).toBeNull();
  });
});

describe("newly migrated hierarchical training and operational modules", () => {
  it("shadow sections configuration", () => {
    expect(SHADOW_SECTIONS).toHaveLength(2);
    expect(getActiveShadowSection("/training/shadow")).toBe("setup");
    expect(getActiveShadowSection("/training/shadow/history")).toBe("history");
  });

  it("beep test sections configuration", () => {
    expect(BEEP_TEST_SECTIONS).toHaveLength(3);
    expect(getActiveBeepTestSection("/training/beep-test")).toBe("new");
    expect(getActiveBeepTestSection("/training/beep-test/history")).toBe(
      "history"
    );
    expect(getActiveBeepTestSection("/training/beep-test/norms")).toBe("norms");
  });

  it("assessments sections configuration", () => {
    expect(ASSESSMENT_SECTIONS).toHaveLength(2);
    expect(getActiveAssessmentSection("/training/assessments")).toBe("bwf");
    expect(getActiveAssessmentSection("/training/assessments/history")).toBe(
      "history"
    );
  });

  it("theory sections configuration", () => {
    expect(THEORY_SECTIONS).toHaveLength(5);
    expect(getActiveTheorySection("/training/theory")).toBe("library");
    expect(getActiveTheorySection("/training/theory/builder")).toBe("builder");
    expect(getActiveTheorySection("/training/theory/sent")).toBe("sent");
    expect(getActiveTheorySection("/training/theory/review")).toBe("review");
    expect(getActiveTheorySection("/training/theory/history")).toBe("history");
  });

  it("annual plans sections configuration", () => {
    expect(ANNUAL_PLAN_SECTIONS).toHaveLength(2);
    expect(getActiveAnnualPlanSection("/training/annual-plans")).toBe("plans");
    expect(getActiveAnnualPlanSection("/training/annual-plans/templates")).toBe(
      "templates"
    );
  });

  it("planner sections configuration", () => {
    expect(PLANNER_SECTIONS).toHaveLength(2);
    expect(getActivePlannerSection("/training/planner")).toBe("upcoming");
    expect(getActivePlannerSection("/training/planner/archive")).toBe(
      "archive"
    );
  });

  it("camps list sections configuration", () => {
    expect(CAMPS_LIST_SECTIONS).toHaveLength(3);
    expect(getActiveCampsListSection("/training/camps")).toBe("all");
    expect(getActiveCampsListSection("/training/camps/upcoming")).toBe(
      "upcoming"
    );
    expect(getActiveCampsListSection("/training/camps/past")).toBe("past");
  });

  it("tournaments list sections configuration", () => {
    expect(TOURNAMENT_LIST_SECTIONS).toHaveLength(3);
    expect(getActiveTournamentListSectionId("/tournaments")).toBe("all");
    expect(getActiveTournamentListSectionId("/tournaments/active")).toBe(
      "active"
    );
    expect(getActiveTournamentListSectionId("/tournaments/completed")).toBe(
      "completed"
    );
  });

  it("sales list sections configuration", () => {
    expect(SALES_LIST_SECTIONS).toHaveLength(3);
    expect(getActiveSalesListSectionId("/sales")).toBe("all");
    expect(getActiveSalesListSectionId("/sales/pending")).toBe("pending");
    expect(getActiveSalesListSectionId("/sales/paid")).toBe("paid");
  });

  it("parent portal sections configuration", () => {
    expect(PARENT_PORTAL_SECTIONS).toHaveLength(6);
    expect(getActiveParentPortalSectionId("/club/parents")).toBe("attendance");
    expect(getActiveParentPortalSectionId("/club/parents/documents")).toBe(
      "documents"
    );
    expect(getActiveParentPortalSectionId("/club/parents/finances")).toBe(
      "finances"
    );
    expect(getActiveParentPortalSectionId("/club/parents/profile")).toBe(
      "profile"
    );
    expect(getActiveParentPortalSectionId("/club/parents/development")).toBe(
      "development"
    );
    expect(getActiveParentPortalSectionId("/club/parents/absences")).toBe(
      "absences"
    );
  });
});
