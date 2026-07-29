import { describe, it, expect, vi, beforeEach } from "vitest";
import * as assessmentService from "../assessment-service";
import * as firestore from "firebase/firestore";

vi.mock("firebase/firestore", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getDocs: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    doc: vi.fn(() => ({ id: "mock-doc-id" })),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    serverTimestamp: vi.fn(() => ({ type: "serverTimestamp" })),
  };
});

vi.mock("@/lib/firebase-collections", () => ({
  getMemberAssessmentsCollection: vi.fn(),
  getMemberAssessmentsQuery: vi.fn(),
}));

vi.mock("@/config/sites", () => ({
  getSiteConfig: vi.fn(() => ({ id: "site1" })),
}));

describe("assessmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getAssessmentsByMemberId should return empty array if memberId is empty", async () => {
    const results = await assessmentService.getAssessmentsByMemberId("");
    expect(results).toEqual([]);
  });

  it("getAssessmentsByMemberId should query and map documents", async () => {
    const mockSnap = {
      docs: [
        { data: () => ({ memberId: "m1", totalScore: 80, date: "2026-08-01" }) },
      ],
    };
    vi.mocked(firestore.getDocs).mockResolvedValue(mockSnap as any);

    const results = await assessmentService.getAssessmentsByMemberId("m1");
    expect(results).toHaveLength(1);
    expect(results[0].memberId).toBe("m1");
    expect(firestore.query).toHaveBeenCalled();
  });

  it("addAssessment should add document with server timestamps and siteId", async () => {
    vi.mocked(firestore.addDoc).mockResolvedValue({ id: "new-assessment-id" } as any);

    const data = {
      memberId: "m1",
      memberName: "Integration Test",
      testId: "t1",
      testName: "Beep Test",
      date: "2026-08-01",
      ageGroupAtTest: "U19" as any,
      evaluatorId: "e1",
      results: {},
      totalScore: 90,
      score: 90,
      scoreDisplay: "90",
      recordedBy: { userId: "e1", userName: "Evaluator" },
    };

    const id = await assessmentService.addAssessment(data);

    expect(id).toBe("new-assessment-id");
    expect(firestore.addDoc).toHaveBeenCalledWith(
      undefined, // getMemberAssessmentsCollection is mocked
      expect.objectContaining({
        memberId: "m1",
        siteId: "site1",
        totalScore: 90,
      })
    );
  });

  it("getAllAssessments should sort by date descending", async () => {
    const mockSnap = {
      docs: [
        { data: () => ({ memberId: "m1", date: "2026-01-01" }) },
        { data: () => ({ memberId: "m2", date: "2026-02-01" }) },
      ],
    };
    vi.mocked(firestore.getDocs).mockResolvedValue(mockSnap as any);

    const results = await assessmentService.getAllAssessments("site1");
    expect(results[0].memberId).toBe("m2"); // 2026-02-01 should be first
    expect(results[1].memberId).toBe("m1");
  });

  it("deleteAssessment should call deleteDoc with correct ref", async () => {
    await assessmentService.deleteAssessment("a1");
    expect(firestore.deleteDoc).toHaveBeenCalled();
    expect(firestore.doc).toHaveBeenCalledWith(undefined, "a1");
  });
});
