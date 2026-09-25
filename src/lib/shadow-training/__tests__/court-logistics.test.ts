import { describe, expect, it } from "vitest";

import { ShadowPlayer } from "@/hooks/shadow-trainer/types";

import {
  calculateCourtAssignments,
  splitPlayersIntoWaves,
} from "../court-logistics";

describe("calculateCourtAssignments logistics", () => {
  const mockPlayers: ShadowPlayer[] = [
    { id: "p1", displayName: "Иван Петров" },
    { id: "p2", displayName: "Мария Георгиева" },
    { id: "p3", displayName: "Димитър Иванов" },
    { id: "p4", displayName: "Стефан Попов" },
    { id: "p5", displayName: "Елена Димитрова" },
    { id: "p6", displayName: "Николай Николов" },
    { id: "p7", displayName: "Георги Тодоров" },
    { id: "p8", displayName: "Теодора Стоянова" },
    { id: "p9", displayName: "Виктор Василев" },
    { id: "p10", displayName: "Александра Петрова" },
    { id: "p11", displayName: "Кристиян Ангелов" },
    { id: "p12", displayName: "Мартин Илиев" },
    { id: "p13", displayName: "Силвия Борисова" },
    { id: "p14", displayName: "Даниел Колев" },
  ];

  it("handles standard 6-court setup with two_per_court strategy (capacity 12)", () => {
    const result = calculateCourtAssignments(mockPlayers, 6, "two_per_court");

    expect(result.totalCapacity).toBe(12);
    expect(result.activePlayers).toHaveLength(12);
    expect(result.restingPlayers).toHaveLength(2);
    expect(result.restingPlayers.map((p) => p.displayName)).toEqual([
      "Силвия Борисова",
      "Даниел Колев",
    ]);

    expect(result.slots).toHaveLength(6);
    expect(result.slots[0]).toEqual({
      courtNumber: 1,
      isFullCourt: true,
      halfA: mockPlayers[0],
      halfB: mockPlayers[1],
    });
    expect(result.slots[5]).toEqual({
      courtNumber: 6,
      isFullCourt: true,
      halfA: mockPlayers[10],
      halfB: mockPlayers[11],
    });
  });

  it("handles 6-court setup with one_per_court strategy (capacity 6)", () => {
    const result = calculateCourtAssignments(mockPlayers, 6, "one_per_court");

    expect(result.totalCapacity).toBe(6);
    expect(result.activePlayers).toHaveLength(6);
    expect(result.restingPlayers).toHaveLength(8);

    expect(result.slots).toHaveLength(6);
    expect(result.slots[0]).toEqual({
      courtNumber: 1,
      isFullCourt: false,
      halfA: mockPlayers[0],
      halfB: null,
    });
    expect(result.slots[5]).toEqual({
      courtNumber: 6,
      isFullCourt: false,
      halfA: mockPlayers[5],
      halfB: null,
    });
  });

  it("handles single court with 1 player", () => {
    const result = calculateCourtAssignments(
      mockPlayers.slice(0, 1),
      1,
      "two_per_court"
    );

    expect(result.totalCapacity).toBe(2);
    expect(result.activePlayers).toHaveLength(1);
    expect(result.restingPlayers).toHaveLength(0);
    expect(result.slots).toHaveLength(1);
    expect(result.slots[0].halfA?.displayName).toBe("Иван Петров");
    expect(result.slots[0].halfB).toBeNull();
  });

  it("handles empty players list safely", () => {
    const result = calculateCourtAssignments([], 4, "two_per_court");

    expect(result.totalCapacity).toBe(8);
    expect(result.activePlayers).toHaveLength(0);
    expect(result.restingPlayers).toHaveLength(0);
    expect(result.slots).toHaveLength(4);
    expect(result.slots[0].halfA).toBeNull();
    expect(result.slots[0].halfB).toBeNull();
  });

  it("clamps court count between 1 and 6", () => {
    const zeroResult = calculateCourtAssignments(mockPlayers, 0);
    expect(zeroResult.slots).toHaveLength(1);

    const overResult = calculateCourtAssignments(mockPlayers, 15);
    expect(overResult.slots).toHaveLength(6);
  });
});

describe("splitPlayersIntoWaves wave calculation", () => {
  const players = [
    { id: "1", displayName: "Денислав" },
    { id: "2", displayName: "Галин" },
    { id: "3", displayName: "Мирослав" },
    { id: "4", displayName: "Вероника" },
    { id: "5", displayName: "Ивайла" },
    { id: "6", displayName: "Радосвета" },
    { id: "7", displayName: "Веселин" },
    { id: "8", displayName: "Господин" },
  ];

  it("splits 8 players on 3 courts (capacity 6) into Part 1 (6) and Part 2 (2)", () => {
    const waves = splitPlayersIntoWaves(players, 6);
    expect(waves).toHaveLength(2);
    expect(waves[0]).toHaveLength(6);
    expect(waves[0].map((p) => p.displayName)).toEqual([
      "Денислав",
      "Галин",
      "Мирослав",
      "Вероника",
      "Ивайла",
      "Радосвета",
    ]);
    expect(waves[1]).toHaveLength(2);
    expect(waves[1].map((p) => p.displayName)).toEqual(["Веселин", "Господин"]);
  });

  it("returns single wave when players fit within capacity", () => {
    const waves = splitPlayersIntoWaves(players.slice(0, 6), 6);
    expect(waves).toHaveLength(1);
    expect(waves[0]).toHaveLength(6);
  });
});
