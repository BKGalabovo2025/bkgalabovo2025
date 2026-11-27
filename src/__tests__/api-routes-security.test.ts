import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  verifyIdTokenMock,
  createSessionCookieMock,
  ensureAdminWithSiteMock,
  getParentSessionMock,
  getAuthUserMock,
  checkRateLimitMock,
} = vi.hoisted(() => ({
  verifyIdTokenMock: vi.fn(),
  createSessionCookieMock: vi.fn(),
  ensureAdminWithSiteMock: vi.fn(),
  getParentSessionMock: vi.fn(),
  getAuthUserMock: vi.fn(),
  checkRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: () => ({
    verifyIdToken: verifyIdTokenMock,
    createSessionCookie: createSessionCookieMock,
  }),
  getAdminDb: () => ({
    collection: () => ({
      doc: () => ({
        get: vi.fn(async () => ({ exists: false })),
      }),
    }),
  }),
  getAdminStorage: () => ({
    bucket: () => ({
      exists: vi.fn(async () => [false]),
    }),
  }),
}));

vi.mock("@/lib/auth-utils", () => ({
  ensureAdmin: vi.fn(),
  ensureAdminWithSite: ensureAdminWithSiteMock,
  getAuthUser: getAuthUserMock,
  getAuthUserFromSessionCookie: vi.fn(async () => null),
}));

vi.mock("@/lib/parent-auth", () => ({
  getParentSession: getParentSessionMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: checkRateLimitMock,
  getClientIp: () => "127.0.0.1",
}));

import { GET as downloadBackupGet } from "@/app/api/admin/backup/download/route";
import { POST as sessionPost } from "@/app/api/auth/session/route";
import { POST as parentReportPost } from "@/app/api/parents/session-report/route";
import { POST as sendEmailPost } from "@/app/api/send-email/route";
import {
  DELETE as uploadDelete,
  POST as uploadPost,
} from "@/app/api/upload/route";

describe("API Routes Security & Input Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    checkRateLimitMock.mockResolvedValue({ allowed: true, retryAfter: 0 });
  });

  describe("POST /api/auth/session", () => {
    it("returns 400 when idToken is missing", async () => {
      const req = new NextRequest("http://localhost/api/auth/session", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const res = await sessionPost(req);
      expect(res.status).toBe(400);
    });

    it("sets httpOnly session cookie when idToken is valid", async () => {
      verifyIdTokenMock.mockResolvedValue({ uid: "u1" });
      createSessionCookieMock.mockResolvedValue("signed-cookie-value");

      const req = new NextRequest("http://localhost/api/auth/session", {
        method: "POST",
        body: JSON.stringify({ idToken: "valid-token" }),
      });
      const res = await sessionPost(req);
      expect(res.status).toBe(200);
      expect(res.cookies.get("session")?.value).toBe("signed-cookie-value");
      expect(res.cookies.get("session")?.httpOnly).toBe(true);
    });
  });

  describe("POST & DELETE /api/upload", () => {
    it("returns 401 when Authorization header is missing", async () => {
      const req = new NextRequest("http://localhost/api/upload", {
        method: "POST",
      });
      const res = await uploadPost(req);
      expect(res.status).toBe(401);
    });

    it("rejects disallowed MIME types in signed-url mode with 400", async () => {
      getAuthUserMock.mockResolvedValue({ uid: "u1" });
      const req = new NextRequest(
        "http://localhost/api/upload?mode=signed-url",
        {
          method: "POST",
          headers: {
            authorization: "Bearer valid",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            path: "avatars/u1/shell.sh",
            contentType: "application/x-sh",
            size: 100,
          }),
        }
      );
      const res = await uploadPost(req);
      expect(res.status).toBe(400);
    });

    it("rejects DELETE without auth with 401", async () => {
      const req = new NextRequest("http://localhost/api/upload?fileId=abc", {
        method: "DELETE",
      });
      const res = await uploadDelete(req);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/send-email", () => {
    it("returns 401 when unauthenticated", async () => {
      const req = new Request("http://localhost/api/send-email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ to: "a@b.com", subject: "Hi" }),
      });
      const res = await sendEmailPost(req);
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/parents/session-report", () => {
    it("returns 401 when parent session is missing", async () => {
      getParentSessionMock.mockResolvedValue(null);
      const req = new Request("http://localhost/api/parents/session-report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ childId: "c1", report: "Test" }),
      });
      const res = await parentReportPost(req);
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/admin/backup/download", () => {
    it("returns 401 when Authorization header is missing", async () => {
      ensureAdminWithSiteMock.mockRejectedValue(new Error("Unauthorized"));
      const req = new NextRequest(
        "http://localhost/api/admin/backup/download?id=b1&siteId=bkgalabovo"
      );
      const res = await downloadBackupGet(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when admin lacks access to requested siteId", async () => {
      ensureAdminWithSiteMock.mockRejectedValue(
        new Error("Forbidden: No access to this site")
      );
      const req = new NextRequest(
        "http://localhost/api/admin/backup/download?id=b1&siteId=recoveryzone",
        { headers: { authorization: "Bearer token" } }
      );
      const res = await downloadBackupGet(req);
      expect(res.status).toBe(401);
    });
  });
});
