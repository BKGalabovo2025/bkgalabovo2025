import { describe, it, expect } from "vitest";
import { checkIsMemberOverdue } from "../membership-utils";
import type { Member, Sale } from "@/types";

describe("membership-utils - checkIsMemberOverdue", () => {
  const mockMember = {
    id: "member-1",
    firstName: "Иван",
    lastName: "Иванов",
    status: "active",
  } as Member;

  const mockFamilyMember = {
    id: "member-2",
    firstName: "Георги",
    lastName: "Иванов",
    status: "active",
  } as Member;

  it("returns not overdue if member is not active or null", () => {
    const inactiveMember = { ...mockMember, status: "inactive" } as Member;

    expect(checkIsMemberOverdue(null).isOverdue).toBe(false);
    expect(checkIsMemberOverdue(null).reason).toBe("Неактивен член");

    expect(checkIsMemberOverdue(inactiveMember).isOverdue).toBe(false);
    expect(checkIsMemberOverdue(inactiveMember).reason).toBe("Неактивен член");
  });

  it("returns not overdue if there are no pending sales", () => {
    const sales: Sale[] = [
      {
        id: "sale-1",
        memberId: "member-1",
        status: "completed",
        isPaid: true,
        totalAmount: 100,
        saleDate: new Date().toISOString(),
        items: [],
      } as unknown as Sale,
    ];

    const result = checkIsMemberOverdue(mockMember, [], sales);
    expect(result.isOverdue).toBe(false);
    expect(result.reason).toBe("Няма чакащи задължения");
  });

  it("returns overdue if member has a pending sale", () => {
    const saleDate = new Date("2026-05-25T10:00:00Z");
    const sales: Sale[] = [
      {
        id: "sale-1",
        memberId: "member-1",
        status: "pending",
        isPaid: false,
        totalAmount: 50,
        saleDate: saleDate.toISOString(),
        items: [{ name: "Абонамент Май" }],
      } as unknown as Sale,
    ];

    const result = checkIsMemberOverdue(mockMember, [], sales);
    expect(result.isOverdue).toBe(true);
    expect(result.reason).toContain("Дължи общо 50 €");
    expect(result.reason).toContain("Абонамент Май");
  });

  it("returns overdue and formats reason properly for family members", () => {
    const saleDate = new Date("2026-05-25T10:00:00Z");
    const sales: Sale[] = [
      {
        id: "sale-1",
        memberId: "member-2", // Family member
        status: "pending",
        isPaid: false,
        totalAmount: 40,
        saleDate: saleDate.toISOString(),
        items: [{ name: "Абонамент Георги" }],
      } as unknown as Sale,
      {
        id: "sale-2",
        memberId: "member-1", // Main member
        status: "pending",
        isPaid: false,
        totalAmount: 60,
        saleDate: saleDate.toISOString(),
        items: [{ name: "Абонамент Иван" }],
      } as unknown as Sale,
    ];

    const result = checkIsMemberOverdue(mockMember, [mockFamilyMember], sales);

    expect(result.isOverdue).toBe(true);
    expect(result.reason).toContain("Дължи общо 100 €");
    // Should include family member prefix
    expect(result.reason).toContain("Георги: Абонамент Георги");
    // Should include main member item without prefix
    expect(result.reason).toContain("Абонамент Иван");
  });
});
