import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockEnsureAdminFromSession,
  mockGetAuthUserFromSessionCookie,
  mockGetAdminDb,
  mockCollectionGet,
  mockCollectionAdd,
  mockDocUpdate,
  mockDocDelete,
} = vi.hoisted(() => ({
  mockEnsureAdminFromSession: vi.fn(),
  mockGetAuthUserFromSessionCookie: vi.fn(),
  mockGetAdminDb: vi.fn(),
  mockCollectionGet: vi.fn(),
  mockCollectionAdd: vi.fn(),
  mockDocUpdate: vi.fn(),
  mockDocDelete: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));
vi.mock("firebase-admin", () => ({
  firestore: {
    Timestamp: class Timestamp {},
    FieldValue: { serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP") },
  },
}));
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({}),
    })),
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  ensureAdmin: vi.fn(),
  ensureAdminFromSession: mockEnsureAdminFromSession,
  getAuthUserFromSessionCookie: mockGetAuthUserFromSessionCookie,
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: mockGetAdminDb,
}));

vi.mock("@/lib/server-cache", () => ({
  serverCache: {
    invalidate: vi.fn(),
    invalidatePattern: vi.fn(),
  },
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditEvent: vi.fn(),
}));

import { POST } from "@/app/api/inquiries/route";
import {
  deleteCampaignServerAction,
  deleteSubmissionServerAction,
  updateCampaignStatusServerAction,
  updateSubmissionStatusServerAction,
} from "@/lib/actions/feedback";
import { getProductsServerAction } from "@/lib/actions/products-server";

describe("Public Portals Security", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAdminDb.mockReturnValue({
      collection: () => ({
        get: mockCollectionGet,
        add: mockCollectionAdd,
        doc: () => ({
          update: mockDocUpdate,
          delete: mockDocDelete,
        }),
      }),
    });
  });

  describe("feedback.ts admin actions (ensureAdminFromSession)", () => {
    beforeEach(() => {
      mockEnsureAdminFromSession.mockRejectedValue(
        new Error("Unauthorized: Admin only")
      );
    });

    it("rejects non-admin callers on updateCampaignStatusServerAction", async () => {
      const res = await updateCampaignStatusServerAction("camp-1", "closed");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
      expect(mockGetAdminDb).not.toHaveBeenCalled();
    });

    it("rejects non-admin callers on updateSubmissionStatusServerAction", async () => {
      const res = await updateSubmissionStatusServerAction(
        "sub-1",
        "approved",
        true
      );
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
      expect(mockGetAdminDb).not.toHaveBeenCalled();
    });

    it("rejects non-admin callers on deleteSubmissionServerAction", async () => {
      const res = await deleteSubmissionServerAction("sub-1");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
      expect(mockGetAdminDb).not.toHaveBeenCalled();
    });

    it("rejects non-admin callers on deleteCampaignServerAction", async () => {
      const res = await deleteCampaignServerAction("camp-1");
      expect(res.success).toBe(false);
      expect(res.error).toContain("Unauthorized");
      expect(mockGetAdminDb).not.toHaveBeenCalled();
    });
  });

  describe("products-server.ts branch isolation", () => {
    const createMockDoc = (id: string, data: Record<string, unknown>) => ({
      id,
      exists: true,
      data: () => data,
    });

    beforeEach(() => {
      mockGetAuthUserFromSessionCookie.mockResolvedValue({
        uid: "user-1",
        email: "staff@example.com",
      });
      mockCollectionGet.mockResolvedValue({
        docs: [
          createMockDoc("p1", { name: "Клубна ракета", siteId: "bkgalabovo" }),
          createMockDoc("p2", { name: "Стар продукт без siteId" }),
          createMockDoc("p3", { name: "Крио гел", siteId: "recoveryzone" }),
          createMockDoc("p4", { name: "Друг клон", siteId: "branch-2" }),
        ],
      });
    });

    it("enforces strict siteId === activeBranch isolation when activeBranch !== 'bkgalabovo'", async () => {
      const res = await getProductsServerAction("recoveryzone");

      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].id).toBe("p3");
      expect(res.data?.[0].siteId).toBe("recoveryzone");
    });

    it("includes legacy products without siteId only when activeBranch === 'bkgalabovo'", async () => {
      const res = await getProductsServerAction("bkgalabovo");

      expect(res.success).toBe(true);
      expect(res.data?.map((p) => p.id)).toEqual(["p1", "p2"]);
    });
  });

  describe("POST /api/inquiries honeypot and rate limiting", () => {
    const validPayload = {
      name: "Иван Петров",
      phone: "0888123456",
      eventTitle: "Пробна тренировка",
      siteId: "bkgalabovo",
    };

    const makeRequest = (body: Record<string, unknown>, ip = "198.51.100.10") =>
      new Request("http://localhost/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": ip,
        },
        body: JSON.stringify(body),
      });

    beforeEach(() => {
      mockCollectionAdd.mockResolvedValue({ id: "inq-123" });
    });

    it("silently rejects honeypot submissions with 'website' filled without writing to Firestore", async () => {
      const res = await POST(
        makeRequest(
          { ...validPayload, website: "https://spam.example.com" },
          "198.51.100.1"
        )
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockCollectionAdd).not.toHaveBeenCalled();
    });

    it("silently rejects honeypot submissions with '_hp' filled without writing to Firestore", async () => {
      const res = await POST(
        makeRequest({ ...validPayload, _hp: "bot-value" }, "198.51.100.2")
      );

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockCollectionAdd).not.toHaveBeenCalled();
    });

    it("enforces IP rate limiting and returns HTTP 429 after 5 requests within a minute", async () => {
      const rateLimitedIp = "203.0.113.42";

      for (let i = 0; i < 5; i++) {
        const res = await POST(makeRequest(validPayload, rateLimitedIp));
        expect(res.status).toBe(200);
      }
      expect(mockCollectionAdd).toHaveBeenCalledTimes(5);

      // 6th request from same IP must be rejected with 429
      const blockedRes = await POST(makeRequest(validPayload, rateLimitedIp));
      expect(blockedRes.status).toBe(429);
      const blockedJson = await blockedRes.json();
      expect(blockedJson.error).toBeTruthy();
      expect(mockCollectionAdd).toHaveBeenCalledTimes(5);

      // A different IP should still be allowed
      const otherIpRes = await POST(makeRequest(validPayload, "203.0.113.99"));
      expect(otherIpRes.status).toBe(200);
      expect(mockCollectionAdd).toHaveBeenCalledTimes(6);
    });
  });
});
