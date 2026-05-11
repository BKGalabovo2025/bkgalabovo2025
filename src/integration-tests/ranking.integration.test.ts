import { vi, describe, it, expect } from "vitest";
import { computeGlobalRankings } from "../services/ranking-service";
import { getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";

// Mocking firestore functions
vi.mock("firebase/firestore", async () => {
  const actual =
    await vi.importActual<typeof import("firebase/firestore")>(
      "firebase/firestore"
    );
  return {
    ...actual,
    getFirestore: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
  };
});

describe("Ranking Integration", () => {
  it("should calculate global rankings from multiple tournaments", async () => {
    // 1. Mock tournaments
    const mockTournaments = {
      docs: [
        {
          id: "tourn1",
          data: () => ({
            title: "Tournament 1",
            status: "completed",
            countsForRanking: true,
            startDate: "2024-01-01T10:00:00Z",
            endDate: "2024-01-01T18:00:00Z",
            location: "Test Hall",
            categories: ["singles"],
            pointsMultiplier: 1,
          }),
        },
      ],
    };

    // 2. Mock entries
    const mockEntries = {
      docs: [
        {
          id: "entry1",
          data: () => ({
            tournamentId: "tourn1",
            memberId: "member1",
            categoryId: "singles",
          }),
        },
      ],
    };

    // 3. Mock matches
    const mockMatches = {
      docs: [
        {
          id: "match1",
          data: () => ({
            tournamentId: "tourn1",
            categoryId: "singles",
            status: "completed",
            player1EntryId: "entry1",
            player2EntryId: "entry2",
            winnerEntryId: "entry1",
          }),
        },
      ],
    };

    vi.mocked(getDocs)
      .mockResolvedValue(
        mockTournaments as unknown as QuerySnapshot<DocumentData>
      ) // Default to tournaments
      .mockResolvedValueOnce(
        mockTournaments as unknown as QuerySnapshot<DocumentData>
      )
      .mockResolvedValueOnce(
        mockEntries as unknown as QuerySnapshot<DocumentData>
      )
      .mockResolvedValueOnce(
        mockMatches as unknown as QuerySnapshot<DocumentData>
      );

    const rankings = await computeGlobalRankings();

    expect(rankings).toHaveLength(1);
    expect(rankings[0].memberId).toBe("member1");
    expect(rankings[0].totalPoints).toBeGreaterThan(0);
    expect(rankings[0].wins).toBe(1);
  });
});
