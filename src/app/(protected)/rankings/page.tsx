import { computeGlobalRankingsServer } from "@/services/ranking-service.server";
import { getAllMembersServer } from "@/services/member-service.server";
import { Member } from "@/types/member.types";
import { RankingEntry } from "@/types/ranking.types";
import RankingsClient from "./RankingsClient";
import { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ранглиста - Бадминтон клуб Гълъбово",
  description:
    "Глобално класиране по натрупани точки от всички официални турнири",
};

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

export default async function RankingsPage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  const searchParams = await props.searchParams;
  const period = searchParams.period || "all";
  const filter = getPeriodFilter(period);

  let enrichedRankings: RankingEntry[] = [];
  let error = null;

  try {
    // Сървърно извличане на данни
    const [rankingsData, membersData] = await Promise.all([
      computeGlobalRankingsServer(filter),
      getAllMembersServer(),
    ]);

    // Обогатяване на данните с истински имена
    const memberDict: Record<string, Member> = {};
    membersData.forEach((m: Member) => {
      if (m.id) memberDict[m.id] = m;
    });

    enrichedRankings = rankingsData.map((r: RankingEntry) => ({
      ...r,
      memberName: memberDict[r.memberId]
        ? `${memberDict[r.memberId].firstName} ${memberDict[r.memberId].lastName}`
        : r.memberName,
    }));
  } catch (err) {
    console.error("Error computing rankings:", err);
    error = "Неуспешно зареждане на ранглистата. Моля, опитайте по-късно.";
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Глобална ранглиста"
        description="Официално класиране на състезателите въз основа на натрупани точки от клубни и национални турнири."
        breadcrumbs={[
          { label: "Начало", href: "/dashboard" },
          { label: "Ранглиста" },
        ]}
      />

      {error ? (
        <div className="bg-rose-50 border border-rose-100 rounded-[32px] p-8 text-center">
          <p className="text-rose-600 font-bold">{error}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-8">
            <RankingsClient initialRankings={enrichedRankings} />
          </div>
        </div>
      )}
    </div>
  );
}
