"use client";

import {
  Award,
  CheckCircle2,
  Clock,
  Layers,
  Minus,
  Plus,
  Save,
  Target,
  Users,
  XCircle,
  Zap,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { ShadowPlayer, ShadowSettings } from "@/hooks/useShadowTrainer";
import { recordShadowAgilityAssessmentAction } from "@/lib/actions/trainings";

interface ShadowReportFormProps {
  rpeScore: number;
  setRpeScore: (score: number) => void;
  rpeNotes: string;
  setRpeNotes: (notes: string) => void;
  onSave: (
    rpe?: number,
    notes?: string,
    individualRpe?: Record<string, number>
  ) => void;
  onDiscard?: () => void;
  settings?: ShadowSettings;
  actualElapsedMs?: number;
  completedSets?: number;
  agilityActionsDone?: number;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} сек`;
  return `${minutes} мин ${seconds} сек`;
}

function getModeLabel(mode: string): string {
  if (mode === "agility_test") return "Тест за бързина (Спринт)";
  return "Интервална тренировка";
}

export function ShadowReportForm({
  rpeScore,
  setRpeScore,
  rpeNotes,
  setRpeNotes,
  onSave,
  onDiscard,
  settings,
  actualElapsedMs = 0,
  completedSets = 0,
  agilityActionsDone = 0,
}: ShadowReportFormProps) {
  const { idToken, user } = useAuth();
  const [customPlayerRpe, setCustomPlayerRpe] = useState<
    Record<string, number>
  >({});
  const [recordedAssessments, setRecordedAssessments] = useState<
    Record<string, boolean>
  >({});
  const [recordingMemberId, setRecordingMemberId] = useState<string | null>(
    null
  );

  const effectiveIndividualRpe = useMemo(() => {
    const map: Record<string, number> = {};
    (settings?.activePlayers || []).forEach((p) => {
      map[p.id] = customPlayerRpe[p.id] ?? rpeScore;
    });
    return map;
  }, [settings?.activePlayers, customPlayerRpe, rpeScore]);

  const adjustPlayerRpe = (playerId: string, delta: number) => {
    setCustomPlayerRpe((prev) => {
      const current = prev[playerId] ?? rpeScore;
      const next = Math.min(10, Math.max(1, current + delta));
      return { ...prev, [playerId]: next };
    });
  };

  const handleRecordOfficialAssessment = async (player: ShadowPlayer) => {
    const pName =
      player.displayName ||
      `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
      "Състезател";
    const elapsedSeconds = Number((actualElapsedMs / 1000).toFixed(1));
    const actionsCount = agilityActionsDone || settings?.workSec || 20;

    setRecordingMemberId(player.id);
    try {
      const res = await recordShadowAgilityAssessmentAction(
        idToken || undefined,
        {
          memberId: player.id,
          memberName: pName,
          ageGroup: player.ageGroup || settings?.ageGroup || "U17",
          timeSec: elapsedSeconds,
          actionsCount,
          recordedBy: user?.displayName || user?.email || "Треньор",
        }
      );

      if (res.success) {
        setRecordedAssessments((prev) => ({ ...prev, [player.id]: true }));
        toast.success(
          `Нормативът за ${pName} (${elapsedSeconds}s) е записан официално в досието!`
        );
      } else {
        toast.error(res.message || "Грешка при запис на норматива в досието.");
      }
    } catch (err) {
      console.error("Failed to record official assessment:", err);
      toast.error("Възникна системна грешка при записване на теста.");
    } finally {
      setRecordingMemberId(null);
    }
  };

  const rpeColors = [
    "",
    "text-green-600 dark:text-green-400",
    "text-green-600 dark:text-green-400",
    "text-green-500",
    "text-lime-600 dark:text-lime-400",
    "text-yellow-600 dark:text-yellow-400",
    "text-amber-600 dark:text-yellow-500",
    "text-orange-600 dark:text-orange-400",
    "text-orange-600 dark:text-orange-500",
    "text-red-600 dark:text-red-400",
    "text-red-600 dark:text-red-500",
  ];

  // 1-2: Много леко, 3-4: Леко, 5: Умерено, 6-7: Тежко, 8-9: Много тежко, 10: Максимум
  const rpeLabels = [
    "",
    "Много леко",
    "Много леко",
    "Леко",
    "Леко",
    "Умерено",
    "Тежко",
    "Тежко",
    "Много тежко",
    "Много тежко",
    "Максимум",
  ];

  return (
    <div className="mx-auto w-full max-w-2xl duration-500 animate-in slide-in-from-bottom-8">
      <Card className="relative overflow-hidden border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl sm:p-8 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white">
        <div className="flex flex-col items-center justify-center space-y-6">
          <CheckCircle2 size={72} className="text-green-500" />
          <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">
            Тренировъчен Отчет
          </h2>
          <p className="max-w-md text-center text-sm text-zinc-500 sm:text-lg dark:text-zinc-400">
            Оценете натоварването на групата (RPE) и добавете бележки за
            сесията.
          </p>

          {/* Session Summary */}
          {settings && (
            <div className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
                Резюме на сесията
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-3 shadow-2xs sm:gap-3 dark:bg-zinc-800/60">
                  <Zap
                    size={18}
                    className="shrink-0 text-amber-500 dark:text-yellow-400"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="min-w-0 truncate text-[9px] font-bold text-zinc-500 uppercase sm:text-[10px]">
                      Режим
                    </p>
                    <p className="truncate text-xs font-bold text-zinc-900 sm:text-sm dark:text-white">
                      {getModeLabel(settings.mode)}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-3 shadow-2xs sm:gap-3 dark:bg-zinc-800/60">
                  <Clock
                    size={18}
                    className="shrink-0 text-blue-500 dark:text-blue-400"
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className="min-w-0 truncate text-[9px] font-bold text-zinc-500 uppercase sm:text-[10px]"
                      title="Продължителност"
                    >
                      Продължителност
                    </p>
                    <p className="truncate text-xs font-bold text-zinc-900 sm:text-sm dark:text-white">
                      {formatDuration(actualElapsedMs)}
                    </p>
                  </div>
                </div>
                <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-3 shadow-2xs sm:gap-3 dark:bg-zinc-800/60">
                  <Layers
                    size={18}
                    className="shrink-0 text-purple-500 dark:text-purple-400"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="min-w-0 truncate text-[9px] font-bold text-zinc-500 uppercase sm:text-[10px]">
                      Серии
                    </p>
                    <p className="truncate text-xs font-bold text-zinc-900 sm:text-sm dark:text-white">
                      {completedSets} от {settings.sets}
                    </p>
                  </div>
                </div>
                {settings.mode === "agility_test" ? (
                  <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-3 shadow-2xs sm:gap-3 dark:bg-zinc-800/60">
                    <Target
                      size={18}
                      className="shrink-0 text-red-500 dark:text-red-400"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="min-w-0 truncate text-[9px] font-bold text-zinc-500 uppercase sm:text-[10px]">
                        Движения
                      </p>
                      <p className="truncate text-xs font-bold text-zinc-900 sm:text-sm dark:text-white">
                        {agilityActionsDone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-w-0 items-center gap-2.5 rounded-xl bg-white p-3 shadow-2xs sm:gap-3 dark:bg-zinc-800/60">
                    <Target
                      size={18}
                      className="shrink-0 text-green-600 dark:text-green-400"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="min-w-0 truncate text-[9px] font-bold text-zinc-500 uppercase sm:text-[10px]">
                        Категория
                      </p>
                      <p className="truncate text-xs font-bold text-zinc-900 sm:text-sm dark:text-white">
                        {settings.ageGroup}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 w-full space-y-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:space-y-8 sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <Label
                  htmlFor="shadow-rpe-range"
                  className="text-lg font-bold sm:text-xl"
                >
                  Оценка на умората (RPE)
                </Label>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-2xl font-black sm:text-3xl ${rpeColors[rpeScore] || "text-primary"}`}
                  >
                    {rpeScore}/10
                  </span>
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    {rpeLabels[rpeScore]}
                  </span>
                </div>
              </div>
              <input
                id="shadow-rpe-range"
                aria-label="Оценка на натоварването (RPE)"
                type="range"
                min="1"
                max="10"
                value={rpeScore}
                onChange={(e) => setRpeScore(parseInt(e.target.value))}
                className="h-4 w-full cursor-pointer appearance-none rounded-lg bg-zinc-200 accent-primary dark:bg-zinc-800"
              />
              <div className="flex justify-between text-xs font-medium text-zinc-500 sm:text-sm">
                <span>Леко (1)</span>
                <span>Умерено (5)</span>
                <span>Максимум (10)</span>
              </div>
            </div>

            {/* Individual RPE per athlete */}
            {settings && settings.activePlayers.length > 0 && (
              <div className="space-y-3 border-t border-zinc-200 pt-5 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    <Users size={16} className="text-blue-500" />
                    Индивидуално RPE по състезател
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    1–10 за всеки участник
                  </span>
                </div>
                <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                  {settings.activePlayers.map((player) => {
                    const pScore =
                      effectiveIndividualRpe[player.id] ?? rpeScore;
                    const pName =
                      player.displayName ||
                      `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
                      "Състезател";
                    return (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-800 sm:text-sm dark:text-zinc-200">
                          {pName}
                        </span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`Намали RPE за ${pName}`}
                            onClick={() => adjustPlayerRpe(player.id, -1)}
                            disabled={pScore <= 1}
                            className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Minus size={14} />
                          </button>
                          <span
                            className={`w-10 text-center text-xs font-black sm:text-sm ${rpeColors[pScore] || "text-primary"}`}
                          >
                            {pScore}/10
                          </span>
                          <button
                            type="button"
                            aria-label={`Увеличи RPE за ${pName}`}
                            onClick={() => adjustPlayerRpe(player.id, 1)}
                            disabled={pScore >= 10}
                            className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Agility Test Official Assessment Record */}
            {settings?.mode === "agility_test" &&
              settings.activePlayers.length > 0 && (
                <div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 dark:border-amber-500/20 dark:bg-amber-950/20">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-bold text-amber-900 dark:text-amber-200">
                      <Award size={18} className="text-amber-500" />
                      Официален норматив за бързина (Agility PB)
                    </span>
                    <span className="text-[11px] font-semibold text-amber-700/80 dark:text-amber-400/80">
                      {agilityActionsDone || settings.workSec || 20} движения •{" "}
                      {(actualElapsedMs / 1000).toFixed(1)}s
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Запишете постигнатия резултат като официален контролен тест
                    в профила на състезателя (модул „Тестове &amp; Нормативи“).
                  </p>
                  <div className="space-y-2 pt-1">
                    {settings.activePlayers.map((player) => {
                      const isRecorded = recordedAssessments[player.id];
                      const isBusy = recordingMemberId === player.id;
                      const pName =
                        player.displayName ||
                        `${player.firstName || ""} ${player.lastName || ""}`.trim() ||
                        "Състезател";

                      return (
                        <div
                          key={`assess-${player.id}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-white/80 p-2.5 backdrop-blur-xs dark:border-amber-500/20 dark:bg-zinc-950/60"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">
                            {pName}
                          </span>
                          {isRecorded ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-600 dark:text-green-400">
                              <CheckCircle2 size={13} /> Записан тест
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isBusy}
                              onClick={() =>
                                handleRecordOfficialAssessment(player)
                              }
                              className="h-8 rounded-lg border-amber-500/40 bg-amber-500/10 px-2.5 text-xs font-bold text-amber-900 hover:bg-amber-500/20 dark:text-amber-200"
                            >
                              <Award className="mr-1 size-3.5" />
                              {isBusy ? "Записване..." : "Запиши в досието"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            <div className="space-y-3">
              <Label
                htmlFor="shadow-rpe-notes"
                className="text-lg font-bold sm:text-xl"
              >
                Бързи бележки
              </Label>
              <Textarea
                id="shadow-rpe-notes"
                placeholder="Напр. Проблеми със сплит степа при задна линия..."
                className="min-h-30 border-zinc-200 bg-white p-4 text-base text-zinc-900 sm:text-lg dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
                value={rpeNotes}
                onChange={(e) => setRpeNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex w-full flex-col-reverse flex-wrap gap-3 sm:flex-row">
            {onDiscard && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={onDiscard}
                className="h-auto min-h-11 w-full rounded-xl border-zinc-300 bg-zinc-100 px-4 py-3 text-center text-xs font-bold whitespace-normal text-zinc-700 hover:border-zinc-400 hover:bg-zinc-200 hover:text-zinc-900 sm:w-auto sm:flex-1 sm:text-sm dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-white"
              >
                <XCircle className="mr-2 size-4 shrink-0 text-zinc-500 sm:size-5 dark:text-zinc-400" />
                <span>НЕ ЗАПИСВАЙ / ПРОПУСНИ</span>
              </Button>
            )}
            <Button
              type="button"
              size="lg"
              onClick={() => onSave(rpeScore, rpeNotes, effectiveIndividualRpe)}
              className={`h-auto min-h-11 w-full rounded-xl bg-green-600 px-5 py-3 text-center text-xs font-black whitespace-normal text-white hover:bg-green-700 sm:w-auto sm:text-sm ${onDiscard ? "sm:flex-[1.5]" : "sm:flex-1"}`}
            >
              <Save className="mr-2 size-4 shrink-0 sm:size-5" />
              <span>ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
