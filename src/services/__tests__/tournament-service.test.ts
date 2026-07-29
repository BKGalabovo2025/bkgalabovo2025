import { describe, it, expect, vi, beforeEach } from "vitest";
import { tournamentService } from "../tournament-service";
import * as tournamentRepo from "@/repositories/tournament.repository";
import { Timestamp } from "firebase/firestore";

vi.mock("@/repositories/tournament.repository", () => ({
  fetchTournaments: vi.fn(),
  fetchTournamentById: vi.fn(),
  insertTournament: vi.fn(),
  updateTournamentDoc: vi.fn(),
  deleteTournamentDoc: vi.fn(),
  fetchTournamentEntries: vi.fn(),
  insertTournamentEntry: vi.fn(),
  deleteTournamentEntryDoc: vi.fn(),
  fetchTournamentMatches: vi.fn(),
  insertMatchesBatch: vi.fn(),
  deleteMatchesByTournamentBatch: vi.fn(),
  updateMatchDoc: vi.fn(),
}));

// We must also mock firebase/firestore serverTimestamp to avoid errors in tests
vi.mock("firebase/firestore", async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual: any = await importOriginal();
  return {
    ...actual,
    serverTimestamp: vi.fn(() => ({ type: "serverTimestamp" })),
  };
});

describe("tournamentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getTournaments should map and return tournaments", async () => {
    const mockDocs = [
      {
        id: "t1",
        data: () => ({
          title: "Test",
          format: "knockout",
          status: "draft",
          startDate: Timestamp.fromDate(new Date("2026-08-01")),
          endDate: Timestamp.fromDate(new Date("2026-08-02")),
          createdAt: Timestamp.fromDate(new Date("2026-07-01")),
        }),
      },
    ];
    vi.mocked(tournamentRepo.fetchTournaments).mockResolvedValue(
      mockDocs as unknown as Awaited<
        ReturnType<typeof tournamentRepo.fetchTournaments>
      >
    );

    const result = await tournamentService.getTournaments();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
    expect(result[0].title).toBe("Test");
  });

  it("createTournament should validate and parse schema", async () => {
    vi.mocked(tournamentRepo.insertTournament).mockResolvedValue("new-t1");

    const newTournament = {
      title: "New T",
      format: "knockout",
      status: "upcoming",
      startDate: "2026-08-01T10:00:00.000Z",
      endDate: "2026-08-02T18:00:00.000Z",
      maxPlayers: 16,
      location: "Sofia",
      categories: ["singles"],
      matchFormatId: "best_of_3",
      countsForRanking: true,
      pointsMultiplier: 1,
      entryFee: 50,
    } as unknown as Parameters<typeof tournamentService.createTournament>[0];

    const id = await tournamentService.createTournament(newTournament);
    expect(id).toBe("new-t1");
    expect(tournamentRepo.insertTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New T",
        format: "knockout",
        status: "upcoming",
      })
    );
  });

  it("createTournament should throw on invalid schema", async () => {
    const invalidTournament = {
      title: "", // Invalid, too short
      format: "knockout",
      status: "draft",
      startDate: "2026-08-01",
      endDate: "2026-08-02",
    } as unknown as Parameters<typeof tournamentService.createTournament>[0];

    await expect(
      tournamentService.createTournament(invalidTournament)
    ).rejects.toThrow();
  });

  it("updateMatchScore should update match and change status to completed", async () => {
    vi.mocked(tournamentRepo.updateMatchDoc).mockResolvedValue(undefined);

    await tournamentService.updateMatchScore("match1", {
      score: "2-0",
      winnerId: "p1",
    } as unknown as Parameters<typeof tournamentService.updateMatchScore>[1]);

    expect(tournamentRepo.updateMatchDoc).toHaveBeenCalledWith(
      "match1",
      expect.objectContaining({
        score: "2-0",
        winnerId: "p1",
        status: "completed",
      })
    );
  });
});
