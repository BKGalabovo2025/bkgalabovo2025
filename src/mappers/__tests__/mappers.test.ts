import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { docToMember, calculateAgeGroup } from "../member.mapper";
import { mapDocToTournament } from "../tournament.mapper";

describe("mappers", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-01T12:00:00Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  describe("member.mapper", () => {
    it("docToMember should map valid member and concatenate names", () => {
      const mockDoc = {
        id: "m1",
        exists: () => true,
        data: () => ({
          firstName: "Иван",
          lastName: "Иванов",
          status: "active",
          siteId: "site1",
        }),
      };

      const result = docToMember(mockDoc as any);
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Иван Иванов");
      expect(result?.id).toBe("m1");
    });

    it("calculateAgeGroup should return U11 for 9-10 years old", () => {
      // Current year is mocked to 2026
      const dateOfBirth = "2017-05-05"; // 2026 - 2017 = 9 years
      expect(calculateAgeGroup(dateOfBirth)).toBe("U11");
    });

    it("calculateAgeGroup should return null for invalid dates", () => {
      expect(calculateAgeGroup("invalid")).toBeNull();
      expect(calculateAgeGroup(null)).toBeNull();
    });
  });

  describe("tournament.mapper", () => {
    it("mapDocToTournament should handle missing optional fields gracefully", () => {
      const mockDoc = {
        id: "t1",
        data: () => ({
          title: "Test T",
          format: "knockout",
          status: "upcoming",
          startDate: { toDate: () => new Date("2026-09-01") },
          endDate: { toDate: () => new Date("2026-09-02") },
          location: "Sofia",
          categories: ["singles"],
          matchFormatId: "best_of_3",
          countsForRanking: true,
          pointsMultiplier: 1,
          entryFee: 10,
        }),
      };

      const result = mapDocToTournament(mockDoc as any);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("t1");
      expect(result?.title).toBe("Test T");
    });
  });
});
