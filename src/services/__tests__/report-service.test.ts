import { describe, it, expect, vi, afterEach } from "vitest";
import { generateLiabilityReport } from "../report-service";
import * as memberService from "../member-service";
import * as salesService from "../sales-service";
import { Member } from "@/types";

// Mock the services that the report service depends on
vi.mock("../member-service");
vi.mock("../sales-service");

afterEach(() => {
  vi.clearAllMocks();
});

describe("report-service", () => {
  describe("generateLiabilityReport", () => {
    const mockedGetAllMembers = vi.mocked(memberService.getAllMembers);
    const mockedHasMemberPaidForMonth = vi.mocked(
      salesService.hasMemberPaidForMonth
    );

    it("should return only members who have not paid for the specified month", async () => {
      // 1. Arrange: Setup the mock data
      const mockMembers: Partial<Member>[] = [
        { id: "member-1", firstName: "Peter", lastName: "Petrov" }, // Paid
        { id: "member-2", firstName: "Ivan", lastName: "Ivanov" }, // Unpaid
        { id: "member-3", firstName: "Maria", lastName: "Popova" }, // Paid for another month
      ];

      // Mock the return value of getAllMembers
      mockedGetAllMembers.mockResolvedValue(mockMembers as Member[]);

      // Mock the payment status for each member for January 2024
      mockedHasMemberPaidForMonth.mockImplementation(async (memberId) => {
        if (memberId === "member-1") return true; // Peter has paid
        if (memberId === "member-2") return false; // Ivan has NOT paid
        if (memberId === "member-3") return false; // Maria has NOT paid for this month
        return false;
      });

      // 2. Act: Call the function we are testing
      const report = await generateLiabilityReport(2024, 1);

      // 3. Assert: Check if the result is correct
      expect(report).toHaveLength(2); // Should contain Ivan and Maria
      expect(report.map((m) => m.id)).toContain("member-2");
      expect(report.map((m) => m.id)).toContain("member-3");
      expect(report.map((m) => m.id)).not.toContain("member-1");

      // Verify that hasMemberPaidForMonth was called for each member
      expect(mockedHasMemberPaidForMonth).toHaveBeenCalledWith(
        "member-1",
        2024,
        1
      );
      expect(mockedHasMemberPaidForMonth).toHaveBeenCalledWith(
        "member-2",
        2024,
        1
      );
      expect(mockedHasMemberPaidForMonth).toHaveBeenCalledWith(
        "member-3",
        2024,
        1
      );
    });
  });
});
