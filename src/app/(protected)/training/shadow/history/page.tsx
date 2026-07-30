import { format } from "date-fns";
import { ChevronLeft, Trophy, Zap } from "lucide-react";
import Link from "next/link";

import { DeleteTrainingButton } from "@/components/training/DeleteTrainingButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGlobalTrainingSessionsAction } from "@/lib/actions/trainings";
import { getAllMembersServer } from "@/services/member-service.server";
import { TrainingSession } from "@/types/training.types";

export const metadata = {
  title: "Shadow Training History | BK Galabovo",
};

export default async function GlobalShadowHistoryPage() {
  const getModeName = (mode?: string) => {
    if (mode === "ghost_match") return "Ghost Match";
    if (mode === "agility_test") return "Скоростен Тест";
    return "Стандартна тренировка";
  };

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
    <div className="flex min-h-full w-full flex-1 flex-col overflow-y-auto bg-zinc-50 px-4 pt-4 pb-20 dark:bg-black">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <div className="flex flex-col gap-2">
          <Link href="/training/shadow" className="self-start">
            <Button
              variant="ghost"
              size="sm"
              className="mb-2 -ml-3 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <ChevronLeft className="mr-1 size-4" />
              Назад към Треньора
            </Button>
          </Link>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                <Zap className="text-primary" /> История на Тренировките
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Всички проведени сесии в клуба.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-primary/20 bg-primary/5 shadow-md md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Топ 5 Най-трудолюбиви
              </CardTitle>
              <CardDescription>За текущия месец</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-zinc-500">Няма данни.</p>
                ) : (
                  leaderboard.map((lb, idx) => (
                    <Link
                      key={lb.id}
                      href={`/members/${lb.id}`}
                      className="group -mx-2 flex cursor-pointer items-center justify-between rounded-lg border-b border-zinc-200 px-2 pb-2 transition-colors last:border-0 hover:bg-primary/5 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-4 text-lg font-bold text-zinc-400 transition-colors group-hover:text-primary">
                          {idx + 1}.
                        </div>
                        <div className="font-medium transition-colors group-hover:text-primary">
                          {lb.name}
                        </div>
                      </div>
                      <div className="font-bold text-primary">
                        {Math.round(lb.min)} мин
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Последни сесии</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <p className="text-sm text-zinc-500">
                    Няма проведени тренировки.
                  </p>
                ) : (
                  sessions.map((session: TrainingSession) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-100 p-4 dark:bg-zinc-900"
                    >
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {getModeName(session.shadowDetails?.mode)}
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          {format(new Date(session.date), "dd MMM yyyy HH:mm")}{" "}
                          • {session.memberIds.length} участници
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-sm font-bold">
                            {Math.round((session.durationMs || 0) / 60000)}{" "}
                            минути
                          </div>
                          <div className="text-xs text-zinc-500">
                            {session.shadowDetails?.totalSets || 0} серии
                          </div>
                        </div>
                        <DeleteTrainingButton trainingId={session.id!} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
