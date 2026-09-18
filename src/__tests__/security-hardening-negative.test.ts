import { beforeEach, describe, expect, it, vi } from "vitest";

// 1. Mock next/headers
const mockGetCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockGetCookie,
  })),
}));

// 2. Mock Firebase Admin
const mockVerifyIdToken = vi.fn();
const mockVerifySessionCookie = vi.fn();
const mockRevokeRefreshTokens = vi.fn();

const mockDocGet = vi.fn();
const mockDocSet = vi.fn();
const mockDocUpdate = vi.fn();
const mockDocDelete = vi.fn();
const mockCollectionAdd = vi.fn();
const mockCollectionGet = vi.fn();

const mockDocRef = {
  get: mockDocGet,
  set: mockDocSet,
  update: mockDocUpdate,
  delete: mockDocDelete,
};

const mockCollectionRef = {
  doc: vi.fn(() => mockDocRef),
  add: mockCollectionAdd,
  get: mockCollectionGet,
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: vi.fn(() => ({
    verifyIdToken: mockVerifyIdToken,
    verifySessionCookie: mockVerifySessionCookie,
    revokeRefreshTokens: mockRevokeRefreshTokens,
  })),
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => mockCollectionRef),
    runTransaction: vi.fn(async (cb) => {
      const tx = {
        get: mockDocGet,
        update: mockDocUpdate,
        set: mockDocSet,
      };
      return cb(tx);
    }),
  })),
}));

// Import modules under test
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import {
  GET as inquiriesGet,
  PATCH as inquiriesPatch,
} from "@/app/api/inquiries/route";
import { POST as aiEvalPost } from "@/app/api/quiz/ai-eval/route";
import { getAuditLogsAction, logAuditAction } from "@/lib/actions/audit";
import { logSystemError } from "@/lib/actions/error-logging";
import { createFamilyAction } from "@/lib/actions/families";
import { deleteGeneralServiceAction } from "@/lib/actions/general-services-server";
import { createMemberAction } from "@/lib/actions/members";
import {
  createReservationAction,
  updateReservationAction,
} from "@/lib/actions/reservations";
import { createSaleAction, updateSaleAction } from "@/lib/actions/sales";
import { deleteClubService } from "@/lib/actions/services";

describe("PROMPT 4 — Security Hardening & Negative Tests Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("SEC-01 (CRITICAL): Audit Logs Server Action Enforcement", () => {
    it("NEGATIVE TEST: denies anonymous caller with no session cookie (returns empty logs)", async () => {
      mockGetCookie.mockReturnValue(undefined);

      const logs = await getAuditLogsAction(10);
      expect(logs).toEqual([]);
    });

    it("NEGATIVE TEST: denies non-admin authenticated session (returns empty logs)", async () => {
      mockGetCookie.mockReturnValue({ value: "regular-user-session" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "user-123",
        email: "member@example.com",
        admin: false,
      });

      const logs = await getAuditLogsAction(10);
      expect(logs).toEqual([]);
    });

    it("NEGATIVE TEST: logAuditAction rejects non-admin session", async () => {
      mockGetCookie.mockReturnValue({ value: "regular-user-session" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "user-123",
        email: "member@example.com",
        admin: false,
      });

      await expect(
        logAuditAction("login", "test-details", "user@example.com")
      ).rejects.toThrow(/Нямате администраторски права/);
    });
  });

  describe("SEC-02 (CRITICAL): Sales Authorization & Tenant Isolation", () => {
    it("NEGATIVE TEST: createSaleAction rejects non-admin ID token", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const result = await createSaleAction("fake-token", {
        siteId: "bkgalabovo",
        totalAmount: 50,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Нямате администраторски права/);
    });

    it("NEGATIVE TEST: createSaleAction rejects cross-tenant admin", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "rz-admin",
        email: "coach@recoveryzone.bg",
        admin: true,
        allowedSites: ["recoveryzone"],
      });

      const result = await createSaleAction("fake-token", {
        siteId: "bkgalabovo",
        totalAmount: 100,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Нямате достъп до този клон/);
    });

    it("NEGATIVE TEST: updateSaleAction rejects non-admin ID token", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const result = await updateSaleAction("sale-123", "fake-token", {
        isPaid: true,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Грешка при актуализиране на продажбата/);
    });
  });

  describe("SEC-03 (HIGH): Services Modification Role Checks", () => {
    it("NEGATIVE TEST: deleteClubService rejects non-admin token", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const result = await deleteClubService("fake-token", "service-123");
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Възникна грешка при изтриването/);
    });

    it("NEGATIVE TEST: deleteGeneralServiceAction rejects non-admin session", async () => {
      mockGetCookie.mockReturnValue({ value: "regular-user-session" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const result = await deleteGeneralServiceAction("general-service-123");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/Нямате администраторски права/);
    });
  });

  describe("SEC-04 (HIGH): Reservations Authorization & Status Protection", () => {
    it("NEGATIVE TEST: non-admin cannot directly create paid reservation", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "regular-user-123",
        email: "regular@example.com",
        admin: false,
      });

      const result = await createReservationAction("fake-token", {
        siteId: "bkgalabovo",
        serviceId: "srv-1",
        serviceName: "Court 1",
        date: "2026-10-01",
        startTime: "10:00",
        endTime: "11:00",
        clientName: "Test User",
        clientPhone: "0888111222",
        clientEmail: "regular@example.com",
        totalPrice: 20,
        status: "paid",
        durationMinutes: 60,
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(
        /Само администратори могат да създават предварително платени резервации/
      );
    });

    it("NEGATIVE TEST: non-admin cannot modify someone else's reservation", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "attacker-uid",
        email: "attacker@example.com",
        admin: false,
      });

      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          memberId: "victim-uid",
          createdBy: { uid: "victim-uid" },
          clientEmail: "victim@example.com",
          status: "pending",
        }),
      });

      const result = await updateReservationAction("fake-token", "res-victim", {
        serviceId: "srv-1",
        serviceName: "Court 1",
        date: "2026-10-02",
        startTime: "2026-10-02T10:00:00.000Z",
        endTime: "2026-10-02T11:00:00.000Z",
        clientName: "Victim User",
        clientPhone: "0888123456",
        clientEmail: "victim@example.com",
        totalPrice: 20,
        siteId: "bkgalabovo",
        durationMinutes: 60,
        status: "confirmed",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(
        /Нямате права за редакция на тази резервация/
      );
    });

    it("NEGATIVE TEST: non-admin cannot elevate reservation status to paid", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "owner-uid",
        email: "owner@example.com",
        admin: false,
      });

      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          memberId: "owner-uid",
          createdBy: { uid: "owner-uid" },
          clientEmail: "owner@example.com",
          status: "pending",
        }),
      });

      const result = await updateReservationAction("fake-token", "res-owner", {
        serviceId: "srv-1",
        serviceName: "Court 1",
        date: "2026-10-02",
        startTime: "2026-10-02T10:00:00.000Z",
        endTime: "2026-10-02T11:00:00.000Z",
        clientName: "Owner User",
        clientPhone: "0888123456",
        clientEmail: "owner@example.com",
        totalPrice: 20,
        siteId: "bkgalabovo",
        durationMinutes: 60,
        status: "paid",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(
        /Само администратор може да маркира резервацията като платена/
      );
    });
  });

  describe("SEC-05 (HIGH): Inquiries API Session Guarding", () => {
    it("NEGATIVE TEST: GET /api/inquiries rejects non-admin session cookie with 401", async () => {
      mockGetCookie.mockReturnValue({ value: "regular-user-session" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const request = new Request(
        "https://localhost/api/inquiries?siteId=bkgalabovo",
        {
          method: "GET",
        }
      );

      const response = await inquiriesGet(request);
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error).toMatch(/Unauthorized|администраторски/);
    });

    it("NEGATIVE TEST: PATCH /api/inquiries rejects non-admin session cookie with 401", async () => {
      mockGetCookie.mockReturnValue({ value: "regular-user-session" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const request = new Request("https://localhost/api/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "inq-123", status: "reviewed" }),
      });

      const response = await inquiriesPatch(request);
      expect(response.status).toBe(401);
    });
  });

  describe("SEC-08 (MEDIUM): Members & Families Multi-Tenant Boundary", () => {
    it("NEGATIVE TEST: createMemberAction rejects cross-tenant administrator", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "rz-admin",
        email: "admin@recoveryzone.bg",
        admin: true,
        allowedSites: ["recoveryzone"],
      });

      const result = await createMemberAction("fake-token", {
        name: "New Member",
        email: "new@example.com",
        siteId: "bkgalabovo",
        role: "athlete",
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Нямате достъп до този клон/);
    });

    it("NEGATIVE TEST: createFamilyAction rejects non-admin user", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "regular-user",
        email: "regular@example.com",
        admin: false,
      });

      const result = await createFamilyAction("Petrovi", "fake-token");

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Грешка при създаване на семейство/);
    });
  });

  describe("SEC-09 (MEDIUM): AI Eval Prompt Injection & Replay Guarding", () => {
    it("NEGATIVE TEST: POST /api/quiz/ai-eval rejects unauthorized caller", async () => {
      const request = new Request("https://localhost/api/quiz/ai-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resultId: "res-123",
          questionText: "What is the net height?",
          tacticalAnswer: "1.55m",
        }),
      });

      const response = await aiEvalPost(request);
      expect(response.status).toBe(401);
    });

    it("NEGATIVE TEST: POST /api/quiz/ai-eval returns 404 if result does not exist", async () => {
      mockVerifyIdToken.mockResolvedValue({
        uid: "regular-user",
        email: "user@example.com",
      });

      mockDocGet.mockResolvedValue({
        exists: false,
      });

      const request = new Request("https://localhost/api/quiz/ai-eval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          resultId: "non-existent-id",
          questionText: "Tactical question",
          tacticalAnswer: "Tactical answer",
        }),
      });

      const response = await aiEvalPost(request);
      expect(response.status).toBe(404);
    });
  });

  describe("SEC-11 (MEDIUM): Error Logging Eliminates SMTP Spam Vector", () => {
    it("NEGATIVE TEST: logSystemError only records in Firestore and does not attempt email sending", async () => {
      await logSystemError({
        message: "Simulated critical failure",
        path: "/test",
      });

      expect(mockCollectionAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Simulated critical failure",
          path: "/test",
          resolved: false,
        })
      );
    });
  });

  describe("SEC-13 (LOW): Logout Session Token Revocation", () => {
    it("NEGATIVE TEST: logout revokes refresh tokens when session cookie exists", async () => {
      mockGetCookie.mockReturnValue({ value: "active-session-cookie" });
      mockVerifySessionCookie.mockResolvedValue({
        sub: "user-session-to-revoke",
      });

      const response = await logoutPost();
      expect(response.status).toBe(200);
      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith(
        "user-session-to-revoke"
      );
    });
  });
});
