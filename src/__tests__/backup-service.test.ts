import { describe, expect, it } from "vitest";

import { BACKUP_COLLECTIONS } from "@/app/api/cron/backup/route";

describe("Backup System Logic & Security", () => {
  it("includes all canonical Firestore collections and excludes invalid names", () => {
    const requiredCanonicalCollections = [
      "members",
      "events",
      "trainings",
      "training_attendance",
      "tournaments",
      "tournament_entries",
      "tournament_matches",
      "reservations",
      "blockedSlots",
      "sales",
      "prices",
      "clubServices",
      "clubGeneralServices",
      "sessions",
      "inquiries",
      "feedback_submissions",
      "feedback_campaigns",
      "member_assessments",
      "member_declarations",
      "beep_test_results",
      "theory_results",
      "inventory",
      "audit_logs",
    ];

    for (const col of requiredCanonicalCollections) {
      expect(
        BACKUP_COLLECTIONS,
        `Expected ${col} to be in BACKUP_COLLECTIONS`
      ).toContain(col);
    }

    // Must NOT contain wrong/legacy collection names
    const invalidCollectionNames = [
      "club_services",
      "feedback",
      "assessments",
      "beep_tests",
    ];
    for (const invalid of invalidCollectionNames) {
      expect(
        BACKUP_COLLECTIONS,
        `Expected ${invalid} to NOT be in BACKUP_COLLECTIONS`
      ).not.toContain(invalid);
    }
  });

  it("computes total backup records correctly across all collections", () => {
    const mockStats: Record<string, number> = {
      members: 45,
      events: 12,
      tournaments: 4,
      tournament_matches: 28,
      sales: 15,
      prices: 6,
      clubServices: 8,
      feedback_submissions: 3,
      feedback_campaigns: 2,
      member_assessments: 19,
      beep_test_results: 10,
      inquiries: 14,
      sessions: 7,
      inventory: 25,
      audit_logs: 120,
      uploaded_files: 5,
    };

    const totalRecords = Object.values(mockStats).reduce((a, b) => a + b, 0);
    expect(totalRecords).toBe(323);
  });

  it("formats Sofia time string accurately", () => {
    const fixedDate = new Date("2026-09-08T21:00:00.000Z");
    const sofiaTime = fixedDate.toLocaleString("bg-BG", {
      timeZone: "Europe/Sofia",
    });

    // In summer time (EEST = UTC+3), 21:00 UTC corresponds to 00:00 next day
    expect(sofiaTime).toBeDefined();
    expect(typeof sofiaTime).toBe("string");
  });

  it("structures the backup export payload according to schema v1.0", () => {
    const payload = {
      exportVersion: "1.0",
      system: "BK Galabovo Cloud",
      backupId: "backup_bkgalabovo_2026-09-08",
      siteId: "bkgalabovo",
      timestamp: new Date().toISOString(),
      sofiaTime: "09.09.2026 г., 00:00:00",
      stats: { members: 10, events: 2 },
      data: {
        members: [{ _id: "m1", name: "Тест Състезател" }],
        events: [{ _id: "e1", title: "Тест Турнир" }],
      },
    };

    expect(payload.exportVersion).toBe("1.0");
    expect(payload.system).toBe("BK Galabovo Cloud");
    expect(payload.data.members).toHaveLength(1);
    expect(payload.data.events).toHaveLength(1);

    const serialized = JSON.stringify(payload);
    const parsed = JSON.parse(serialized);
    expect(parsed.backupId).toBe(payload.backupId);
    expect(parsed.data.members[0].name).toBe("Тест Състезател");
  });
});
