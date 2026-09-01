import { describe, expect, it } from "vitest";

import { MemberSchema } from "../types/member.types";
import { SaleSchema } from "../types/sale.types";
import { TournamentSchema } from "../types/tournament.types";

describe("Security & Validation: Input Sanitization & Fuzzing", () => {
  describe("Member Schema Validation Boundaries", () => {
    it("should reject invalid email formatting attempts", () => {
      const maliciousPayloads = [
        "plainaddress",
        "#@%^%#$@#$@#.com",
        "@example.com",
        "Joe Smith <email@example.com>",
        "email.example.com",
        "email@example@example.com",
      ];

      for (const email of maliciousPayloads) {
        const result = MemberSchema.safeParse({
          id: "mem_test",
          firstName: "Иван",
          lastName: "Иванов",
          name: "Иван Иванов",
          registrationDate: "2026-01-01T00:00:00.000Z",
          email,
          siteId: "bkgalabovo",
          status: "active",
        });
        expect(result.success).toBe(false);
      }
    });

    it("should validate and accept legitimate Bulgarian names with Cyrillic characters", () => {
      const validMember = {
        id: "mem_krasimir",
        firstName: "Красимир",
        lastName: "Димитров",
        name: "Красимир Димитров",
        email: "krasimir@galabovo.bg",
        phone: "+359888123456",
        siteId: "bkgalabovo",
        status: "active" as const,
        registrationDate: "2026-01-01T10:00:00.000Z",
        dateOfBirth: "2010-05-15",
      };

      const result = MemberSchema.safeParse(validMember);
      expect(result.success).toBe(true);
    });
  });

  describe("Tournament Schema Validation Boundaries", () => {
    it("should accept valid ISO datetime tournament definitions", () => {
      const validDates = {
        id: "tourn_valid_1",
        title: "Турнир Гълъбово 2026",
        startDate: "2026-09-10T10:00:00.000Z",
        endDate: "2026-09-11T18:00:00.000Z",
        location: "Спортна зала Гълъбово",
        status: "upcoming" as const,
        format: "berger" as const,
        categories: ["singles" as const],
        matchFormatId: "standard_3x21",
        countsForRanking: true,
        pointsMultiplier: 1.0,
        entryFee: 15,
      };

      const result = TournamentSchema.safeParse(validDates);
      expect(result.success).toBe(true);
    });

    it("should reject negative entry fees or multipliers", () => {
      const negativeValues = {
        title: "Турнир",
        startDate: "2026-09-10T10:00:00.000Z",
        endDate: "2026-09-11T10:00:00.000Z",
        location: "Зала",
        status: "upcoming" as const,
        format: "berger" as const,
        categories: ["singles" as const],
        matchFormatId: "standard_3x21",
        countsForRanking: true,
        pointsMultiplier: -1,
        entryFee: -50,
      };

      const result = TournamentSchema.safeParse(negativeValues);
      expect(result.success).toBe(false);
    });
  });

  describe("Sale Schema Financial Defense", () => {
    it("should reject negative totalAmount or item prices", () => {
      const negativeSale = {
        id: "sale_bad_1",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-09-01T10:00:00.000Z",
        status: "completed" as const,
        isPaid: true,
        totalAmount: -100,
        currency: "EUR" as const,
        items: [
          {
            productId: "p1",
            name: "Пера",
            quantity: 1,
            price: -100,
          },
        ],
      };

      const result = SaleSchema.safeParse(negativeSale);
      expect(result.success).toBe(false);
    });

    it("should accept valid sales configurations with non-negative values", () => {
      const validSale = {
        id: "sale_valid_1",
        siteId: "bkgalabovo",
        memberId: "mem_1",
        saleDate: "2026-09-01T10:00:00.000Z",
        status: "completed" as const,
        isPaid: true,
        totalAmount: 25.5,
        currency: "EUR" as const,
        items: [
          {
            productId: "p1",
            name: "Наплитане ракета",
            quantity: 1,
            price: 25.5,
          },
        ],
      };

      const result = SaleSchema.safeParse(validSale);
      expect(result.success).toBe(true);
    });
  });
});
