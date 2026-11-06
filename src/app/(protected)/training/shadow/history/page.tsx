import React, { Suspense } from "react";

import { ShadowHistoryClient } from "@/components/training/shadow/ShadowHistoryClient";
import { getGlobalTrainingSessionsAction } from "@/lib/actions/trainings";
import { getAllMembersServer } from "@/services/member-service.server";
import { TrainingSession } from "@/types/training.types";

export const metadata = {
  title: "История на Shadow Training | БК Гълъбово",
};

export default async function GlobalShadowHistoryPage() {
  const [res, allMembers] = await Promise.all([
    getGlobalTrainingSessionsAction(100),
    getAllMembersServer().catch(() => []),
  ]);
  const sessions = (res.success ? res.data : []) as TrainingSession[];

  // Build a quick id -> name lookup map
  const memberNameMap: Record<string, string> = {};
  allMembers.forEach((m) => {
    memberNameMap[m.id] = m.name || `${m.firstName} ${m.lastName}`.trim();
  });

  // Group by member to calculate leaderboard
  const memberMinutes: Record<string, number> = {};
  sessions.forEach((s: TrainingSession) => {
    s.memberIds.forEach((id: string) => {
      if (!memberMinutes[id]) memberMinutes[id] = 0;
      memberMinutes[id] += (s.durationMs || 0) / 60000;
    });
  });

  const leaderboard = Object.entries(memberMinutes)
    .map(([id, min]) => ({
      id,
      min,
      name: memberNameMap[id] || `#${id.slice(0, 8)}`,
    }))
    .sort((a, b) => b.min - a.min)
    .slice(0, 5);

  return (
    <Suspense
      fallback={
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
      }
    >
      <ShadowHistoryClient
        sessions={sessions}
        memberNameMap={memberNameMap}
        leaderboard={leaderboard}
      />
    </Suspense>
  );
}
