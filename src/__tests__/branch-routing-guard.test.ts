import { describe, expect, it } from "vitest";

import { getSafeRedirectForBranch, isRouteValidForBranch } from "@/config/sites";

describe("Branch Routing & Safe Redirect Validation Suite", () => {
  describe("isRouteValidForBranch", () => {
    it("allows shared dashboard, members, marketing, feedback, and settings for both branches", () => {
      const sharedRoutes = [
        "/dashboard",
        "/members",
        "/members/new",
        "/marketing",
        "/feedback",
        "/inquiries",
        "/catalogs",
        "/reports",
        "/accounting",
        "/settings",
      ];

      for (const route of sharedRoutes) {
        expect(isRouteValidForBranch(route, "bkgalabovo")).toBe(true);
        expect(isRouteValidForBranch(route, "recoveryzone")).toBe(true);
      }
    });

    it("restricts badminton-specific routes when branch is recoveryzone", () => {
      const bkgRoutes = [
        "/training/planner",
        "/training/camps",
        "/training/annual-plans",
        "/training/exercises",
        "/training/shadow",
        "/training/beep-test",
        "/training/assessments",
        "/training/theory",
        "/tournaments",
        "/tournaments/tourn-123",
        "/rankings",
        "/inventory",
        "/inventory/sales",
      ];

      for (const route of bkgRoutes) {
        expect(isRouteValidForBranch(route, "bkgalabovo")).toBe(true);
        expect(isRouteValidForBranch(route, "recoveryzone")).toBe(false);
      }
    });

    it("restricts recovery-specific routes when branch is bkgalabovo", () => {
      const rzRoutes = [
        "/recovery",
        "/recovery-zone",
        "/finances/recovery",
        "/finances/recovery/rec-123",
      ];

      for (const route of rzRoutes) {
        expect(isRouteValidForBranch(route, "recoveryzone")).toBe(true);
        expect(isRouteValidForBranch(route, "bkgalabovo")).toBe(false);
      }
    });
  });

  describe("getSafeRedirectForBranch", () => {
    it("redirects to /dashboard when current route is invalid for target branch", () => {
      // User is on a court training session and switches to recoveryzone
      expect(
        getSafeRedirectForBranch("/training/planner/session-123/active", "recoveryzone")
      ).toBe("/dashboard");

      // User is on tournaments bracket and switches to recoveryzone
      expect(
        getSafeRedirectForBranch("/tournaments/championship-2026", "recoveryzone")
      ).toBe("/dashboard");

      // User is on recovery procedures and switches to bkgalabovo
      expect(
        getSafeRedirectForBranch("/finances/recovery", "bkgalabovo")
      ).toBe("/dashboard");
    });

    it("retains the current route when valid for target branch", () => {
      expect(getSafeRedirectForBranch("/members", "recoveryzone")).toBe("/members");
      expect(getSafeRedirectForBranch("/reports", "bkgalabovo")).toBe("/reports");
      expect(getSafeRedirectForBranch("/dashboard", "recoveryzone")).toBe("/dashboard");
    });
  });
});
