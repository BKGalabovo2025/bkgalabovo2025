import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock logSystemError
const mockLogSystemError = vi.fn();
vi.mock("@/lib/actions/error-logging", () => ({
  logSystemError: (...args: unknown[]) => mockLogSystemError(...args),
}));

// Mock firebase-admin
const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockDoc = vi.fn(() => ({
  get: mockGet,
  update: mockUpdate,
}));
const mockCollection = vi.fn(() => ({
  doc: mockDoc,
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: vi.fn(() => ({
    collection: mockCollection,
  })),
}));

// Mock auth-utils
vi.mock("@/lib/auth-utils", () => ({
  getAuthUser: vi.fn(async (token: string) => {
    if (token === "valid-token") {
      return { uid: "user-1", admin: true };
    }
    throw new Error("Unauthorized");
  }),
  getAuthUserFromSessionCookie: vi.fn(async () => null),
}));

import { POST as quizAiEvalPost } from "@/app/api/quiz/ai-eval/route";

describe("AI Endpoint Resiliency & Graceful Fallback Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  describe("POST /api/quiz/ai-eval", () => {
    it("gracefully falls back to deterministic tactical evaluation when Gemini API fails/times out, returns 200, and logs error", async () => {
      // Setup existing quiz result document
      mockGet.mockResolvedValueOnce({
        exists: true,
        data: () => ({
          tacticalQuestion: "Как реагирате при остър смаш към тялото?",
          tacticalAnswer:
            "Заемам ниска стойка с бекхенд захват и връщам към празната зона на мрежата.",
        }),
      });
      mockUpdate.mockResolvedValueOnce(undefined);

      // Simulate network failure or timeout in fetch to Gemini API
      process.env.GEMINI_API_KEY = "mock-gemini-key";
      const globalFetch = vi
        .spyOn(global, "fetch")
        .mockRejectedValueOnce(
          new Error(
            "ETIMEDOUT: Connection to generativelanguage.googleapis.com timed out"
          )
        );

      const req = new Request("http://localhost/api/quiz/ai-eval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          resultId: "quiz-res-999",
          questionText: "Как реагирате при остър смаш към тялото?",
          tacticalAnswer:
            "Заемам ниска стойка с бекхенд захват и връщам към празната зона на мрежата.",
          maxPoints: 20,
        }),
      });

      const res = await quizAiEvalPost(req);

      expect(res.status).toBe(200);
      const json = await res.json();

      // Verify graceful fallback
      expect(json.success).toBe(true);
      expect(json.isFallback).toBe(true);
      expect(json.aiScore).toBe(15); // 75% of 20 points
      expect(json.aiFeedback).toContain("Добър тактически подход");

      // Verify Firestore was updated with fallback
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          aiScore: 15,
          aiFeedback: expect.stringContaining("Добър тактически подход"),
        })
      );

      // Verify logSystemError was called with details
      expect(mockLogSystemError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining(
            "Gemini AI evaluation failed or timed out"
          ),
          path: "/api/quiz/ai-eval",
        })
      );

      globalFetch.mockRestore();
    });
  });
});
