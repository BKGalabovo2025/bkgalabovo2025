/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { Eye, Medal, Trophy, Zap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CourtVisualizer } from "@/components/training/CourtVisualizer";
import { DeleteTrainingButton } from "@/components/training/DeleteTrainingButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/auth-context";
import { getTrainingSessionsForMemberAction } from "@/lib/actions/trainings";
import { ZONE_NAMES, ZoneId } from "@/lib/shadow-training/audio-map";
import { TrainingSession } from "@/types/training.types";

interface Props {
  memberId: string;
}

export function MemberTrainingsHistory({ memberId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sessionParam = searchParams?.get("session") || null;

  const { user, idToken, loading: authLoading } = useAuth();
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [selectedSession, setSelectedSession] =
    useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncSessionUrl = useCallback(
    (sessionId: string | null) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (sessionId) {
        params.set("session", sessionId);
      } else {
        params.delete("session");
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      router.replace(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handleOpenSession = useCallback(
    (session: TrainingSession) => {
      setSelectedSession(session);
      if (session.id) {
        syncSessionUrl(session.id);
      }
    },
    [syncSessionUrl]
  );

  const handleCloseSession = useCallback(() => {
    setSelectedSession(null);
    if (sessionParam) {
      syncSessionUrl(null);
    }
  }, [sessionParam, syncSessionUrl]);

  const fetchTrainings = useCallback(async () => {
    if (authLoading) return;
    if (!idToken && !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const freshToken = (await user?.getIdToken()) || idToken || "";
      const res = await getTrainingSessionsForMemberAction(
        freshToken,
        memberId
      );
      if (res.success && res.data) {
        setTrainings(res.data as TrainingSession[]);
      } else {
        setError((res as any).error || "Неизвестна грешка");
      }
    } catch (err: any) {
      setError(err?.message || "Неизвестна грешка");
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, idToken, memberId]);

  useEffect(() => {
    void fetchTrainings();
  }, [fetchTrainings]);

  useEffect(() => {
    if (!loading && sessionParam && trainings.length > 0) {
      const match = trainings.find((t) => t.id === sessionParam);
      if (match && selectedSession?.id !== match.id) {
        setSelectedSession(match);
      }
    }
  }, [loading, sessionParam, trainings, selectedSession?.id]);

  // Calculate Badges & Agility Personal Best before conditional returns
  const totalMinutes = useMemo(
    () =>
      Math.floor(
        trainings.reduce((sum, t) => sum + (t.durationMs || 0), 0) / 60000
      ),
    [trainings]
  );

  // Личен рекорд (PB) за Agility Test (Спринт тест)
  const agilitySessions = useMemo(
    () => trainings.filter((t) => t.shadowDetails?.mode === "agility_test"),
    [trainings]
  );

  const personalBestAgilitySec = useMemo(() => {
    const times = agilitySessions
      .map(
        (t) =>
          t.shadowDetails?.agilityTestTimeSec ||
          (t.durationMs ? Math.round((t.durationMs / 1000) * 10) / 10 : 0)
      )
      .filter((time) => time > 0);
    return times.length > 0 ? Math.min(...times) : null;
  }, [agilitySessions]);

  if (loading) {
    return (
      <div className="animate-pulse p-8 text-center text-zinc-500 dark:text-zinc-400">
        Зареждане на тренировки...
      </div>
    );
  }

  if (trainings.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-100 bg-white p-10 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
        {error ? (
          <p className="text-sm text-red-500">Грешка: {error}</p>
        ) : (
          <div className="space-y-4">
            <p>Няма записани тренировки за този член.</p>
            <Link
              href={`/training/shadow?memberId=${memberId}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Zap className="size-3.5" />
              Shadow Training
            </Link>
          </div>
        )}
      </div>
    );
  }

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
  if (personalBestAgilitySec !== null && personalBestAgilitySec <= 20)
    badges.push({
      id: "speedster",
      name: "Супер Скорост",
      desc: `Agility тест под 20 сек (${personalBestAgilitySec.toFixed(1)}s)`,
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Personal Best Card if available */}
        {personalBestAgilitySec !== null && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-amber-300/80 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-2.5 shadow-2xs dark:border-amber-700/60 dark:from-amber-950/40 dark:to-orange-950/20">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-2xs">
              <Trophy size={16} />
            </div>
            <div>
              <span className="text-[10px] font-black tracking-wider uppercase text-amber-800 dark:text-amber-300">
                Личен рекорд (PB) • Agility Test
              </span>
              <p className="text-sm font-black text-zinc-900 dark:text-white">
                {personalBestAgilitySec.toFixed(1)}s{" "}
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                  (20 движения)
                </span>
              </p>
            </div>
          </div>
        )}

        <Link
          href={`/training/shadow?memberId=${memberId}`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Zap className="size-3.5" />
          Нов Shadow за този състезател
        </Link>
      </div>

      {/* Badges Section */}
      {badges.length > 0 && (
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-4 flex items-center gap-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
            <Medal className="size-4" /> Значки за постижения
          </h3>
          <div className="flex flex-wrap gap-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-blue-200/70 bg-blue-50/50 p-3 text-center dark:border-blue-900/40 dark:bg-blue-950/20"
              >
                <div className="font-bold text-blue-700 dark:text-blue-300">
                  {b.name}
                </div>
                <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {b.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      <div className="rounded-3xl border border-zinc-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h3 className="mb-6 flex items-center gap-2 text-[11px] font-medium tracking-widest text-zinc-400 uppercase">
          <Zap className="size-4" /> Shadow тренировки (Общо: {totalMinutes}{" "}
          мин)
        </h3>

        <div className="space-y-4">
          {trainings.map((session) => {
            const durationMs = session.durationMs || 0;
            const mins = Math.floor(durationMs / 60000);
            const secs = Math.floor((durationMs % 60000) / 1000);
            const detailsWithIndiv =
              session.shadowDetails as TrainingSession["shadowDetails"] & {
                individualRpe?: Record<string, number>;
              };
            const memberRpe =
              detailsWithIndiv?.individualRpe?.[memberId] ??
              session.shadowDetails?.rpeScores?.[memberId] ??
              session.rpeScores?.[memberId] ??
              null;

            return (
              <Card
                key={session.id}
                className="border-zinc-100 shadow-none transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              >
                <CardContent className="flex flex-col justify-between gap-4 p-4 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
                      <span>
                        {session.shadowDetails?.mode === "agility_test"
                          ? "Тест за бързина (Agility)"
                          : "Shadow Training"}
                      </span>
                      {memberRpe !== null && (
                        <Badge
                          variant="secondary"
                          className="rounded-md bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        >
                          RPE {memberRpe}/10
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {format(new Date(session.date), "dd MMMM yyyy, HH:mm", {
                        locale: bg,
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 sm:gap-6 dark:text-zinc-300">
                    <div className="text-center">
                      <div className="font-bold">
                        {`${mins} мин ${secs} сек`}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase">
                        Време
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold">
                        {`${session.shadowDetails?.setsCompleted ?? session.shadowDetails?.totalSets ?? 1} / ${session.shadowDetails?.totalSets || 1}`}
                      </div>
                      <div className="text-[10px] text-zinc-400 uppercase">
                        Серии
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenSession(session)}
                      className="h-8 rounded-xl border-zinc-200 text-xs font-bold hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      <Eye size={13} className="mr-1.5" />
                      Детайли & Heatmap
                    </Button>

                    <DeleteTrainingButton
                      trainingId={session.id || ""}
                      onDeleted={fetchTrainings}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Modal Dialog for Session Details & Court Heatmap */}
      {selectedSession && (
        <Dialog
          open={Boolean(selectedSession)}
          onOpenChange={(open) => {
            if (!open) handleCloseSession();
          }}
        >
          <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-black sm:text-lg">
                <Zap className="size-5 text-blue-600 dark:text-blue-400" />
                Детайли за тренировката
              </DialogTitle>
              <DialogDescription className="text-xs">
                {format(new Date(selectedSession.date), "dd MMMM yyyy, HH:mm", {
                  locale: bg,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Продължителност
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {Math.floor((selectedSession.durationMs || 0) / 60000)} мин{" "}
                    {Math.floor(
                      ((selectedSession.durationMs || 0) % 60000) / 1000
                    )}{" "}
                    сек
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Серии / Движения
                  </span>
                  <p className="text-xs font-black text-zinc-900 dark:text-white">
                    {selectedSession.shadowDetails?.setsCompleted || 1} /{" "}
                    {selectedSession.shadowDetails?.totalSets || 1}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Индивидуално RPE
                  </span>
                  <p className="text-xs font-black text-blue-600 dark:text-blue-400">
                    {(() => {
                      const detailsWithIndiv =
                        selectedSession.shadowDetails as TrainingSession["shadowDetails"] & {
                          individualRpe?: Record<string, number>;
                        };
                      const rpe =
                        detailsWithIndiv?.individualRpe?.[memberId] ??
                        selectedSession.shadowDetails?.rpeScores?.[memberId] ??
                        selectedSession.rpeScores?.[memberId] ??
                        null;
                      return rpe !== null ? `${rpe} / 10` : "—";
                    })()}
                  </p>
                </div>
              </div>

              {/* Court Visualizer */}
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <span className="mb-2 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
                  Схема на корта
                </span>
                <div className="w-full max-w-56">
                  <CourtVisualizer
                    viewMode="half"
                    allowToggleView={false}
                    previewZones={
                      selectedSession.shadowDetails?.heatmap
                        ? (Object.keys(
                            selectedSession.shadowDetails.heatmap
                          ) as ZoneId[])
                        : undefined
                    }
                  />
                </div>
              </div>

              {/* Heatmap Breakdown if available */}
              {selectedSession.shadowDetails?.heatmap &&
                (() => {
                  const heatmap = selectedSession.shadowDetails.heatmap;
                  const entries = Object.entries(heatmap).filter(
                    ([, count]) => typeof count === "number" && count > 0
                  );
                  const totalHits = entries.reduce(
                    (acc, [, count]) => acc + (count as number),
                    0
                  );
                  if (totalHits === 0) return null;
                  return (
                    <div className="space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold tracking-wider text-zinc-500 uppercase">
                          Разпределение по зони (Heatmap)
                        </h4>
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          Общо: {totalHits} удара
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {entries.map(([zoneKey, count]) => {
                          const pct = Math.round(
                            ((count as number) / totalHits) * 100
                          );
                          const label =
                            ZONE_NAMES[zoneKey as ZoneId] || zoneKey;
                          return (
                            <div
                              key={zoneKey}
                              className="flex items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                            >
                              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {label}
                              </span>
                              <span className="font-black text-blue-600 dark:text-blue-400">
                                {count as number} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

              {/* Notes */}
              {selectedSession.notes && (
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">
                    Бележки от треньора:
                  </span>{" "}
                  {selectedSession.notes}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
