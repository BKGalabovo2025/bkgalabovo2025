import { describe, it, expect } from "vitest";
import { generateBergerMatches } from "../match-generator";
import { TournamentEntry } from "@/types/tournament.types";

describe("generateBergerMatches", () => {
  it("трябва да връща празен масив при 0 или 1 играч", () => {
    expect(generateBergerMatches("t1", "singles", [])).toEqual([]);
    expect(
      generateBergerMatches("t1", "singles", [{ id: "p1" } as TournamentEntry])
    ).toEqual([]);
  });

  it("трябва да генерира правилни мачове за 2 играчи", () => {
    const entries = [{ id: "p1" }, { id: "p2" }] as TournamentEntry[];
    const matches = generateBergerMatches("t1", "singles", entries);

    expect(matches.length).toBe(1);
    expect(matches[0].player1EntryId).toBe("p1");
    expect(matches[0].player2EntryId).toBe("p2");
    expect(matches[0].round).toBe(1);
  });

  it("трябва да генерира правилни мачове за 3 играчи (нечетен брой)", () => {
    const entries = [
      { id: "p1" },
      { id: "p2" },
      { id: "p3" },
    ] as TournamentEntry[];
    const matches = generateBergerMatches("t1", "singles", entries);

    // При 3-ма играчи се добавя 1 фиктивен "BYE" -> 4 участника -> 3 кръга.
    // Един играч на кръг почива. Общо 3 реални мача.
    expect(matches.length).toBe(3);

    // Уверяваме се, че фиктивният играч BYE не присъства в генерираните реални мачове
    matches.forEach((m) => {
      expect(m.player1EntryId).not.toBe("BYE");
      expect(m.player2EntryId).not.toBe("BYE");
      expect(m.status).toBe("pending");
    });
  });

  it("трябва да генерира правилни мачове за 4 играчи (четен брой)", () => {
    const entries = [
      { id: "p1" },
      { id: "p2" },
      { id: "p3" },
      { id: "p4" },
    ] as TournamentEntry[];
    const matches = generateBergerMatches("t1", "singles", entries);

    // 4 играчи -> 3 кръга по 2 мача = 6 мача общо
    expect(matches.length).toBe(6);
    expect(matches.filter((m) => m.round === 1).length).toBe(2);
    expect(matches.filter((m) => m.round === 2).length).toBe(2);
    expect(matches.filter((m) => m.round === 3).length).toBe(2);
  });
});
