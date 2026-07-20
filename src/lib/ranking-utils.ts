import { Tournament, TournamentEntry, Match } from "@/types/tournament.types";
import { PlayerRanking, RankingEntry } from "@/types/ranking.types";

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

export function getPlacementPoints(position: number): number {
  return PLACEMENT_POINTS[position] ?? 3; // 3 точки за участие
}

export function calcTournamentStandings(
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

/**
 * Shared core logic for computing rankings across both Client and Server environments.
 */
export async function computeRankingsCore(
  tournaments: Tournament[],
  fetchTournamentData: (
    tournamentId: string
  ) => Promise<{ entries: TournamentEntry[]; matches: Match[] }>
): Promise<RankingEntry[]> {
  const playerMap: Record<string, PlayerRanking> = {};

  for (const tourn of tournaments) {
    if (!tourn.id) continue;
    
    const multiplier = tourn.pointsMultiplier ?? 1;
    const { entries, matches } = await fetchTournamentData(tourn.id);

    for (const cat of tourn.categories) {
      const catEntries = entries.filter((e) => e.categoryId === cat);
      const catMatches = matches.filter((m) => m.categoryId === cat);

      if (catEntries.length === 0) continue;

      const positionMap = calcTournamentStandings(catEntries, catMatches);
      const catMatchesCompleted = catMatches.filter(
        (m) => m.status === "completed"
      );

      catEntries.forEach((entry) => {
        if (!entry.memberId) return; // Skip guests

        const position = positionMap[entry.id!] ?? catEntries.length;
        const rawPoints = getPlacementPoints(position);
        const finalPoints = Math.round(rawPoints * multiplier);

        let entryWins = 0;
        let entryLosses = 0;
        catMatchesCompleted.forEach((m) => {
          if (m.player1EntryId === entry.id || m.player2EntryId === entry.id) {
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

          let catLabel = "Смесени";
          if (cat === "singles") catLabel = "Единично";
          else if (cat === "doubles") catLabel = "Двойки";
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
  return sorted.map((p, idx) => ({ ...p, position: idx + 1 }));
}
