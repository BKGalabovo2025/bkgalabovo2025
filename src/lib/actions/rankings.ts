"use server";
import "server-only";

import { revalidatePath } from "next/cache";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  calcTournamentStandings,
  computeRankingsCore,
  getPlacementPoints,
} from "@/lib/ranking-utils";
import { serverCache } from "@/lib/server-cache";
import { getAllMembersServer } from "@/services/member-service.server";
import { computeGlobalRankingsServer } from "@/services/ranking-service.server";
import { Member } from "@/types/member.types";
import { RankingEntry } from "@/types/ranking.types";
import { Match, Tournament, TournamentEntry } from "@/types/tournament.types";

function getPeriodFilter(
  period: string
): { start: Date; end: Date } | undefined {
  const now = new Date();
  if (period === "year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }
  if (period === "h1") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 5, 30, 23, 59, 59),
    };
  }
  if (period === "h2") {
    return {
      start: new Date(now.getFullYear(), 6, 1),
      end: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
    };
  }
  return undefined;
}

/**
 * Refreshes the global rankings for a given period.
 * Called by RankingsClient every 60 seconds for live updates.
 */
export async function refreshRankingsAction(
  period: string = "all"
): Promise<{ rankings: RankingEntry[]; updatedAt: string }> {
  const filter = getPeriodFilter(period);

  const [rankingsData, membersData] = await Promise.all([
    computeGlobalRankingsServer(filter),
    getAllMembersServer(),
  ]);

  const memberDict: Record<string, Member> = {};
  membersData.forEach((m: Member) => {
    if (m.id) memberDict[m.id] = m;
  });

  const enriched = rankingsData.map((r: RankingEntry) => ({
    ...r,
    memberName: memberDict[r.memberId]
      ? `${memberDict[r.memberId].firstName} ${memberDict[r.memberId].lastName}`
      : r.memberName,
  }));

  return {
    rankings: enriched,
    updatedAt: new Date().toISOString(),
  };
}

export async function syncRankingsAction(siteId?: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const db = getAdminDb();

    let tourQuery: FirebaseFirestore.Query = db
      .collection("tournaments")
      .where("countsForRanking", "==", true)
      .where("status", "==", "completed");

    if (siteId && siteId !== "bkgalabovo") {
      tourQuery = tourQuery.where("siteId", "==", siteId);
    }

    const [tourSnap, membersSnap] = await Promise.all([
      tourQuery.get(),
      db.collection("members").get(),
    ]);

    const tournaments = tourSnap.docs.map((doc) => ({
      ...(doc.data() as Tournament),
      id: doc.id,
    }));

    const existingMemberIds = new Set(membersSnap.docs.map((d) => d.id));

    if (tournaments.length === 0) {
      return {
        success: true,
        message: "Няма приключени турнири за синхронизация.",
      };
    }

    const tournamentDataCache = new Map<
      string,
      { entries: TournamentEntry[]; matches: Match[] }
    >();

    const fetchTournamentData = async (tournamentId: string) => {
      if (tournamentDataCache.has(tournamentId)) {
        return tournamentDataCache.get(tournamentId)!;
      }

      const [entriesSnap, matchesSnap] = await Promise.all([
        db
          .collection("tournament_entries")
          .where("tournamentId", "==", tournamentId)
          .get(),
        db
          .collection("tournament_matches")
          .where("tournamentId", "==", tournamentId)
          .get(),
      ]);

      const entries = entriesSnap.docs.map((doc) => ({
        ...(doc.data() as TournamentEntry),
        id: doc.id,
      }));
      const matches = matchesSnap.docs.map((doc) => ({
        ...(doc.data() as Match),
        id: doc.id,
      }));

      const data = { entries, matches };
      tournamentDataCache.set(tournamentId, data);
      return data;
    };

    const rankings = await computeRankingsCore(
      tournaments,
      fetchTournamentData
    );

    const tournamentResultsByMember = new Map<
      string,
      Array<{
        tournamentId: string;
        tournamentTitle: string;
        startDate: string;
        category: string;
        position: number;
        points: number;
      }>
    >();

    for (const tourn of tournaments) {
      if (!tourn.id) continue;
      const multiplier = tourn.pointsMultiplier ?? 1;
      const { entries, matches } = await fetchTournamentData(tourn.id);

      for (const cat of tourn.categories || []) {
        const catEntries = entries.filter((e) => e.categoryId === cat);
        const catMatches = matches.filter((m) => m.categoryId === cat);
        if (catEntries.length === 0) continue;

        const positionMap = calcTournamentStandings(catEntries, catMatches);

        for (const entry of catEntries) {
          const position = positionMap[entry.id!] ?? catEntries.length;
          const points = Math.round(getPlacementPoints(position) * multiplier);
          const resultRecord = {
            tournamentId: tourn.id,
            tournamentTitle: tourn.title || "Турнир",
            startDate:
              typeof tourn.startDate === "string"
                ? tourn.startDate
                : new Date().toISOString(),
            category: cat,
            position,
            points,
          };

          if (entry.memberId) {
            const list = tournamentResultsByMember.get(entry.memberId) || [];
            list.push(resultRecord);
            tournamentResultsByMember.set(entry.memberId, list);
          }
          if (entry.partnerMemberId) {
            const list =
              tournamentResultsByMember.get(entry.partnerMemberId) || [];
            list.push(resultRecord);
            tournamentResultsByMember.set(entry.partnerMemberId, list);
          }
        }
      }
    }

    const validRankings = rankings.filter((r) =>
      existingMemberIds.has(r.memberId)
    );

    const chunkSize = 400;
    for (let i = 0; i < validRankings.length; i += chunkSize) {
      const chunk = validRankings.slice(i, i + chunkSize);
      const batch = db.batch();
      for (const entry of chunk) {
        const memberRef = db.collection("members").doc(entry.memberId);
        batch.update(memberRef, {
          rankingPoints: entry.totalPoints,
          rankingPosition: entry.position,
          tournamentResults:
            tournamentResultsByMember.get(entry.memberId) || [],
          updatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    }

    serverCache.invalidatePattern("members:");
    revalidatePath("/rankings");
    revalidatePath("/members");

    return {
      success: true,
      message: "Ранглистата беше синхронизирана с профилите.",
    };
  } catch (error) {
    console.error("syncRankingsAction Error:", error);
    return { success: false, message: "Възникна грешка при синхронизацията." };
  }
}
