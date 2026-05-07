import { getDb } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { TournamentEntry, Match } from "@/types/tournament.types";
import {
  mapDocToTournament,
  mapDocToEntry,
  mapDocToMatch,
} from "@/lib/tournament-mapper";

const TOURNAMENTS_COLLECTION = "tournaments";
const ENTRIES_COLLECTION = "tournament-entries";
const MATCHES_COLLECTION = "tournament-matches";

// ──────────────────────────────────────────────
// Точки за класиране по позиция
// ──────────────────────────────────────────────
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
  return PLACEMENT_POINTS[position] ?? 3; // 3 точки за участие
}

export interface PlayerRanking {
  memberId: string;
  memberName: string;
  totalPoints: number;
  tournamentsPlayed: number;
  wins: number;
  losses: number;
  bestPlacement: number | null;
  categoryBreakdown: {
    category: string;
    points: number;
    played: number;
  }[];
}

export interface RankingEntry {
  position: number;
  memberId: string;
  memberName: string;
  totalPoints: number;
  tournamentsPlayed: number;
  wins: number;
  losses: number;
  bestPlacement: number | null;
  categoryBreakdown: {
    category: string;
    points: number;
    played: number;
  }[];
}

// ──────────────────────────────────────────────
// Изчислява класирането от завършен турнир
// Връща: { entryId → position }
// ──────────────────────────────────────────────
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

  // Сортираме по точки и връщаме позицията
  const sorted = Object.entries(standingsMap).sort(
    ([, a], [, b]) => b.points - a.points
  );
  const positionMap: Record<string, number> = {};
  sorted.forEach(([id], idx) => {
    positionMap[id] = idx + 1;
  });

  return positionMap;
}

// ──────────────────────────────────────────────
// Основна функция за ранглиста
// ──────────────────────────────────────────────
export async function computeGlobalRankings(dateFilter?: {
  start: Date;
  end: Date;
}): Promise<RankingEntry[]> {
  const db = getDb();
  // 1. Всички завършени турнири, влизащи в ранглистата
  let q = query(
    collection(db, TOURNAMENTS_COLLECTION),
    where("countsForRanking", "==", true),
    where("status", "==", "completed")
  );

  const tourSnap = await getDocs(q);
  let tournaments = tourSnap.docs.map(mapDocToTournament);

  // Филтриране по дата, ако е зададено
  if (dateFilter) {
    tournaments = tournaments.filter((t) => {
      const tDate = new Date(t.startDate);
      return tDate >= dateFilter.start && tDate <= dateFilter.end;
    });
  }

  if (tournaments.length === 0) return [];

  // 2. За всеки турнир – вземаме entries и matches
  const playerMap: Record<string, PlayerRanking> = {};

  for (const tourn of tournaments) {
    const multiplier = tourn.pointsMultiplier ?? 1;

    // Entries
    const entriesSnap = await getDocs(
      query(
        collection(db, ENTRIES_COLLECTION),
        where("tournamentId", "==", tourn.id)
      )
    );
    const entries = entriesSnap.docs.map(mapDocToEntry);

    // Matches
    const matchesSnap = await getDocs(
      query(
        collection(db, MATCHES_COLLECTION),
        where("tournamentId", "==", tourn.id)
      )
    );
    const matches = matchesSnap.docs.map(mapDocToMatch);

    // 3. Изчисляваме позиции по категория
    for (const cat of tourn.categories) {
      const catEntries = entries.filter((e) => e.categoryId === cat);
      const catMatches = matches.filter((m) => m.categoryId === cat);

      if (catEntries.length === 0) continue;

      const positionMap = calcTournamentStandings(catEntries, catMatches);
      const catMatchesCompleted = catMatches.filter(
        (m) => m.status === "completed"
      );

      catEntries.forEach((entry) => {
        if (!entry.memberId) return; // Пропускаме гости

        const position = positionMap[entry.id!] ?? catEntries.length;
        const rawPoints = getPlacementPoints(position);
        const finalPoints = Math.round(rawPoints * multiplier);

        // Статистики от мачовете
        let entryWins = 0;
        let entryLosses = 0;
        catMatchesCompleted.forEach((m) => {
          if (m.player1EntryId === entry.id || m.player2EntryId === entry.id) {
            if (m.winnerEntryId === entry.id) entryWins++;
            else entryLosses++;
          }
        });

        // Функция за добавяне на точки на играч
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

        // Добавяме точки на първия играч
        if (entry.memberId) {
          addPointsToPlayer(
            entry.memberId,
            entry.externalName || entry.memberId
          );
        }

        // Добавяме точки на партньора (ако има такъв)
        if (entry.partnerMemberId) {
          addPointsToPlayer(
            entry.partnerMemberId,
            entry.partnerExternalName || entry.partnerMemberId
          );
        }
      });
    }
  }

  // 4. Сортираме и добавяме позиции
  const sorted = Object.values(playerMap).sort(
    (a, b) => b.totalPoints - a.totalPoints
  );
  return sorted.map((p, idx) => ({ ...p, position: idx + 1 }));
}
