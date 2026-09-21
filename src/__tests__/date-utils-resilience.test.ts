import { describe, expect, it } from "vitest";

import {
  formatDateInput,
  formatDateShort,
  formatDateTimeDisplay,
  formatDateTimeLocal,
  formatEventDateRange,
  formatTimeRange,
  toISOStringOrUndefined,
} from "@/lib/date-utils";

describe("Date Utilities Resilience & Edge Cases Suite", () => {
  describe("Handling null, undefined, and empty strings", () => {
    it("safely handles null and undefined across display formatters", () => {
      expect(formatDateTimeDisplay(null)).toBe("Няма дата");
      expect(formatDateTimeDisplay(undefined)).toBe("Няма дата");
      expect(formatDateTimeDisplay("")).toBe("Няма дата");
      expect(formatDateTimeDisplay("   ")).toBe("Няма дата");

      expect(formatDateShort(null)).toBe("Няма дата");
      expect(formatDateShort(undefined)).toBe("Няма дата");
      expect(formatDateShort("")).toBe("Няма дата");
    });

    it("safely returns empty strings for form input formatters", () => {
      expect(formatDateInput(null)).toBe("");
      expect(formatDateInput(undefined)).toBe("");
      expect(formatDateInput("")).toBe("");
      expect(formatDateInput("   ")).toBe("");

      expect(formatDateTimeLocal(null)).toBe("");
      expect(formatDateTimeLocal(undefined)).toBe("");
      expect(formatDateTimeLocal("")).toBe("");
      expect(formatDateTimeLocal("   ")).toBe("");
    });

    it("safely converts to ISO string or undefined without throwing", () => {
      expect(toISOStringOrUndefined(null)).toBeUndefined();
      expect(toISOStringOrUndefined(undefined)).toBeUndefined();
      expect(toISOStringOrUndefined("")).toBeUndefined();
      expect(toISOStringOrUndefined("   ")).toBeUndefined();
      expect(toISOStringOrUndefined("invalid-date-string")).toBeUndefined();

      // Valid ISO conversion
      const iso = toISOStringOrUndefined("2026-05-15T12:00:00.000Z");
      expect(iso).toBe("2026-05-15T12:00:00.000Z");

      // Firebase Timestamp simulation
      const mockTimestamp = {
        toDate: () => new Date("2026-06-01T10:00:00.000Z"),
      };
      expect(toISOStringOrUndefined(mockTimestamp)).toBe(
        "2026-06-01T10:00:00.000Z"
      );
    });

    it("safely handles missing inputs in range formatters", () => {
      expect(formatTimeRange(null, "2026-05-15T12:00:00.000Z")).toBe(
        "Невалиден интервал"
      );
      expect(formatTimeRange("2026-05-15T12:00:00.000Z", undefined)).toBe(
        "Невалиден интервал"
      );
      expect(formatTimeRange("", "")).toBe("Невалиден интервал");

      expect(formatEventDateRange(null, "2026-05-15T12:00:00.000Z")).toBe(
        "Невалиден интервал"
      );
      expect(formatEventDateRange("2026-05-15T12:00:00.000Z", undefined)).toBe(
        "Невалиден интервал"
      );
    });

    it("correctly formats valid dates without regression", () => {
      const date = new Date(2026, 4, 5, 14, 30); // 5 May 2026 14:30
      expect(formatDateShort(date)).toBe("05.05.2026");
      expect(formatDateInput(date)).toBe("2026-05-05");
      expect(formatDateTimeDisplay(date)).toContain("5 май 2026");
    });
  });
});
