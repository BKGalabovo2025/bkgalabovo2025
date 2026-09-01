import type { DocumentSnapshot } from "firebase/firestore";
import { describe, expect, it } from "vitest";

import { docToMember } from "../mappers/member.mapper";
import { Member } from "../types";
import { SaleSchema } from "../types/sale.types";

describe("Security: Multi-Tenant Data Isolation", () => {
  const primaryTenantSiteId = "bkgalabovo";
  const foreignTenantSiteId = "other-club-sofia";

  it("should prevent mapping member data without a valid siteId", () => {
    const invalidDoc = {
      id: "mem_no_tenant",
      exists: () => true,
      data: () => ({
        firstName: "Иван",
        lastName: "Иванов",
        email: "ivan@example.com",
        status: "active",
      }),
    };

    const result = docToMember(invalidDoc as unknown as DocumentSnapshot);
    expect(result).toBeNull();
  });

  it("should correctly preserve tenant ownership for primary tenant", () => {
    const validDoc = {
      id: "mem_valid_1",
      exists: () => true,
      data: () => ({
        firstName: "Георги",
        lastName: "Георгиев",
        email: "georgi@example.com",
        siteId: primaryTenantSiteId,
        status: "active",
        registrationDate: "2026-01-15T10:00:00.000Z",
      }),
    };

    const result = docToMember(
      validDoc as unknown as DocumentSnapshot
    ) as Member;
    expect(result).not.toBeNull();
    expect(result.siteId).toBe(primaryTenantSiteId);
  });

  it("should enforce siteId isolation on financial sales schemas", () => {
    const foreignSale = {
      id: "sale_foreign_1",
      siteId: foreignTenantSiteId,
      memberId: "mem_sofia_1",
      saleDate: "2026-09-01T10:00:00.000Z",
      status: "completed" as const,
      isPaid: true,
      totalAmount: 40.0,
      currency: "EUR" as const,
      items: [
        {
          productId: "p1",
          name: "Месечна такса",
          quantity: 1,
          price: 40.0,
        },
      ],
    };

    const parsed = SaleSchema.parse(foreignSale);
    expect(parsed.siteId).toBe(foreignTenantSiteId);
    expect(parsed.siteId).not.toBe(primaryTenantSiteId);
  });

  it("should reject sales objects missing mandatory tenant siteId", () => {
    const orphanSale = {
      id: "sale_orphan",
      memberId: "mem_1",
      saleDate: "2026-09-01T10:00:00.000Z",
      status: "completed" as const,
      isPaid: true,
      totalAmount: 10.0,
      currency: "EUR" as const,
      items: [
        {
          productId: "p1",
          name: "Пера",
          quantity: 1,
          price: 10.0,
        },
      ],
    };

    const result = SaleSchema.safeParse(orphanSale);
    expect(result.success).toBe(false);
  });
});
