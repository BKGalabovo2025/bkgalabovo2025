"use server";

import { computeGlobalRankingsServer } from "@/services/ranking-service.server";
import { getAllMembersServer } from "@/services/member-service.server";
import { RankingEntry } from "@/types/ranking.types";
import { Member } from "@/types/member.types";

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
