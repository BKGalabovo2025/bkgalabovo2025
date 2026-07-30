/* eslint-disable sonarjs/no-nested-conditional */

/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import { Medal, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { DeleteTrainingButton } from "@/components/training/DeleteTrainingButton";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { getTrainingSessionsForMemberAction } from "@/lib/actions/trainings";
import { TrainingSession } from "@/types/training.types";

interface Props {
  memberId: string;
}

export function MemberTrainingsHistory({ memberId }: Props) {
  const { idToken } = useAuth();
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // We should also handle re-fetching if a training is deleted. But router.refresh() from DeleteTrainingButton
  // won't re-trigger this client-side fetch unless we pass a callback.
  // Let's create a fetch function to be called after deletion.

  const fetchTrainings = useCallback(() => {
    if (!idToken) return;
    setLoading(true);
    getTrainingSessionsForMemberAction(idToken, memberId).then((res) => {
      if (res.success && res.data) {
        setTrainings(res.data as TrainingSession[]);
      } else {
        setError((res as any).error || "Неизвестна грешка");
      }
      setLoading(false);
    });
  }, [idToken, memberId]);

  useEffect(() => {
    fetchTrainings();
  }, [fetchTrainings]);

  if (loading) {
    return (
      <div className="animate-pulse p-8 text-center text-slate-400">
        Зареждане на тренировки...
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-100 bg-white p-10 text-center text-zinc-500">
        {error ? (
          <p className="text-sm text-red-500">Грешка: {error}</p>
        ) : (
          "Няма записани тренировки за този член."
        )}
      </div>
    );
  }

  // Calculate Badges based on total duration
  const totalMinutes = Math.round(
    trainings.reduce((sum, t) => sum + (t.durationMs || 0), 0) / 60000
  );
  const badges = [];
  if (totalMinutes > 60)
    badges.push({
      id: "iron",
      name: "Железни крака",
      desc: "Над 1 час Shadow Training",
    });
  if (totalMinutes > 300)
    badges.push({
      id: "lightning",
      name: "Светкавица",
      desc: "Над 5 часа Shadow Training",
    });

  return (
    <div className="space-y-6">
      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
            <Medal className="size-4" /> Значки за постижения
          </h3>
          <div className="flex gap-4">
            {badges.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center"
              >
                <div className="font-bold text-primary">{b.name}</div>
                <div className="mt-1 text-xs text-zinc-500">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      <div className="rounded-3xl border border-zinc-100 bg-white p-6">
        <h3 className="mb-6 flex items-center gap-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
          <Zap className="size-4" /> История на тренировките (Общо:{" "}
          {totalMinutes} мин)
        </h3>

        <div className="space-y-4">
          {trainings.map((session) => (
            <Card
              key={session.id}
              className="border-zinc-100 shadow-none transition-colors hover:bg-zinc-50"
            >
              <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
                <div>
                  <div className="font-semibold text-zinc-900">
                    {session.shadowDetails?.mode === "ghost_match"
                      ? "Ghost Match"
                      : session.shadowDetails?.mode === "agility_test"
                        ? "Скоростен Тест"
                        : "Shadow Training"}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    {format(new Date(session.date), "dd MMMM yyyy, HH:mm")}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm text-zinc-600">
                  <div className="text-center">
                    <div className="font-bold">
                      {Math.round((session.durationMs || 0) / 60000)}
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase">
                      Мин
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">
                      {session.shadowDetails?.totalSets || 0}
                    </div>
                    <div className="text-[10px] text-zinc-400 uppercase">
                      Серии
                    </div>
                  </div>
                  <div onClick={() => setTimeout(fetchTrainings, 500)}>
                    <DeleteTrainingButton trainingId={session.id || ""} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
