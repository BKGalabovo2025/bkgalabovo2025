import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/headers
const mockGetCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockGetCookie,
  })),
}));

// Mock firebase-admin
const mockVerifySessionCookie = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockGetSnapshot = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockQuery: any = {
  where: mockWhere,
  orderBy: mockOrderBy,
  get: mockGetSnapshot,
};
mockWhere.mockReturnValue(mockQuery);
mockOrderBy.mockReturnValue(mockQuery);

const mockCollection = vi.fn(() => mockQuery);

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: vi.fn(() => ({
    verifySessionCookie: mockVerifySessionCookie,
  })),
  getAdminDb: vi.fn(() => ({
    collection: mockCollection,
  })),
}));

import { ensureAdminFromSession } from "@/lib/auth-utils";
import { getAllMembersServer } from "@/services/member-service.server";

describe("E2E Remediation Regression Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("FINDING-P1-01: ensureAdminFromSession dual-admin & session support", () => {
    it("allows access for recoveryzonebyzm@gmail.com session", async () => {
      mockGetCookie.mockReturnValue({ value: "valid-session-recovery" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "rz-admin-uid",
        email: "recoveryzonebyzm@gmail.com",
        admin: false,
      });

      const user = await ensureAdminFromSession();
      expect(user.email).toBe("recoveryzonebyzm@gmail.com");
    });

    it("allows access for bkgalabovo2014@gmail.com session", async () => {
      mockGetCookie.mockReturnValue({ value: "valid-session-bkgalabovo" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "bk-admin-uid",
        email: "bkgalabovo2014@gmail.com",
        admin: false,
      });

      const user = await ensureAdminFromSession();
      expect(user.email).toBe("bkgalabovo2014@gmail.com");
    });

    it("allows access for user with admin: true claim", async () => {
      mockGetCookie.mockReturnValue({ value: "valid-session-custom-admin" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "custom-admin-uid",
        email: "coach@bkgalabovo.com",
        admin: true,
      });

      const user = await ensureAdminFromSession();
      expect(user.admin).toBe(true);
    });

    it("rejects non-admin session without privileged email", async () => {
      mockGetCookie.mockReturnValue({ value: "valid-session-regular" });
      mockVerifySessionCookie.mockResolvedValue({
        uid: "regular-user-uid",
        email: "regular@example.com",
        admin: false,
      });

      await expect(ensureAdminFromSession()).rejects.toThrow(
        "Нямате администраторски права."
      );
    });

    it("rejects when no session cookie is found", async () => {
      mockGetCookie.mockReturnValue(undefined);

      await expect(ensureAdminFromSession()).rejects.toThrow(
        "Невалидна сесия. Моля, влезте отново."
      );
    });
  });

  describe("FINDING-P2-04: getAllMembersServer siteId filter", () => {
    it("queries without siteId filter when not provided and sorts by lastName", async () => {
      mockGetSnapshot.mockResolvedValue({
        docs: [
          {
            id: "m2",
            data: () => ({
              firstName: "Борис",
              lastName: "Янев",
              siteId: "bkgalabovo",
            }),
          },
          {
            id: "m1",
            data: () => ({
              firstName: "Ангел",
              lastName: "Ангелов",
              siteId: "bkgalabovo",
            }),
          },
        ],
      });

      const members = await getAllMembersServer();
      expect(mockWhere).not.toHaveBeenCalled();
      expect(members).toHaveLength(2);
      expect(members[0].lastName).toBe("Ангелов");
      expect(members[1].lastName).toBe("Янев");
    });

    it("filters by siteId when provided", async () => {
      mockGetSnapshot.mockResolvedValue({
        docs: [
          {
            id: "m3",
            data: () => ({
              firstName: "Владо",
              lastName: "Георгиев",
              siteId: "recoveryzone",
            }),
          },
        ],
      });

      const members = await getAllMembersServer("recoveryzone");
      expect(mockWhere).toHaveBeenCalledWith("siteId", "==", "recoveryzone");
      expect(members).toHaveLength(1);
      expect(members[0].siteId).toBe("recoveryzone");
    });
  });
});
