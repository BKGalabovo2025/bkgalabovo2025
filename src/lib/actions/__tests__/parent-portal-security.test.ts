import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockEnsureAdmin,
  mockGetParentSession,
  mockGetAdminDb,
  mockNotifyAdminParentSessionReport,
  mockDocGet,
  mockDocUpdate,
  mockParentDocGet,
} = vi.hoisted(() => ({
  mockEnsureAdmin: vi.fn(),
  mockGetParentSession: vi.fn(),
  mockGetAdminDb: vi.fn(),
  mockNotifyAdminParentSessionReport: vi.fn(),
  mockDocGet: vi.fn(),
  mockDocUpdate: vi.fn(),
  mockParentDocGet: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/lib/auth-utils", () => ({
  ensureAdmin: mockEnsureAdmin,
}));

vi.mock("@/lib/parent-auth", () => ({
  clearParentSession: vi.fn(),
  generatePasswordResetToken: vi.fn(),
  getParentSession: mockGetParentSession,
  hashPassword: vi.fn(),
  setParentSessionCookie: vi.fn(),
  signParentToken: vi.fn(),
  verifyPassword: vi.fn(),
  verifyPasswordResetToken: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({
  getAdminDb: mockGetAdminDb,
  getAdminStorage: vi.fn(),
}));

vi.mock("@/lib/firebase-admin-backup", () => ({
  getBackupDb: vi.fn(() => null),
}));

vi.mock("@/lib/parent-email-templates", () => ({
  notifyAdminNewAbsence: vi.fn(),
  notifyAdminNewCorrection: vi.fn(),
  notifyAdminNewRequest: vi.fn(),
  notifyAdminParentCreated: vi.fn(),
  notifyAdminParentSessionReport: mockNotifyAdminParentSessionReport,
  notifyParentApproved: vi.fn(),
  notifyParentCorrectionApproved: vi.fn(),
  notifyParentCreatedManually: vi.fn(),
  notifyParentPasswordReset: vi.fn(),
  notifyParentRejected: vi.fn(),
  sendDirectParentMessageEmail: vi.fn(),
}));

import { DefaultParentMemberPermissions } from "@/types/parent-portal.types";

import {
  approveParentAccessRequestAction,
  deleteParentUserAction,
  markAbsenceSeenByAdminAction,
  markDocumentViewedByParentAction,
  rejectParentAccessRequestAction,
  sendParentSessionReportAction,
  submitParentAbsenceAction,
  toggleParentUserStatusAction,
} from "../parent-portal";

describe("parent-portal security", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetAdminDb.mockReturnValue({
      collection: (name: string) => ({
        doc: () => {
          if (name === "parent_users") {
            return {
              get: mockParentDocGet,
              update: mockDocUpdate,
            };
          }
          return {
            get: mockDocGet,
            update: mockDocUpdate,
          };
        },
      }),
    });
  });

  describe("Админ действия отхвърлят не-админ потребители", () => {
    beforeEach(() => {
      mockEnsureAdmin.mockRejectedValue(new Error("Unauthorized: Admin only"));
    });

    it("approveParentAccessRequestAction отхвърля не-админ", async () => {
      const res = await approveParentAccessRequestAction("req-1", {
        manualMemberId: "member-1",
        customPermissions: DefaultParentMemberPermissions,
      });
      expect(res.success).toBe(false);
    });

    it("rejectParentAccessRequestAction отхвърля не-админ", async () => {
      const res = await rejectParentAccessRequestAction("req-1", "Причина");
      expect(res.success).toBe(false);
    });

    it("deleteParentUserAction отхвърля не-админ", async () => {
      const res = await deleteParentUserAction("parent-1");
      expect(res.success).toBe(false);
    });

    it("markAbsenceSeenByAdminAction отхвърля не-админ", async () => {
      const res = await markAbsenceSeenByAdminAction("abs-1");
      expect(res.success).toBe(false);
    });

    it("toggleParentUserStatusAction отхвърля не-админ", async () => {
      const res = await toggleParentUserStatusAction("parent-1", "suspended");
      expect(res.success).toBe(false);
    });
  });

  describe("markDocumentViewedByParentAction IDOR защита", () => {
    it("изисква активна родителска сесия", async () => {
      mockGetParentSession.mockResolvedValue(null);

      const res = await markDocumentViewedByParentAction("doc-req-1");
      expect(res).toEqual({ success: false, error: "UNAUTHORIZED" });
    });

    it("блокира IDOR достъп за несвързан memberId", async () => {
      mockGetParentSession.mockResolvedValue({
        parentId: "parent-1",
        email: "parent@test.bg",
        phone: "0888111222",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });

      mockParentDocGet.mockResolvedValue({
        exists: true,
        id: "parent-1",
        data: () => ({
          id: "parent-1",
          status: "active",
          linkedMemberIds: ["member-owned"],
        }),
      });

      mockDocGet.mockResolvedValue({
        exists: true,
        data: () => ({
          memberId: "member-other",
          documentTitle: "Декларация",
        }),
      });

      const res = await markDocumentViewedByParentAction("doc-req-other");
      expect(res).toEqual({
        success: false,
        error: "Нямате достъп до този документ.",
      });
      expect(mockDocUpdate).not.toHaveBeenCalled();
    });
  });

  describe("sendParentSessionReportAction", () => {
    it("изисква родителска сесия", async () => {
      mockGetParentSession.mockResolvedValue(null);

      const res = await sendParentSessionReportAction({
        parentName: "Иван",
        parentEmail: "ivan@test.bg",
        startTime: "12:00",
        endTime: "12:05",
        durationMinutes: 5,
        actions: [{ time: "12:00", text: "Преглед" }],
      });

      expect(res).toEqual({ success: false, error: "UNAUTHORIZED" });
      expect(mockNotifyAdminParentSessionReport).not.toHaveBeenCalled();
    });

    it("изпраща отчет при валидна родителска сесия", async () => {
      mockGetParentSession.mockResolvedValue({
        parentId: "parent-1",
        email: "parent@test.bg",
        phone: "0888111222",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockParentDocGet.mockResolvedValue({
        exists: true,
        id: "parent-1",
        data: () => ({
          id: "parent-1",
          status: "active",
          linkedMemberIds: ["member-1"],
        }),
      });
      mockNotifyAdminParentSessionReport.mockResolvedValue(true);

      const res = await sendParentSessionReportAction({
        parentName: "Иван",
        parentEmail: "ivan@test.bg",
        startTime: "12:00",
        endTime: "12:05",
        durationMinutes: 5,
        actions: [{ time: "12:00", text: "Преглед" }],
      });

      expect(res).toEqual({ success: true });
      expect(mockNotifyAdminParentSessionReport).toHaveBeenCalledTimes(1);
    });
  });

  describe("submitParentAbsenceAction валидация", () => {
    beforeEach(() => {
      mockGetParentSession.mockResolvedValue({
        parentId: "parent-1",
        email: "parent@test.bg",
        phone: "0888111222",
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockParentDocGet.mockResolvedValue({
        exists: true,
        id: "parent-1",
        data: () => ({
          id: "parent-1",
          name: "Мария Иванова",
          status: "active",
          linkedMemberIds: ["member-1"],
        }),
      });
    });

    it("отхвърля невалиден формат на startDate (не е YYYY-MM-DD)", async () => {
      const res = await submitParentAbsenceAction({
        memberId: "member-1",
        type: "single_day",
        startDate: "15.05.2026",
        reason: "illness",
      });

      expect(res).toEqual({
        success: false,
        error: "Невалиден формат на началната дата.",
      });
    });

    it("отхвърля невалиден формат на endDate (не е YYYY-MM-DD)", async () => {
      const res = await submitParentAbsenceAction({
        memberId: "member-1",
        type: "period",
        startDate: "2026-12-01",
        endDate: "2026/12/05",
        reason: "travel",
      });

      expect(res).toEqual({
        success: false,
        error: "Невалиден формат на крайната дата.",
      });
    });

    it("блокира IDOR за несвързан memberId", async () => {
      const res = await submitParentAbsenceAction({
        memberId: "member-unlinked",
        type: "single_day",
        startDate: "2026-12-01",
        reason: "illness",
      });

      expect(res).toEqual({
        success: false,
        error: "Нямате достъп до профила на това дете.",
      });
    });
  });
});
