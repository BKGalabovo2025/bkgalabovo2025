import { describe, it, expect } from "vitest";
import { getPlacementPoints, calcTournamentStandings } from "../ranking-utils";
import { TournamentEntry, Match } from "@/types/tournament.types";

describe("ranking-utils", () => {
  describe("getPlacementPoints", () => {
    it("трябва да връща правилни точки за топ 8 позиции", () => {
      expect(getPlacementPoints(1)).toBe(100);
      expect(getPlacementPoints(2)).toBe(70);
      expect(getPlacementPoints(8)).toBe(5);
    });

    it("трябва да връща 3 точки за всички позиции след 8-мо място", () => {
      expect(getPlacementPoints(9)).toBe(3);
      expect(getPlacementPoints(20)).toBe(3);
    });
  });

  describe("calcTournamentStandings", () => {
    it("трябва да изчислява правилно класирането въз основа на победи", () => {
      const entries = [
        { id: "e1" },
        { id: "e2" },
        { id: "e3" },
      ] as TournamentEntry[];

      const matches = [
        // e1 побеждава e2
        {
          player1EntryId: "e1",
          player2EntryId: "e2",
          winnerEntryId: "e1",
          status: "completed",
        },
        // e1 побеждава e3
        {
          player1EntryId: "e1",
          player2EntryId: "e3",
          winnerEntryId: "e1",
          status: "completed",
        },
        // e2 побеждава e3
        {
          player1EntryId: "e2",
          player2EntryId: "e3",
          winnerEntryId: "e2",
          status: "completed",
        },
      ] as Match[];

      const standings = calcTournamentStandings(entries, matches);

      // e1 има 2 победи = 4 точки -> 1-во място
      // e2 има 1 победа = 2 точки -> 2-ро място
      // e3 има 0 победи = 0 точки -> 3-то място
      expect(standings["e1"]).toBe(1);
      expect(standings["e2"]).toBe(2);
      expect(standings["e3"]).toBe(3);
    });

    it("трябва да игнорира незавършени мачове", () => {
      const entries = [{ id: "e1" }, { id: "e2" }] as TournamentEntry[];

      const matches = [
        // Мачът не е започнал
        { player1EntryId: "e1", player2EntryId: "e2", status: "pending" },
        // Мачът е завършил, но няма победител (аномалия)
        { player1EntryId: "e1", player2EntryId: "e2", status: "completed" },
      ] as Match[];

      const standings = calcTournamentStandings(entries, matches);

      // И двамата нямат точки, позицията се изчислява без сривове
      expect(standings["e1"]).toBeDefined();
      expect(standings["e2"]).toBeDefined();
    });
  });
});
