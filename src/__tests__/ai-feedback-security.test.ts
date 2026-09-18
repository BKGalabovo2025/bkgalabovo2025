import { beforeEach, describe, expect, it, vi } from "vitest";

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
  ensureAdmin: vi.fn(async (token: string) => {
    if (token === "valid-admin-token") {
      return { uid: "admin-1", admin: true };
    }
    throw new Error("Unauthorized");
  }),
}));

import { POST } from "@/app/api/quiz/ai-feedback/route";

describe("AI Feedback Endpoint Security & Authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    resultId: "res-123",
    shareToken: "token-abc-456",
    quizTitle: "Тест Правила за бадминтон",
    questions: [
      {
        id: "q1",
        text: "Колко точки се играе в гейм?",
        type: "SINGLE_CHOICE",
        points: 1,
        options: ["11", "15", "21"],
        correctAnswer: 2,
      },
    ],
    userAnswers: { q1: 1 },
    autoScore: 0,
    maxAutoScore: 1,
  };

  it("returns 400 when request payload is malformed or missing required fields", async () => {
    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultId: "" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request payload");
  });

  it("returns 404 when the quiz result document does not exist", async () => {
    mockGet.mockResolvedValueOnce({
      exists: false,
    });

    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Result not found");
  });

  it("returns 403 when shareToken is missing for a non-admin request", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        shareToken: "token-abc-456",
        quizId: "quiz-1",
      }),
    });

    const payloadWithoutToken = { ...validPayload, shareToken: undefined };
    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithoutToken),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("returns 403 when shareToken does not match the result document token (IDOR protection)", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        shareToken: "token-abc-456", // Real token
        quizId: "quiz-1",
      }),
    });

    const payloadWithWrongToken = {
      ...validPayload,
      shareToken: "attacker-fake-token",
    };
    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadWithWrongToken),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain("Forbidden");
  });

  it("prevents replay attacks and Gemini quota drainage when feedback already exists", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        shareToken: "token-abc-456",
        aiExplanations: { q1: "Съществуващо обяснение" },
        proposedCoachFeedback: "Съществуваща обратна връзка от треньор",
      }),
    });

    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.cached).toBe(true);
    expect(json.aiExplanations).toEqual({ q1: "Съществуващо обяснение" });
    // Crucially: no update should be triggered again
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows valid request with matching shareToken and persists feedback", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        shareToken: "token-abc-456",
        quizId: "quiz-1",
      }),
    });
    mockUpdate.mockResolvedValueOnce(undefined);

    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.aiExplanations).toBeDefined();
    expect(json.proposedCoachFeedback).toBeDefined();
    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });

  it("allows admin authorization to generate or override feedback without shareToken", async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({
        shareToken: "token-abc-456",
        quizId: "quiz-1",
      }),
    });
    mockUpdate.mockResolvedValueOnce(undefined);

    const payloadWithoutToken = { ...validPayload, shareToken: undefined };
    const req = new Request("http://localhost/api/quiz/ai-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer valid-admin-token",
      },
      body: JSON.stringify(payloadWithoutToken),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.aiExplanations).toBeDefined();
  });
});
