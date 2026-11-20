import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCollectionAdd = vi.fn();
const mockCollectionGet = vi.fn();

const mockCollectionRef = {
  add: mockCollectionAdd,
  get: mockCollectionGet,
  where: vi.fn(),
};
mockCollectionRef.where.mockReturnValue(mockCollectionRef);

vi.mock("@/lib/firebase-admin", () => ({
  getAdminAuth: vi.fn(() => ({})),
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => mockCollectionRef),
  })),
}));

vi.mock("@/lib/auth-utils", () => ({
  ensureAdminWithSite: vi.fn(async () => ({
    uid: "admin-1",
    email: "admin@bkgalabovo.com",
    role: "admin",
    siteId: "bkgalabovo",
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/audit-logger", () => ({
  logAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server-cache", () => ({
  serverCache: {
    invalidatePattern: vi.fn(),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "mock-timestamp"),
    arrayUnion: vi.fn((val) => val),
  },
}));

import { createMemberAction } from "@/lib/actions/members";

describe("createMemberAction Anti-Duplicate & Idempotency Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new member when no duplicate exists", async () => {
    mockCollectionGet.mockResolvedValueOnce({
      empty: true,
      docs: [],
    });
    mockCollectionAdd.mockResolvedValueOnce({ id: "new-member-123" });

    const result = await createMemberAction("valid-token", {
      firstName: "Иван",
      lastName: "Иванов",
      phone: "0888123456",
      siteId: "bkgalabovo",
      status: "active",
      memberType: "regular",
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("new-member-123");
    expect(mockCollectionAdd).toHaveBeenCalledTimes(1);
  });

  it("handles rapid double-click idempotently (returns existing ID without duplicating)", async () => {
    const recentDate = new Date(); // right now
    mockCollectionGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "existing-member-999",
          data: () => ({
            firstName: "Михаела",
            lastName: "Баликова",
            siteId: "bkgalabovo",
            updatedAt: { toDate: () => recentDate },
          }),
        },
      ],
    });

    const result = await createMemberAction("valid-token", {
      firstName: "Михаела",
      lastName: "Баликова",
      siteId: "bkgalabovo",
      status: "active",
      memberType: "regular",
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe("existing-member-999");
    expect(mockCollectionAdd).not.toHaveBeenCalled();
  });

  it("rejects duplicate creation when member with same phone number already exists", async () => {
    const oldDate = new Date(Date.now() - 3600000); // 1 hour ago
    mockCollectionGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "existing-nasko",
          data: () => ({
            firstName: "Наско",
            lastName: "Маджаров",
            phone: "0898384159",
            siteId: "bkgalabovo",
            updatedAt: { toDate: () => oldDate },
          }),
        },
      ],
    });

    const result = await createMemberAction("valid-token", {
      firstName: "Наско",
      lastName: "Маджаров",
      phone: "0898384159",
      siteId: "bkgalabovo",
      status: "active",
      memberType: "guest",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Вече съществува регистриран член");
    expect(result.message).toContain("0898384159");
    expect(mockCollectionAdd).not.toHaveBeenCalled();
  });

  it("rejects duplicate creation when club member with same first and last name already exists", async () => {
    const oldDate = new Date(Date.now() - 86400000); // 1 day ago
    mockCollectionGet.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: "existing-zhivka",
          data: () => ({
            firstName: "Живка",
            lastName: "Костадинова",
            siteId: "bkgalabovo",
            updatedAt: { toDate: () => oldDate },
          }),
        },
      ],
    });

    const result = await createMemberAction("valid-token", {
      firstName: "Живка",
      lastName: "Костадинова",
      siteId: "bkgalabovo",
      status: "active",
      memberType: "regular",
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain("Вече съществува член с име");
    expect(mockCollectionAdd).not.toHaveBeenCalled();
  });
});
