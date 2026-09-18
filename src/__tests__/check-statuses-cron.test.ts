import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  processMemberStatus,
} from "@/app/api/cron/check-statuses/route";

describe("check-statuses cron logic & boundary tests", () => {
  const mockNow = new Date("2026-09-18T10:00:00.000Z");
  const thirtyDaysAgo = new Date(mockNow);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const mockFormatDateTime = () => "18.09.2026 г., 13:00:00";

  it("deactivates active member when last activity is older than 30 days", () => {
    const thirtyOneDaysAgo = new Date(thirtyDaysAgo);
    thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 1);

    const { newStatus, note } = processMemberStatus(
      "active",
      thirtyOneDaysAgo,
      thirtyDaysAgo,
      mockFormatDateTime
    );

    expect(newStatus).toBe("inactive");
    expect(note).toContain(
      'Системата автоматично промени статуса на "неактивен"'
    );
    expect(note).toContain("18.09.2026 г., 13:00:00");
  });

  it("activates inactive member when new activity is within the last 30 days", () => {
    const fiveDaysAgo = new Date(mockNow);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const { newStatus, note } = processMemberStatus(
      "inactive",
      fiveDaysAgo,
      thirtyDaysAgo,
      mockFormatDateTime
    );

    expect(newStatus).toBe("active");
    expect(note).toContain(
      'Системата автоматично промени статуса на "активен"'
    );
  });

  it("leaves active member unchanged when activity is within 30 days", () => {
    const tenDaysAgo = new Date(mockNow);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const { newStatus, note } = processMemberStatus(
      "active",
      tenDaysAgo,
      thirtyDaysAgo,
      mockFormatDateTime
    );

    expect(newStatus).toBe("active");
    expect(note).toBe("");
  });

  it("leaves inactive member unchanged when activity remains older than 30 days", () => {
    const fiftyDaysAgo = new Date(mockNow);
    fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

    const { newStatus, note } = processMemberStatus(
      "inactive",
      fiftyDaysAgo,
      thirtyDaysAgo,
      mockFormatDateTime
    );

    expect(newStatus).toBe("inactive");
    expect(note).toBe("");
  });

  it("handles exact 30-day boundary correctly (not strictly less than)", () => {
    // If activity is exactly thirtyDaysAgo (milliseconds match)
    const exactBoundary = new Date(thirtyDaysAgo);

    const { newStatus: statusActive } = processMemberStatus(
      "active",
      exactBoundary,
      thirtyDaysAgo,
      mockFormatDateTime
    );
    expect(statusActive).toBe("active");

    const { newStatus: statusInactive } = processMemberStatus(
      "inactive",
      exactBoundary,
      thirtyDaysAgo,
      mockFormatDateTime
    );
    expect(statusInactive).toBe("active");
  });

  it("formats Sofia date-time string without errors", () => {
    const formatted = formatDateTime();
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(5);
  });
});
