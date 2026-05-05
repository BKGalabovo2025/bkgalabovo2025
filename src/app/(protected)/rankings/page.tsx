import { computeGlobalRankings } from "@/services/ranking-service";
import { getAllMembers } from "@/services/member-service";
import { Member } from "@/types/member.types";
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

  // Сървърно извличане на данни
  const [rankingsData, membersData] = await Promise.all([
    computeGlobalRankings(filter),
    getAllMembers(),
  ]);

  // Обогатяване на данните с истински имена
  const memberDict: Record<string, Member> = {};
  membersData.forEach((m) => {
    if (m.id) memberDict[m.id] = m;
  });

  const enrichedRankings = rankingsData.map((r) => ({
    ...r,
    memberName: memberDict[r.memberId]
      ? `${memberDict[r.memberId].firstName} ${memberDict[r.memberId].lastName}`
      : r.memberName,
  }));

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

      <div className="bg-white dark:bg-zinc-950 rounded-[32px] shadow-xl shadow-blue-900/5 border border-slate-100 dark:border-zinc-800 overflow-hidden">
        <div className="p-8">
          <RankingsClient initialRankings={enrichedRankings} />
        </div>
      </div>
    </div>
  );
}
