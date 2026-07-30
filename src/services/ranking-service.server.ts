import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { RankingEntry } from "@/types/ranking.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

const TOURNAMENTS_COLLECTION = "tournaments";
const ENTRIES_COLLECTION = "tournament_entries";
const MATCHES_COLLECTION = "tournament_matches";

import { computeRankingsCore } from "@/lib/ranking-utils";

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
        const rawDate = t.startDate as unknown as
          | { toDate: () => Date }
          | string
          | Date;
        const tDate =
          typeof (rawDate as { toDate?: () => Date }).toDate === "function"
            ? (rawDate as { toDate: () => Date }).toDate()
            : new Date(rawDate as string);
        return tDate >= dateFilter.start && tDate <= dateFilter.end;
      });
    }

    if (tournaments.length === 0) return [];

    const fetchTournamentData = async (tournamentId: string) => {
      const entriesSnap = await db
        .collection(ENTRIES_COLLECTION)
        .where("tournamentId", "==", tournamentId)
        .get();
      const entries = entriesSnap.docs.map((doc) => ({
        ...(doc.data() as TournamentEntry),
        id: doc.id,
      }));

      const matchesSnap = await db
        .collection(MATCHES_COLLECTION)
        .where("tournamentId", "==", tournamentId)
        .get();
      const matches = matchesSnap.docs.map((doc) => ({
        ...(doc.data() as Match),
        id: doc.id,
      }));

      return { entries, matches };
    };

    const sorted = await computeRankingsCore(tournaments, fetchTournamentData);

    // Final serialization for Client Component
    return serializeFirestoreData(sorted) as RankingEntry[];
  } catch (error) {
    console.error("Error computing rankings on server:", error);
    throw error;
  }
}
