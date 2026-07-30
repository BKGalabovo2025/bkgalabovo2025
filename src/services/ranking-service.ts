import { getDocs, query, where } from "firebase/firestore";

import {
  getTournamentEntriesQuery,
  getTournamentMatchesQuery,
  getTournamentsQuery,
} from "@/lib/firebase-collections";
import { computeRankingsCore } from "@/lib/ranking-utils";
import {
  mapDocToEntry,
  mapDocToMatch,
  mapDocToTournament,
} from "@/lib/tournament-mapper";
import { RankingEntry } from "@/types/ranking.types";

// ─────────────────────────────────────────────────────────────────
// Основна функция за ранглиста
// ─────────────────────────────────────────────────────────────────
export async function computeGlobalRankings(dateFilter?: {
  start: Date;
  end: Date;
}): Promise<RankingEntry[]> {
  // 1. Всички завършени турнири, влизащи в ранглистата
  const q = query(
    getTournamentsQuery(),
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

  const fetchTournamentData = async (tournamentId: string) => {
    const entriesSnap = await getDocs(
      query(
        getTournamentEntriesQuery(),
        where("tournamentId", "==", tournamentId)
      )
    );
    const entries = entriesSnap.docs.map(mapDocToEntry);

    const matchesSnap = await getDocs(
      query(
        getTournamentMatchesQuery(),
        where("tournamentId", "==", tournamentId)
      )
    );
    const matches = matchesSnap.docs.map(mapDocToMatch);

    return { entries, matches };
  };

  return computeRankingsCore(tournaments, fetchTournamentData);
}
