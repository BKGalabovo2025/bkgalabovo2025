"use client";

import { CourtVisualizer } from "../CourtVisualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Square,
  Pause,
  Activity,
  RotateCcw,
  Zap,
  Timer,
  Target,
} from "lucide-react";
import {
  ShadowSettings,
  ShadowPlayer,
  useShadowTrainer,
} from "@/hooks/useShadowTrainer";

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
    <div className="space-y-4 md:space-y-6 animate-in fade-in zoom-in-95 duration-300 w-full flex flex-col">
      <Card className="border-none shadow-2xl bg-zinc-950 w-full flex flex-col text-white relative">
        {/* Top Rotation Bar */}
        <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
              <Activity size={16} className="text-green-500" /> На Корта:
            </span>
            <div className="flex flex-wrap gap-2">
              {trainer.currentRotationPlayers.map(
                (p: ShadowPlayer, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-bold"
                  >
                    {p.displayName}
                  </span>
                )
              )}
            </div>
          </div>

          {restingPlayers.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <RotateCcw size={16} /> Почиват/Следват:
              </span>
              <div className="flex flex-wrap gap-2">
                {restingPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 md:gap-3 bg-zinc-800/80 p-2 md:p-3 rounded-xl border border-zinc-700/50"
                  >
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm md:text-base">
                      {p.displayName
                        ? p.displayName.charAt(0).toUpperCase()
                        : "?"}
                    </div>
                    <span className="font-semibold text-sm md:text-base truncate max-w-[100px] md:max-w-[150px]">
                      {p.displayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Dashboard Area */}
        <CardContent className="p-4 md:p-8 flex-1 flex flex-col md:flex-row gap-6 md:gap-10 items-center justify-between">
          <div className="flex-1 w-full max-w-[280px] md:max-w-[400px] flex items-center justify-center">
            <CourtVisualizer
              activeZone={trainer.activeZone}
              visualPhase={trainer.visualPhase}
              className="w-full scale-100 md:scale-110 origin-center"
            />
          </div>

          <div className="flex-1 w-full space-y-6 md:space-y-10 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="space-y-2 md:space-y-4">
              {/* Mode badge */}
              {(() => {
                const modeInfo = getModeLabel(settings.mode);
                const ModeIcon = modeInfo.icon;
                return (
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 ${modeInfo.color} text-sm font-bold mb-2`}
                  >
                    <ModeIcon size={14} />
                    {modeInfo.label}
                  </div>
                );
              })()}

              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-primary animate-pulse" />
                <span className="text-3xl md:text-4xl font-black tracking-wider text-primary">
                  {getStateLabel(trainer.state)}
                </span>
              </div>

              {/* Main number display */}
              {settings.mode === "agility_test" &&
              trainer.state === "working" ? (
                <div className="space-y-1">
                  <div className="text-[6rem] sm:text-8xl md:text-[9rem] lg:text-[10rem] leading-none font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-red-400 to-red-700">
                    {trainer.agilityActionsDone}
                  </div>
                  <p className="text-zinc-400 text-lg font-medium">
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
                      <div className="w-full max-w-xs bg-zinc-800 rounded-full h-3 mt-2">
                        <div
                          className={`bg-red-500 h-3 rounded-full transition-all duration-300 ${widthMap[w] ?? "w-0"}`}
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-[6rem] sm:text-8xl md:text-[9rem] lg:text-[10rem] leading-none font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                  {trainer.timeRemaining}
                </div>
              )}

              <p className="text-zinc-400 text-xl md:text-2xl font-medium mt-2 md:mt-4">
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
                  <div className="text-yellow-400 text-lg md:text-xl font-bold animate-pulse mt-2 flex items-center gap-2">
                    <Timer size={20} /> Следваща след{" "}
                    {trainer.nextActionDelay.toFixed(1)}с
                  </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-md">
              {trainer.state === "idle" ? (
                <Button
                  size="lg"
                  className="col-span-2 h-20 md:h-24 text-2xl md:text-3xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_0_40px_rgba(var(--primary),0.3)]"
                  onClick={trainer.startTraining}
                >
                  <Play className="mr-3 md:mr-4 w-8 h-8 md:w-10 md:h-10" />{" "}
                  СТАРТ
                </Button>
              ) : (
                <>
                  {trainer.state === "paused" ? (
                    <Button
                      size="lg"
                      className="h-20 md:h-24 text-xl md:text-2xl font-black bg-green-600 hover:bg-green-700 rounded-2xl"
                      onClick={trainer.resumeTraining}
                    >
                      <Play className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" />{" "}
                      ПРОДЪЛЖИ
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="h-20 md:h-24 text-xl md:text-2xl font-black bg-yellow-500 hover:bg-yellow-600 text-yellow-950 rounded-2xl"
                      onClick={trainer.pauseTraining}
                    >
                      <Pause className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" />{" "}
                      ПАУЗА
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-20 md:h-24 text-xl md:text-2xl font-black rounded-2xl"
                    onClick={() => trainer.stopTraining()}
                  >
                    <Square className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" />{" "}
                    СТОП
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
