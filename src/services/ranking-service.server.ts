import { getAdminDb } from "@/lib/firebase-admin";
import { Tournament, TournamentEntry, Match } from "@/types/tournament.types";
import { PlayerRanking, RankingEntry } from "@/types/ranking.types";
import { serializeFirestoreData } from "@/lib/serialize-utils";

const TOURNAMENTS_COLLECTION = "tournaments";
const ENTRIES_COLLECTION = "tournament_entries";
const MATCHES_COLLECTION = "tournament_matches";

const PLACEMENT_POINTS: Record<number, number> = {
  1: 100,
  2: 70,
  3: 50,
  4: 35,
  5: 20,
  6: 15,
  7: 10,
  8: 5,
};

function getPlacementPoints(position: number): number {
  return PLACEMENT_POINTS[position] ?? 3;
}

function calcTournamentStandings(
  entries: TournamentEntry[],
  matches: Match[]
): Record<string, number> {
  const standingsMap: Record<
    string,
    { wins: number; losses: number; points: number }
  > = {};

  entries.forEach((e) => {
    if (!e.id) return;
    standingsMap[e.id] = { wins: 0, losses: 0, points: 0 };
  });

  matches
    .filter((m) => m.status === "completed" && m.winnerEntryId)
    .forEach((m) => {
      if (m.player1EntryId && standingsMap[m.player1EntryId]) {
        if (m.winnerEntryId === m.player1EntryId) {
          standingsMap[m.player1EntryId].wins++;
          standingsMap[m.player1EntryId].points += 2;
        } else {
          standingsMap[m.player1EntryId].losses++;
        }
      }
      if (m.player2EntryId && standingsMap[m.player2EntryId]) {
        if (m.winnerEntryId === m.player2EntryId) {
          standingsMap[m.player2EntryId].wins++;
          standingsMap[m.player2EntryId].points += 2;
        } else {
          standingsMap[m.player2EntryId].losses++;
        }
      }
    });

  const sorted = Object.entries(standingsMap).sort(
    ([, a], [, b]) => b.points - a.points
  );
  const positionMap: Record<string, number> = {};
  sorted.forEach(([id], idx) => {
    positionMap[id] = idx + 1;
  });

  return positionMap;
}

export async function computeGlobalRankingsServer(dateFilter?: {
  start: Date;
  end: Date;
}): Promise<RankingEntry[]> {
  try {
    const db = getAdminDb();

    // 1. All completed tournaments that count for ranking
    const query = db
      .collection(TOURNAMENTS_COLLECTION)
      .where("countsForRanking", "==", true)
      .where("status", "==", "completed");

    const tourSnap = await query.get();
    let tournaments = tourSnap.docs.map((doc) => ({
      ...(doc.data() as Tournament),
      id: doc.id,
    }));

    // Filter by date if provided
    if (dateFilter) {
      tournaments = tournaments.filter((t) => {
        const rawDate = t.startDate as any;
        const tDate = rawDate?.toDate ? rawDate.toDate() : new Date(rawDate);
        return tDate >= dateFilter.start && tDate <= dateFilter.end;
      });
    }

    if (tournaments.length === 0) return [];

    const playerMap: Record<string, PlayerRanking> = {};

    for (const tourn of tournaments) {
      const multiplier = tourn.pointsMultiplier ?? 1;

      // Entries
      const entriesSnap = await db
        .collection(ENTRIES_COLLECTION)
        .where("tournamentId", "==", tourn.id)
        .get();
      const entries = entriesSnap.docs.map((doc) => ({
        ...(doc.data() as TournamentEntry),
        id: doc.id,
      }));

      // Matches
      const matchesSnap = await db
        .collection(MATCHES_COLLECTION)
        .where("tournamentId", "==", tourn.id)
        .get();
      const matches = matchesSnap.docs.map((doc) => ({
        ...(doc.data() as Match),
        id: doc.id,
      }));

      for (const cat of tourn.categories) {
        const catEntries = entries.filter((e) => e.categoryId === cat);
        const catMatches = matches.filter((m) => m.categoryId === cat);

        if (catEntries.length === 0) continue;

        const positionMap = calcTournamentStandings(catEntries, catMatches);
        const catMatchesCompleted = catMatches.filter(
          (m) => m.status === "completed"
        );

        catEntries.forEach((entry) => {
          if (!entry.memberId) return;

          const position = positionMap[entry.id!] ?? catEntries.length;
          const rawPoints = getPlacementPoints(position);
          const finalPoints = Math.round(rawPoints * multiplier);

          let entryWins = 0;
          let entryLosses = 0;
          catMatchesCompleted.forEach((m) => {
            if (
              m.player1EntryId === entry.id ||
              m.player2EntryId === entry.id
            ) {
              if (m.winnerEntryId === entry.id) entryWins++;
              else entryLosses++;
            }
          });

          const addPointsToPlayer = (mId: string, name: string) => {
            if (!playerMap[mId]) {
              playerMap[mId] = {
                memberId: mId,
                memberName: name,
                totalPoints: 0,
                tournamentsPlayed: 0,
                wins: 0,
                losses: 0,
                bestPlacement: null,
                categoryBreakdown: [],
              };
            }

            const player = playerMap[mId];
            player.totalPoints += finalPoints;
            player.tournamentsPlayed++;
            player.wins += entryWins;
            player.losses += entryLosses;

            if (
              player.bestPlacement === null ||
              position < player.bestPlacement
            ) {
              player.bestPlacement = position;
            }

            const catLabel =
              cat === "singles"
                ? "Единично"
                : cat === "doubles"
                  ? "Двойки"
                  : "Смесени";
            const existing = player.categoryBreakdown.find(
              (c) => c.category === catLabel
            );
            if (existing) {
              existing.points += finalPoints;
              existing.played++;
            } else {
              player.categoryBreakdown.push({
                category: catLabel,
                points: finalPoints,
                played: 1,
              });
            }
          };

          if (entry.memberId) {
            addPointsToPlayer(
              entry.memberId,
              entry.externalName || entry.memberId
            );
          }

          if (entry.partnerMemberId) {
            addPointsToPlayer(
              entry.partnerMemberId,
              entry.partnerExternalName || entry.partnerMemberId
            );
          }
        });
      }
    }

    const sorted = Object.values(playerMap).sort(
      (a, b) => b.totalPoints - a.totalPoints
    );

    // Final serialization for Client Component
    return serializeFirestoreData(
      sorted.map((p, idx) => ({ ...p, position: idx + 1 }))
    ) as RankingEntry[];
  } catch (error) {
    console.error("Error computing rankings on server:", error);
    throw error;
  }
}
