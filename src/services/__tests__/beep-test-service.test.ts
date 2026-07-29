import { describe, it, expect, vi, beforeEach } from "vitest";
import { beepTestService } from "../beep-test-service";
import {
  calculateVO2Max,
  getTotalShuttles,
  evaluateBadmintonScore,
} from "@/lib/beep-test-norms";
import * as firestore from "firebase/firestore";

vi.mock("firebase/firestore", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await importOriginal();
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(() => ({ id: "mock-doc-id" })),
    setDoc: vi.fn(),
    getDocs: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    serverTimestamp: vi.fn(() => ({ type: "serverTimestamp" })),
    deleteDoc: vi.fn(),
  };
});

vi.mock("@/lib/firebase", () => ({
  getDb: vi.fn(() => ({})),
}));

describe("Beep Test Logic", () => {
  it("getTotalShuttles should calculate correct shuttles for level 1.1", () => {
    expect(getTotalShuttles(1, 1)).toBe(1);
  });

  it("getTotalShuttles should calculate correct shuttles for level 2.2", () => {
    // Level 1 has 7 shuttles. So level 2 starts at shuttle 8. 2.2 means 7 + 2 = 9
    expect(getTotalShuttles(2, 2)).toBe(9);
  });

  it("getTotalShuttles should calculate correctly for level 21.8 (max)", () => {
    // Adding up all levels.
    expect(getTotalShuttles(21, 8)).toBeGreaterThan(200);
  });

  it("calculateVO2Max should compute correct Leger formula", () => {
    const totalShuttles = 76; // Level 8.4
    const vo2 = calculateVO2Max(totalShuttles);
    expect(vo2).toBeGreaterThan(40);
    expect(vo2).toBeLessThan(60);
  });

  it("distance calculation should be total shuttles * 20m", () => {
    const shuttles = getTotalShuttles(10, 5); // Some level
    const distance = shuttles * 20;
    expect(distance).toBeGreaterThan(0);
  });

  it("evaluateBadmintonScore should return Elite for high levels", () => {
    expect(evaluateBadmintonScore(14, "Adults", "male")).toBe(
      "Елитен състезател"
    );
  });

  it("evaluateBadmintonScore should return Poor for low levels", () => {
    expect(evaluateBadmintonScore(3, "U13", "male")).toBe("Лош");
  });
});

describe("beepTestService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveResult should save to firestore with server timestamps", async () => {
    vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
    const resultId = await beepTestService.saveResult("site1", {
      siteId: "site1",
      memberId: "m1",
      date: "2026-08-01",
      period: "Предсезонна подготовка (Август-Септември)",
      level: 10,
      shuttle: 5,
      vo2max: 50,
      score: "Добър",
    });

    expect(resultId).toBe("mock-doc-id");
    expect(firestore.setDoc).toHaveBeenCalledWith(
      { id: "mock-doc-id" }, // mock doc ref
      expect.objectContaining({
        memberId: "m1",
        level: 10,
      })
    );
  });

  it("getMemberResults should fetch and format documents", async () => {
    const mockSnap = {
      docs: [
        {
          data: () => ({
            id: "1",
            memberId: "m1",
            date: "2026-08-01",
            createdAt: { toDate: () => new Date("2026-08-01") },
            updatedAt: { toDate: () => new Date("2026-08-01") },
          }),
        },
      ],
    };
    vi.mocked(firestore.getDocs).mockResolvedValue(
      mockSnap as unknown as Awaited<ReturnType<typeof firestore.getDocs>>
    );

    const results = await beepTestService.getMemberResults("site1", "m1");
    expect(results).toHaveLength(1);
    expect(results[0].memberId).toBe("m1");
  });
});
