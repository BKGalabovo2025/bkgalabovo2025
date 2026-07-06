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
    <div className="w-full max-w-2xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
      <Card className="border-none shadow-2xl bg-zinc-950 overflow-hidden text-white relative p-8">
        <div className="flex flex-col items-center justify-center space-y-6">
          <CheckCircle2 size={72} className="text-green-500" />
          <h2 className="text-3xl font-black tracking-tight text-center">
            Тренировъчен Отчет
          </h2>
          <p className="text-zinc-400 text-center max-w-md text-lg">
            Оценете натоварването на групата (RPE) и добавете бележки за
            сесията.
          </p>

          {/* Session Summary */}
          {settings && (
            <div className="w-full bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
              <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-wider mb-4">
                Резюме на сесията
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 bg-zinc-800/60 p-3 rounded-xl">
                  <Zap size={18} className="text-yellow-400 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase">
                      Режим
                    </p>
                    <p className="font-bold text-white text-sm">
                      {getModeLabel(settings.mode)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-800/60 p-3 rounded-xl">
                  <Clock size={18} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase">
                      Продължителност
                    </p>
                    <p className="font-bold text-white text-sm">
                      {formatDuration(actualElapsedMs)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-zinc-800/60 p-3 rounded-xl">
                  <Layers size={18} className="text-purple-400 shrink-0" />
                  <div>
                    <p className="text-xs text-zinc-500 font-bold uppercase">
                      Серии
                    </p>
                    <p className="font-bold text-white text-sm">
                      {completedSets} от {settings.sets}
                    </p>
                  </div>
                </div>
                {settings.mode === "agility_test" ? (
                  <div className="flex items-center gap-3 bg-zinc-800/60 p-3 rounded-xl">
                    <Target size={18} className="text-red-400 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase">
                        Движения
                      </p>
                      <p className="font-bold text-white text-sm">
                        {agilityActionsDone}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-zinc-800/60 p-3 rounded-xl">
                    <Target size={18} className="text-green-400 shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase">
                        Категория
                      </p>
                      <p className="font-bold text-white text-sm">
                        {settings.ageGroup}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="w-full bg-zinc-900 rounded-2xl p-8 border border-zinc-800 space-y-8 mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-xl font-bold">
                  Оценка на умората (RPE)
                </Label>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-3xl font-black ${rpeColors[rpeScore] || "text-primary"}`}
                  >
                    {rpeScore}/10
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
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
                className="w-full h-4 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-sm text-zinc-500 font-medium">
                <span>Леко (1)</span>
                <span>Умерено (5)</span>
                <span>Максимум (10)</span>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-xl font-bold">Бързи бележки</Label>
              <Textarea
                placeholder="Напр. Проблеми със сплит степа при задна линия..."
                className="bg-zinc-950 border-zinc-800 text-lg p-4 min-h-[120px]"
                value={rpeNotes}
                onChange={(e) => setRpeNotes(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="lg"
            onClick={onSave}
            className="w-full h-16 text-xl bg-green-600 hover:bg-green-700 text-white font-black mt-8 rounded-xl"
          >
            <Save className="mr-3 h-6 w-6" /> ЗАПИШИ В КЛУБНАТА БАЗА ДАННИ
          </Button>
        </div>
      </Card>
    </div>
  );
}
