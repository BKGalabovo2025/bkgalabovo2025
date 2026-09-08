import { describe, expect, it } from "vitest";

import {
  getMatchFormat,
  isValidGameScore,
  MATCH_FORMAT_PRESETS,
} from "../tournament.types";

describe("Tournament Match Formats and Game Score Validation", () => {
  const format15 = getMatchFormat("best_of_3_15");
  const format21 = getMatchFormat("official_21");

  describe("Preset Configuration", () => {
    it("lists all available match format presets", () => {
      expect(MATCH_FORMAT_PRESETS.length).toBeGreaterThanOrEqual(5);
    });

    it("configures best_of_3_15 with 15 points, 2-point advantage, and max 21 points", () => {
      expect(format15).toBeDefined();
      expect(format15.pointsPerGame).toBe(15);
      expect(format15.twoPointAdvantage).toBe(true);
      expect(format15.maxPoints).toBe(21);
      expect(format15.gamesNeededToWin).toBe(2);
    });

    it("configures official_21 with 21 points, 2-point advantage, and max 30 points", () => {
      expect(format21).toBeDefined();
      expect(format21.pointsPerGame).toBe(21);
      expect(format21.twoPointAdvantage).toBe(true);
      expect(format21.maxPoints).toBe(30);
      expect(format21.gamesNeededToWin).toBe(2);
    });
  });

  describe("Format: 2 of 3 games to 15 points (max 21, tie at 14:14)", () => {
    it("accepts valid normal wins before tiebreak", () => {
      expect(isValidGameScore(15, 0, format15).valid).toBe(true);
      expect(isValidGameScore(15, 10, format15).valid).toBe(true);
      expect(isValidGameScore(15, 13, format15).valid).toBe(true);
      expect(isValidGameScore(12, 15, format15).valid).toBe(true);
    });

    it("rejects overshoots when game should have finished at 15", () => {
      expect(isValidGameScore(16, 10, format15).valid).toBe(false);
      expect(isValidGameScore(16, 13, format15).valid).toBe(false);
    });

    it("rejects incomplete games or ties", () => {
      expect(isValidGameScore(0, 0, format15).valid).toBe(false);
      expect(isValidGameScore(14, 14, format15).valid).toBe(false);
      expect(isValidGameScore(10, 8, format15).valid).toBe(false);
      expect(isValidGameScore(15, 14, format15).valid).toBe(false); // needs 2 point difference!
    });

    it("accepts valid deuce/tiebreak scores with 2 point difference", () => {
      expect(isValidGameScore(16, 14, format15).valid).toBe(true);
      expect(isValidGameScore(17, 15, format15).valid).toBe(true);
      expect(isValidGameScore(18, 16, format15).valid).toBe(true);
      expect(isValidGameScore(19, 17, format15).valid).toBe(true);
      expect(isValidGameScore(20, 18, format15).valid).toBe(true);
      expect(isValidGameScore(21, 19, format15).valid).toBe(true);
    });

    it("rejects tiebreak score with more than 2 point difference", () => {
      expect(isValidGameScore(17, 14, format15).valid).toBe(false);
      expect(isValidGameScore(18, 15, format15).valid).toBe(false);
      expect(isValidGameScore(20, 17, format15).valid).toBe(false);
    });

    it("handles sudden death at max points (21 points)", () => {
      // At 20:20, first to 21 wins (21:20 is valid sudden death!)
      expect(isValidGameScore(21, 20, format15).valid).toBe(true);
      expect(isValidGameScore(20, 21, format15).valid).toBe(true);

      // Cannot exceed 21 points
      expect(isValidGameScore(22, 20, format15).valid).toBe(false);
      expect(isValidGameScore(22, 21, format15).valid).toBe(false);
    });
  });

  describe("Format: 2 of 3 games to 21 points (max 30, tie at 20:20)", () => {
    it("accepts valid normal wins before tiebreak", () => {
      expect(isValidGameScore(21, 0, format21).valid).toBe(true);
      expect(isValidGameScore(21, 15, format21).valid).toBe(true);
      expect(isValidGameScore(21, 19, format21).valid).toBe(true);
      expect(isValidGameScore(18, 21, format21).valid).toBe(true);
    });

    it("rejects overshoots when game should have finished at 21", () => {
      expect(isValidGameScore(22, 15, format21).valid).toBe(false);
      expect(isValidGameScore(22, 19, format21).valid).toBe(false);
    });

    it("rejects incomplete games or ties", () => {
      expect(isValidGameScore(20, 20, format21).valid).toBe(false);
      expect(isValidGameScore(21, 20, format21).valid).toBe(false); // needs 2 point difference!
    });

    it("accepts valid deuce/tiebreak scores with 2 point difference", () => {
      expect(isValidGameScore(22, 20, format21).valid).toBe(true);
      expect(isValidGameScore(23, 21, format21).valid).toBe(true);
      expect(isValidGameScore(27, 25, format21).valid).toBe(true);
      expect(isValidGameScore(29, 27, format21).valid).toBe(true);
      expect(isValidGameScore(30, 28, format21).valid).toBe(true);
    });

    it("rejects tiebreak score with more than 2 point difference", () => {
      expect(isValidGameScore(23, 20, format21).valid).toBe(false);
      expect(isValidGameScore(24, 21, format21).valid).toBe(false);
    });

    it("handles sudden death at max points (30 points)", () => {
      // At 29:29, first to 30 wins (30:29 is valid sudden death!)
      expect(isValidGameScore(30, 29, format21).valid).toBe(true);
      expect(isValidGameScore(29, 30, format21).valid).toBe(true);

      // Cannot exceed 30 points
      expect(isValidGameScore(31, 29, format21).valid).toBe(false);
      expect(isValidGameScore(31, 30, format21).valid).toBe(false);
    });
  });
});
