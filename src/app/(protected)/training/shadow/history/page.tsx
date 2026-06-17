import { getGlobalTrainingSessionsAction } from "@/lib/actions/trainings";
import { cookies } from "next/headers";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";
import { Zap, Trophy } from "lucide-react";
import { DeleteTrainingButton } from "@/components/training/DeleteTrainingButton";

export const metadata = {
  title: "Shadow Training History | BK Galabovo",
};

export default async function GlobalShadowHistoryPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value || "";
  const res = await getGlobalTrainingSessionsAction(token, 100);
  const sessions = res.success ? res.data : [];

  // Group by member to calculate leaderboard
  // (In real life we would resolve memberIds to real names. We are skipping exact name resolution here for brevity, 
  // but we can assume we'd join with members collection).
  const memberMinutes: Record<string, number> = {};
  sessions.forEach((s: any) => {
    s.memberIds.forEach((id: string) => {
      if (!memberMinutes[id]) memberMinutes[id] = 0;
      memberMinutes[id] += (s.durationMs || 0) / 60000;
    });
  });

  const leaderboard = Object.entries(memberMinutes)
    .map(([id, min]) => ({ id, min }))
    .sort((a, b) => b.min - a.min)
    .slice(0, 5);

  return (
    <div className="flex-1 w-full flex flex-col min-h-full pb-20 pt-4 px-4 bg-zinc-50 dark:bg-black overflow-y-auto">
      <div className="w-full max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="text-primary" /> История на Тренировките
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Всички проведени сесии в клуба.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-primary/5 border-primary/20 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="text-yellow-500" /> Топ 5 Най-трудолюбиви
              </CardTitle>
              <CardDescription>За текущия месец</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.length === 0 ? (
                  <p className="text-zinc-500 text-sm">Няма данни.</p>
                ) : (
                  leaderboard.map((lb, idx) => (
                    <div key={lb.id} className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-lg text-zinc-400 w-4">{idx + 1}.</div>
                        <div className="font-medium">Играч {lb.id}</div>
                      </div>
                      <div className="text-primary font-bold">{Math.round(lb.min)} мин</div>
                    </div>
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
                  <p className="text-zinc-500 text-sm">Няма проведени тренировки.</p>
                ) : (
                  sessions.map((session: any) => (
                    <div key={session.id} className="p-4 bg-zinc-100 dark:bg-zinc-900 rounded-xl flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {session.shadowDetails?.mode === "ghost_match" ? "Ghost Match" : 
                           session.shadowDetails?.mode === "agility_test" ? "Скоростен Тест" : "Стандартна тренировка"}
                        </div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {format(new Date(session.date), "dd MMM yyyy HH:mm")} • {session.memberIds.length} участници
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <div className="text-sm font-bold">{Math.round((session.durationMs || 0) / 60000)} минути</div>
                          <div className="text-xs text-zinc-500">{(session.shadowDetails?.totalSets || 0)} серии</div>
                        </div>
                        <DeleteTrainingButton trainingId={session.id} />
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
