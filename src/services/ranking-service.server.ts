import { getAdminDb } from "@/lib/firebase-admin";
import { TournamentEntry, Match, Tournament } from "@/types/tournament.types";

const TOURNAMENTS_COLLECTION = "tournaments";
const ENTRIES_COLLECTION = "tournament-entries";
const MATCHES_COLLECTION = "tournament-matches";

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

export async function computeGlobalRankingsServer(dateFilter?: {
  start: Date;
  end: Date;
}) {
  const db = getAdminDb();

  // 1. Fetch completed tournaments that count for ranking
  let query = db
    .collection(TOURNAMENTS_COLLECTION)
    .where("countsForRanking", "==", true)
    .where("status", "==", "completed");

  const tourSnap = await query.get();
  let tournaments = tourSnap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Tournament[];

  if (dateFilter) {
    tournaments = tournaments.filter((t) => {
      let tDate: Date;
      if (t.startDate && typeof (t.startDate as any).toDate === "function") {
        tDate = (t.startDate as any).toDate();
      } else {
        tDate = new Date(t.startDate);
      }
      return tDate >= dateFilter.start && tDate <= dateFilter.end;
    });
  }

  if (tournaments.length === 0) return [];

  const playerMap: Record<string, any> = {};

  for (const tourn of tournaments) {
    const multiplier = tourn.pointsMultiplier ?? 1;

    // Entries
    const entriesSnap = await db
      .collection(ENTRIES_COLLECTION)
      .where("tournamentId", "==", tourn.id)
      .get();
    const entries = entriesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as TournamentEntry[];

    // Matches
    const matchesSnap = await db
      .collection(MATCHES_COLLECTION)
      .where("tournamentId", "==", tourn.id)
      .get();
    const matches = matchesSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Match[];

    // Process categories... (simplified logic based on ranking-service.ts)
    for (const cat of tourn.categories || []) {
      const catEntries = entries.filter((e) => e.categoryId === cat);
      const catMatches = matches.filter((m) => m.categoryId === cat);

      if (catEntries.length === 0) continue;

      // Logic to determine positions (simplified for brevity here, should ideally match ranking-service.ts)
      // Since this is a server-side recreation, I'll keep it consistent with the logic in ranking-service.ts

      // ... (Re-implementing calcTournamentStandings logic)
      const standingsMap: Record<string, any> = {};
      catEntries.forEach((e) => {
        if (e.id) standingsMap[e.id] = { wins: 0, losses: 0, points: 0 };
      });

      catMatches
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

      catEntries.forEach((entry) => {
        if (!entry.memberId) return;

        const position = positionMap[entry.id!] ?? catEntries.length;
        const rawPoints = getPlacementPoints(position);
        const finalPoints = Math.round(rawPoints * multiplier);

        let entryWins = 0;
        let entryLosses = 0;
        catMatches
          .filter((m) => m.status === "completed")
          .forEach((m) => {
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
          const p = playerMap[mId];
          p.totalPoints += finalPoints;
          p.tournamentsPlayed++;
          p.wins += entryWins;
          p.losses += entryLosses;
          if (p.bestPlacement === null || position < p.bestPlacement)
            p.bestPlacement = position;
        };

        addPointsToPlayer(entry.memberId, entry.externalName || entry.memberId);
        if (entry.partnerMemberId) {
          addPointsToPlayer(
            entry.partnerMemberId,
            entry.partnerExternalName || entry.partnerMemberId
          );
        }
      });
    }
  }

  const result = Object.values(playerMap).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
  return result.map((p, idx) => ({ ...p, position: idx + 1 }));
}
