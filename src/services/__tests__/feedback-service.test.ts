import * as firestore from "firebase/firestore";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { feedbackService } from "../feedback-service";

vi.mock("firebase/firestore", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await importOriginal();
  return {
    ...actual,
    getDocs: vi.fn(),
    getDoc: vi.fn(),
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

describe("feedbackService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Templates", () => {
    it("getTemplates should return templates from firestore", async () => {
      const mockSnap = {
        empty: false,
        docs: [
          {
            id: "t1",
            data: () => ({ name: "Camp Survey", siteId: "bkgalabovo" }),
          },
        ],
      };
      vi.mocked(firestore.getDocs).mockResolvedValue(
        mockSnap as unknown as Awaited<ReturnType<typeof firestore.getDocs>>
      );

      const templates = await feedbackService.getTemplates("bkgalabovo");
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe("t1");
      expect(templates[0].name).toBe("Camp Survey");
    });
  });

  describe("Campaigns", () => {
    it("createCampaign should set doc in feedback_campaigns collection", async () => {
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const campaignId = await feedbackService.createCampaign("bkgalabovo", {
        title: "Camp Primorsko 2026 Feedback",
        eventType: "camp",
        templateId: "t1",
        questions: [],
        status: "active",
        targetAudience: "parents",
      });

      expect(campaignId).toBe("mock-doc-id");
      expect(firestore.setDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe("Submissions & Moderation", () => {
    it("submitFeedback should fetch campaign and create pending submission", async () => {
      const mockCampaignSnap = {
        exists: () => true,
        id: "c1",
        data: () => ({
          title: "Camp 2026",
          siteId: "bkgalabovo",
          eventType: "camp",
        }),
      };
      vi.mocked(firestore.getDoc).mockResolvedValue(
        mockCampaignSnap as unknown as Awaited<
          ReturnType<typeof firestore.getDoc>
        >
      );
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);
      vi.mocked(firestore.getDocs).mockResolvedValue({
        docs: [],
      } as unknown as Awaited<ReturnType<typeof firestore.getDocs>>);

      const subId = await feedbackService.submitFeedback("c1", {
        siteId: "bkgalabovo",
        eventType: "camp",
        respondentRole: "parent",
        respondentName: "Ivan Ivanov",
        childName: "Georgi Ivanov",
        overallRating: 5,
        reviewText: "Great camp experience!",
        answers: {},
      });

      expect(subId).toBe("mock-doc-id");
      expect(firestore.setDoc).toHaveBeenCalledTimes(1);
    });

    it("updateSubmissionStatus should update submission doc", async () => {
      vi.mocked(firestore.updateDoc).mockResolvedValue(undefined);

      await feedbackService.updateSubmissionStatus(
        "sub1",
        "approved",
        true,
        "Verified by coach"
      );

      expect(firestore.updateDoc).toHaveBeenCalledTimes(1);
    });
  });
});
