import { TournamentEntry, Match } from "@/types/tournament.types";

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
