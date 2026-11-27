import { beforeEach, describe, expect, it, vi } from "vitest";

const { ensureAdminMock, allocateDocumentNumberMock, getDocMock } = vi.hoisted(
  () => ({
    ensureAdminMock: vi.fn(),
    allocateDocumentNumberMock: vi.fn(),
    getDocMock: vi.fn(),
  })
);

vi.mock("@/lib/auth-utils", () => ({
  ensureAdmin: ensureAdminMock,
  ensureAdminWithSite: ensureAdminMock,
  ensureAdminFromSession: ensureAdminMock,
}));

vi.mock("@/lib/document-numbering", () => ({
  allocateDocumentNumber: allocateDocumentNumberMock,
}));

vi.mock("@/lib/firebase-admin", () => {
  const createChainableQuery = () => {
    const q = {
      where: () => q,
      limit: () => q,
      get: vi.fn(async () => ({ docs: [] })),
    };
    return q;
  };
  return {
    getAdminDb: () => ({
      collection: () => ({
        doc: () => ({
          get: getDocMock,
        }),
        ...createChainableQuery(),
      }),
    }),
  };
});

import { issueDocumentNumberAction } from "@/lib/actions/document-numbers";
import { computeGlobalRankingsServer } from "@/services/ranking-service.server";

describe("Critical Server Actions & Services", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("issueDocumentNumberAction rejects invalid documentKey", async () => {
    ensureAdminMock.mockResolvedValue({ uid: "admin1", email: "a@b.com" });
    const res = await issueDocumentNumberAction({
      memberId: "m1",
      documentKey: "INVALID_KEY",
      idToken: "token",
    });
    expect(res.success).toBe(false);
  });

  it("issueDocumentNumberAction allocates number when member exists", async () => {
    ensureAdminMock.mockResolvedValue({ uid: "admin1", email: "a@b.com" });
    getDocMock.mockResolvedValue({
      exists: true,
      data: () => ({
        firstName: "Иван",
        lastName: "Иванов",
        siteId: "bkgalabovo",
      }),
    });
    allocateDocumentNumberMock.mockResolvedValue({
      number: 42,
      formattedNumber: "000042",
    });

    const res = await issueDocumentNumberAction({
      memberId: "m1",
      documentKey: "membershipApplication",
      idToken: "token",
    });
    expect(res.success).toBe(true);
    expect(allocateDocumentNumberMock).toHaveBeenCalledOnce();
  });

  it("computeGlobalRankingsServer returns empty array when no tournaments exist", async () => {
    const rankings = await computeGlobalRankingsServer(undefined, "bkgalabovo");
    expect(Array.isArray(rankings)).toBe(true);
    expect(rankings).toHaveLength(0);
  });
});
