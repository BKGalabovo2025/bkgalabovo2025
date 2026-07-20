"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Save, Clock, Target, Layers, Zap } from "lucide-react";
import { ShadowSettings } from "@/hooks/useShadowTrainer";

interface ShadowReportFormProps {
  rpeScore: number;
  setRpeScore: (score: number) => void;
  rpeNotes: string;
  setRpeNotes: (notes: string) => void;
  onSave: () => void;
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
  if (mode === "ghost_match") return "Мач на сенки";
  if (mode === "agility_test") return "Тест за бързина";
  return "Стандартен";
}

export function ShadowReportForm({
  rpeScore,
  setRpeScore,
  rpeNotes,
  setRpeNotes,
  onSave,
  settings,
  actualElapsedMs = 0,
  completedSets = 0,
  agilityActionsDone = 0,
}: ShadowReportFormProps) {
  const rpeColors = [
    "",
    "text-green-400",
    "text-green-400",
    "text-green-500",
    "text-lime-400",
    "text-yellow-400",
    "text-yellow-500",
    "text-orange-400",
    "text-orange-500",
    "text-red-400",
    "text-red-500",
  ];

  const rpeLabels = [
    "",
    "Много леко",
    "Леко",
    "Умерено",
    "Малко тежко",
    "Тежко",
    "Много тежко",
    "Изключително тежко",
    "Почти максимум",
    "Максимум",
    "Абсолютен максимум",
  ];

  return (
    <div className="mx-auto w-full max-w-2xl duration-500 animate-in slide-in-from-bottom-8">
      <Card className="relative overflow-hidden border-none bg-zinc-950 p-8 text-white shadow-2xl">
        <div className="flex flex-col items-center justify-center space-y-6">
          <CheckCircle2 size={72} className="text-green-500" />
          <h2 className="text-center text-3xl font-black tracking-tight">
            Тренировъчен Отчет
          </h2>
          <p className="max-w-md text-center text-lg text-zinc-400">
            Оценете натоварването на групата (RPE) и добавете бележки за
            сесията.
          </p>

          {/* Session Summary */}
          {settings && (
            <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-400 uppercase">
                Резюме на сесията
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                  <Zap size={18} className="shrink-0 text-yellow-400" />
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Режим
                    </p>
                    <p className="text-sm font-bold text-white">
                      {getModeLabel(settings.mode)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                  <Clock size={18} className="shrink-0 text-blue-400" />
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Продължителност
                    </p>
                    <p className="text-sm font-bold text-white">
                      {formatDuration(actualElapsedMs)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                  <Layers size={18} className="shrink-0 text-purple-400" />
                  <div>
                    <p className="text-xs font-bold text-zinc-500 uppercase">
                      Серии
                    </p>
                    <p className="text-sm font-bold text-white">
                      {completedSets} от {settings.sets}
                    </p>
                  </div>
                </div>
                {settings.mode === "agility_test" ? (
                  <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                    <Target size={18} className="shrink-0 text-red-400" />
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Движения
                      </p>
                      <p className="text-sm font-bold text-white">
                        {agilityActionsDone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-zinc-800/60 p-3">
                    <Target size={18} className="shrink-0 text-green-400" />
                    <div>
                      <p className="text-xs font-bold text-zinc-500 uppercase">
                        Категория
                      </p>
                      <p className="text-sm font-bold text-white">
                        {settings.ageGroup}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 w-full space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xl font-bold">
                  Оценка на умората (RPE)
                </Label>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-3xl font-black ${rpeColors[rpeScore] || "text-primary"}`}
                  >
                    {rpeScore}/10
                  </span>
                  <span className="text-xs font-medium text-zinc-500">
                    {rpeLabels[rpeScore]}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={rpeScore}
                onChange={(e) => setRpeScore(parseInt(e.target.value))}
                className="h-4 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-primary"
              />
              <div className="flex justify-between text-sm font-medium text-zinc-500">
                <span>Леко (1)</span>
                <span>Умерено (5)</span>
                <span>Максимум (10)</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xl font-bold">Бързи бележки</Label>
              <Textarea
                placeholder="Напр. Проблеми със сплит степа при задна линия..."
                className="min-h-30 border-zinc-800 bg-zinc-950 p-4 text-lg"
                value={rpeNotes}
                onChange={(e) => setRpeNotes(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="lg"
            onClick={onSave}
            className="mt-8 h-16 w-full rounded-xl bg-green-600 text-xl font-black text-white hover:bg-green-700"
          >
            <Save className="mr-3 size-6" /> ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ
          </Button>
        </div>
      </Card>
    </div>
  );
}
