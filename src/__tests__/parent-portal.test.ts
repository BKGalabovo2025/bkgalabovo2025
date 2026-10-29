import { describe, expect, it } from "vitest";

import {
  generatePasswordResetToken,
  hashPassword,
  signParentToken,
  verifyParentToken,
  verifyPassword,
  verifyPasswordResetToken,
} from "@/lib/parent-auth";
import {
  arePhoneNumbersEqual,
  formatPhoneDisplay,
  normalizePhoneNumber,
} from "@/lib/phone-utils";
import {
  DataCorrectionRequestSchema,
  DefaultParentMemberPermissions,
  ParentAbsenceSchema,
  ParentAccessRequestSchema,
  ParentUserSchema,
} from "@/types/parent-portal.types";

describe("Phone Utils", () => {
  it("normalizes Bulgarian numbers to canonical 10-digit format", () => {
    expect(normalizePhoneNumber("0888 123 456")).toBe("0888123456");
    expect(normalizePhoneNumber("+359 888 123 456")).toBe("0888123456");
    expect(normalizePhoneNumber("00359888123456")).toBe("0888123456");
    expect(normalizePhoneNumber("0888-12-34-56")).toBe("0888123456");
    expect(normalizePhoneNumber("888123456")).toBe("0888123456");
    expect(normalizePhoneNumber("0899/11-22-33")).toBe("0899112233");
  });

  it("checks equality between different formats", () => {
    expect(arePhoneNumbersEqual("+359 888 123 456", "0888 12 34 56")).toBe(
      true
    );
    expect(arePhoneNumbersEqual("0888123456", "0888999999")).toBe(false);
    expect(arePhoneNumbersEqual("", null)).toBe(false);
  });

  it("formats display numbers correctly", () => {
    expect(formatPhoneDisplay("0888123456")).toBe("0888 123 456");
    expect(formatPhoneDisplay("+359888123456")).toBe("0888 123 456");
  });
});

describe("Parent Auth & Security", () => {
  it("hashes password and verifies correctly", () => {
    const raw = "SuperSecret123!";
    const hash = hashPassword(raw);
    expect(hash).toContain(":");
    expect(verifyPassword(raw, hash)).toBe(true);
    expect(verifyPassword("WrongPassword", hash)).toBe(false);
  });

  it("signs and verifies parent session token", () => {
    const payload = {
      parentId: "parent_123",
      email: "maria@example.com",
      phone: "0888123456",
    };
    const token = signParentToken(payload, 3600);
    const verified = verifyParentToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.parentId).toBe("parent_123");
    expect(verified?.email).toBe("maria@example.com");
  });

  it("rejects tampered or expired token", () => {
    const payload = {
      parentId: "parent_123",
      email: "maria@example.com",
      phone: "0888123456",
    };
    const expiredToken = signParentToken(payload, -10); // already expired
    expect(verifyParentToken(expiredToken)).toBeNull();

    const validToken = signParentToken(payload, 3600);
    const tampered = validToken.slice(0, -3) + "xyz";
    expect(verifyParentToken(tampered)).toBeNull();
  });

  it("generates and verifies password reset token", () => {
    const parentId = "parent_abc_999";
    const resetToken = generatePasswordResetToken(parentId);
    const extractedId = verifyPasswordResetToken(resetToken);
    expect(extractedId).toBe(parentId);

    expect(verifyPasswordResetToken("invalid.token")).toBeNull();
  });
});

describe("Parent Portal Zod Schemas", () => {
  it("validates ParentAccessRequestSchema correctly", () => {
    const validData = {
      id: "req_1",
      siteId: "bkgalabovo",
      parentName: "Мария Иванова",
      parentPhone: "0888123456",
      parentEmail: "maria@example.com",
      passwordHash: "salt:hash",
      parentRole: "mother",
      childFullName: "Иван Иванов",
      childBirthDate: "2015-05-12",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const parsed = ParentAccessRequestSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid child birth date", () => {
    const invalidData = {
      id: "req_2",
      siteId: "bkgalabovo",
      parentName: "Георги Петров",
      parentPhone: "0888123456",
      parentEmail: "georgi@example.com",
      passwordHash: "salt:hash",
      parentRole: "father",
      childFullName: "Петър Петров",
      childBirthDate: "12-05-2015", // Wrong format
      createdAt: new Date().toISOString(),
    };

    const parsed = ParentAccessRequestSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
  });

  it("validates ParentUserSchema with default permissions", () => {
    const validUser = {
      id: "user_1",
      siteId: "bkgalabovo",
      name: "Стефан Димитров",
      phone: "0888998877",
      email: "stefan@example.com",
      passwordHash: "salt:hash",
      parentRole: "father",
      status: "active",
      linkedMemberIds: ["child_1", "child_2"],
      permissionsPerMember: {
        child_1: DefaultParentMemberPermissions,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const parsed = ParentUserSchema.safeParse(validUser);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.permissionsPerMember.child_1.showBirthDate).toBe(
        false
      );
      expect(parsed.data.permissionsPerMember.child_1.showAttendance).toBe(
        true
      );
    }
  });

  it("validates ParentAbsenceSchema", () => {
    const validAbsence = {
      id: "abs_1",
      siteId: "bkgalabovo",
      parentUserId: "user_1",
      parentName: "Стефан Димитров",
      memberId: "child_1",
      memberName: "Александър Димитров",
      type: "period",
      startDate: "2026-11-01",
      endDate: "2026-11-05",
      reason: "illness",
      note: "Грип",
      status: "submitted",
      createdAt: new Date().toISOString(),
    };

    const parsed = ParentAbsenceSchema.safeParse(validAbsence);
    expect(parsed.success).toBe(true);
  });

  it("validates DataCorrectionRequestSchema", () => {
    const validCorrection = {
      id: "corr_1",
      siteId: "bkgalabovo",
      parentUserId: "user_1",
      parentName: "Мария Иванова",
      memberId: "child_1",
      memberName: "Иван Иванов",
      fieldKey: "address",
      fieldLabel: "Адрес",
      currentValue: "ул. Стара 5",
      proposedValue: "ул. Нова 12, ап. 4",
      note: "Сменихме квартирата",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    const parsed = DataCorrectionRequestSchema.safeParse(validCorrection);
    expect(parsed.success).toBe(true);
  });
});

describe("Club Site Info & Email Templates", () => {
  it("resolves club site info dynamically with fallback", async () => {
    const { getClubSiteInfo } = await import("@/lib/parent-email-templates");
    const info = await getClubSiteInfo();
    expect(info).toBeDefined();
    expect(info.clubName).toBeTruthy();
    expect(info.hallName).toBeTruthy();
    expect(info.fullFooterLine).toContain(info.clubName);
    expect(info.fullFooterLine).toContain(info.hallName);
  });
});
