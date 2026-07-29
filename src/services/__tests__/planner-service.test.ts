import { describe, it, expect, vi, beforeEach } from "vitest";
import { plannerService } from "../planner-service";
import * as firestore from "firebase/firestore";
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getDocs: vi.fn(),
    doc: vi.fn((_, _path, id) => ({ id: id || "mock-doc-id" })),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    where: vi.fn(),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      commit: vi.fn(),
    })),
  };
});

vi.mock("@/lib/firebase", () => ({
  db: {},
}));

describe("plannerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Exercises", () => {
    it("getExercises should query and return mapped exercises", async () => {
      const mockSnap = {
        docs: [
          { id: "e1", data: () => ({ name: "Test Exercise", siteId: "site1" }) },
        ],
      };
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnap as any);

      const exercises = await plannerService.getExercises("site1");
      expect(exercises).toHaveLength(1);
      expect(exercises[0].id).toBe("e1");
      expect(exercises[0].name).toBe("Test Exercise");
    });

    it("injectSeedExercises should batch set missing exercises", async () => {
      const mockBatch = { set: vi.fn(), commit: vi.fn() };
      vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);

      // Mock getDocs so it appears one exercise already exists
      const mockSnap = {
        docs: [
          { data: () => ({ name: INITIAL_BWF_EXERCISES[0].name }) },
        ],
      };
      vi.mocked(firestore.getDocs).mockResolvedValue(mockSnap as any);

      const added = await plannerService.injectSeedExercises("site1");

      expect(added).toBe(INITIAL_BWF_EXERCISES.length - 1);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe("Sessions", () => {
    it("addSession should setDoc with mapped data", async () => {
      const newSession = {
        date: "2026-08-01",
        exercises: [],
        title: "Test Session",
      } as any;

      const id = await plannerService.addSession("site1", newSession);
      expect(id).toBe("mock-doc-id");
      expect(firestore.setDoc).toHaveBeenCalledWith(
        expect.objectContaining({ id: "mock-doc-id" }),
        expect.objectContaining({
          siteId: "site1",
          title: "Test Session",
        })
      );
    });
  });

  describe("Attendance", () => {
    it("saveAttendanceBatch should write batch and commit", async () => {
      const mockBatch = { set: vi.fn(), commit: vi.fn() };
      vi.mocked(firestore.writeBatch).mockReturnValue(mockBatch as any);

      await plannerService.saveAttendanceBatch("site1", "sess1", [
        { memberId: "m1", date: "2026-08-01", rpe: 5, effort: 5, medicalStatus: "healthy" },
      ]);

      expect(mockBatch.set).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalled();
    });
  });

  describe("Settings", () => {
    it("getFocusTags should return default tags if empty", async () => {
      vi.mocked(firestore.getDocs).mockResolvedValue({ empty: true } as any);
      
      const tags = await plannerService.getFocusTags("site1");
      expect(tags).toContain("Clear");
      expect(tags).toContain("Сингъл");
    });
  });
});
