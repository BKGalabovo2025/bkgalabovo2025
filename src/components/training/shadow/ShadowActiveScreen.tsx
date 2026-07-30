"use client";

import {
  Activity,
  Pause,
  Play,
  RotateCcw,
  Square,
  Target,
  Timer,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShadowPlayer,
  ShadowSettings,
  useShadowTrainer,
} from "@/hooks/useShadowTrainer";

import { CourtVisualizer } from "../CourtVisualizer";

interface ShadowActiveScreenProps {
  trainer: ReturnType<typeof useShadowTrainer>;
  settings: ShadowSettings;
}

function getStateLabel(state: string) {
  if (state === "countdown") return "Приготви се...";
  if (state === "working") return "РАБОТА";
  if (state === "resting") return "ПОЧИВКА";
  if (state === "paused") return "ПАУЗА";
  return "ГОТОВНОСТ";
}

function getModeLabel(mode: string) {
  if (mode === "ghost_match")
    return { label: "Мач на сенки", icon: Zap, color: "text-yellow-400" };
  if (mode === "agility_test")
    return { label: "Тест за бързина", icon: Target, color: "text-red-400" };
  return { label: "Стандартен", icon: Timer, color: "text-blue-400" };
}

function getSubLabel(
  mode: string,
  state: string,
  agilityActionsDone: number,
  workSec: number,
  currentSet: number,
  sets: number
) {
  if (mode === "agility_test") {
    if (state === "working")
      return `Движение ${agilityActionsDone} от ${workSec}`;
    if (state === "countdown") return "Подготовка...";
    return "";
  }
  return `Серия ${currentSet} от ${sets}`;
}

export function ShadowActiveScreen({
  trainer,
  settings,
}: ShadowActiveScreenProps) {
  const activeIds = trainer.currentRotationPlayers.map(
    (p: ShadowPlayer) => p.id
  );
  const restingPlayers = settings.activePlayers.filter(
    (p) => !activeIds.includes(p.id)
  );

  return (
    <div className="flex w-full flex-col space-y-4 duration-300 animate-in fade-in zoom-in-95 md:space-y-6">
      <Card className="relative flex w-full flex-col border-none bg-zinc-950 text-white shadow-2xl">
        {/* Top Rotation Bar */}
        <div className="flex shrink-0 flex-col items-center justify-between gap-4 border-b border-zinc-800 bg-zinc-900 p-4 md:flex-row">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-400 uppercase">
              <Activity size={16} className="text-green-500" /> На Корта:
            </span>
            <div className="flex flex-wrap gap-2">
              {trainer.currentRotationPlayers.map(
                (p: ShadowPlayer, i: number) => (
                  <span
                    key={i}
                    className="rounded-full border border-green-500/30 bg-green-500/20 px-3 py-1 font-bold text-green-400"
                  >
                    {p.displayName}
                  </span>
                )
              )}
            </div>
          </div>

          {restingPlayers.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm font-bold tracking-wider text-zinc-500 uppercase">
                <RotateCcw size={16} /> Почиват/Следват:
              </span>
              <div className="flex flex-wrap gap-2">
                {restingPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 rounded-xl border border-zinc-700/50 bg-zinc-800/80 p-2 md:gap-3 md:p-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold md:size-10 md:text-base">
                      {p.displayName
                        ? p.displayName.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <span className="max-w-25 truncate text-sm font-semibold md:max-w-[150px] md:text-base">
                      {p.displayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard Area */}
        <CardContent className="flex flex-1 flex-col items-center justify-between gap-6 p-4 md:flex-row md:gap-10 md:p-8">
          <div className="flex w-full max-w-70 flex-1 items-center justify-center md:max-w-100">
            <CourtVisualizer
              activeZone={trainer.activeZone}
              visualPhase={trainer.visualPhase}
              className="w-full origin-center scale-100 md:scale-110"
            />
          </div>

          <div className="flex w-full flex-1 flex-col items-center space-y-6 text-center md:items-start md:space-y-10 md:text-left">
            <div className="space-y-2 md:space-y-4">
              {/* Mode badge */}
              {(() => {
                const modeInfo = getModeLabel(settings.mode);
                const ModeIcon = modeInfo.icon;
                return (
                  <div
                    className={`inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 ${modeInfo.color} mb-2 text-sm font-bold`}
                  >
                    <ModeIcon size={14} />
                    {modeInfo.label}
                  </div>
                );
              })()}

              <div className="flex items-center gap-3">
                <Activity className="size-8 animate-pulse text-primary" />
                <span className="text-3xl font-black tracking-wider text-primary md:text-4xl">
                  {getStateLabel(trainer.state)}
                </span>
              </div>

              {/* Main number display */}
              {settings.mode === "agility_test" &&
              trainer.state === "working" ? (
                <div className="space-y-1">
                  <div className="bg-gradient-to-b from-red-400 to-red-700 bg-clip-text text-8xl leading-none font-black tracking-tighter text-transparent tabular-nums sm:text-8xl md:text-[9rem] lg:text-[10rem]">
                    {trainer.agilityActionsDone}
                  </div>
                  <p className="text-lg font-medium text-zinc-400">
                    движения от {settings.workSec}
                  </p>
                  {/* Progress bar */}
                  {(() => {
                    const pct = Math.min(
                      100,
                      Math.round(
                        (trainer.agilityActionsDone / settings.workSec) * 100
                      )
                    );
                    // Use Tailwind arbitrary width values won't work dynamically, so we use 10-step buckets
                    const w = Math.floor(pct / 10) * 10;
                    const widthMap: Record<number, string> = {
                      0: "w-0",
                      10: "w-[10%]",
                      20: "w-[20%]",
                      30: "w-[30%]",
                      40: "w-[40%]",
                      50: "w-[50%]",
                      60: "w-[60%]",
                      70: "w-[70%]",
                      80: "w-[80%]",
                      90: "w-[90%]",
                      100: "w-full",
                    };
                    return (
                      <div className="mt-2 h-3 w-full max-w-xs rounded-full bg-zinc-800">
                        <div
                          className={`h-3 rounded-full bg-red-500 transition-all duration-300 ${widthMap[w] ?? "w-0"}`}
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-8xl leading-none font-black tracking-tighter text-transparent tabular-nums sm:text-8xl md:text-[9rem] lg:text-[10rem]">
                  {trainer.timeRemaining}
                </div>
              )}

              <p className="mt-2 text-xl font-medium text-zinc-400 md:mt-4 md:text-2xl">
                {getSubLabel(
                  settings.mode,
                  trainer.state,
                  trainer.agilityActionsDone,
                  settings.workSec,
                  trainer.currentSet,
                  settings.sets
                )}
              </p>

              {settings.mode === "ghost_match" &&
                trainer.state === "working" &&
                trainer.nextActionDelay !== undefined &&
                trainer.nextActionDelay !== null && (
                  <div className="mt-2 flex animate-pulse items-center gap-2 text-lg font-bold text-yellow-400 md:text-xl">
                    <Timer size={20} /> Следваща след{" "}
                    {trainer.nextActionDelay.toFixed(1)}с
                  </div>
                )}
            </div>

            <div className="grid w-full max-w-md grid-cols-2 gap-3 md:gap-4">
              {trainer.state === "idle" ? (
                <Button
                  size="lg"
                  className="col-span-2 h-20 rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-[0_0_40px_rgba(var(--primary),0.3)] hover:bg-primary/90 md:h-24 md:text-3xl"
                  onClick={trainer.startTraining}
                >
                  <Play className="mr-3 size-8 md:mr-4 md:size-10" /> СТАРТ
                </Button>
              ) : (
                <>
                  {trainer.state === "paused" ? (
                    <Button
                      size="lg"
                      className="h-20 rounded-2xl bg-green-600 text-xl font-black hover:bg-green-700 md:h-24 md:text-2xl"
                      onClick={trainer.resumeTraining}
                    >
                      <Play className="mr-2 size-6 md:mr-3 md:size-8" />{" "}
                      ПРОДЪЛЖИ
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="h-20 rounded-2xl bg-yellow-500 text-xl font-black text-yellow-950 hover:bg-yellow-600 md:h-24 md:text-2xl"
                      onClick={trainer.pauseTraining}
                    >
                      <Pause className="mr-2 size-6 md:mr-3 md:size-8" /> ПАУЗА
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-20 rounded-2xl text-xl font-black md:h-24 md:text-2xl"
                    onClick={() => trainer.stopTraining()}
                  >
                    <Square className="mr-2 size-6 md:mr-3 md:size-8" /> СТОП
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
