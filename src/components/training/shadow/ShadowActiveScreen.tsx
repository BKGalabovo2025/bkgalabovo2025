"use client";

import { CourtVisualizer } from "../CourtVisualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Square, Pause, Activity, RotateCcw } from "lucide-react";
import { ShadowSettings } from "@/hooks/useShadowTrainer";

// Note: In real app, import the exact ReturnType of useShadowTrainer, or cast as any for simplicity if types match exactly
interface ShadowActiveScreenProps {
  trainer: any; // ReturnType<typeof useShadowTrainer>
  settings: ShadowSettings;
}

export function ShadowActiveScreen({ trainer, settings }: ShadowActiveScreenProps) {
  const activeIds = trainer.currentRotationPlayers.map((p: any) => p.id);
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
              {trainer.currentRotationPlayers.map((p: any, i: number) => (
                <span key={i} className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full font-bold">
                  {p.displayName}
                </span>
              ))}
            </div>
          </div>

          {restingPlayers.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-zinc-500 font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                <RotateCcw size={16} /> Почиват/Следват:
              </span>
              <div className="flex flex-wrap gap-2">
                {restingPlayers.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-zinc-800 text-zinc-400 rounded-full font-medium text-sm">
                    {p.displayName}
                  </span>
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
              <div className="inline-flex items-center px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse mr-3" />
                <span className="text-zinc-300 font-bold tracking-widest uppercase text-sm md:text-base">
                  {trainer.state === "countdown" ? "Приготви се..." :
                   trainer.state === "working" ? "РАБОТА" :
                   trainer.state === "resting" ? "ПОЧИВКА" :
                   trainer.state === "paused" ? "ПАУЗА" : "ГОТОВНОСТ"}
                </span>
              </div>

              <div className="text-[6rem] sm:text-8xl md:text-[9rem] lg:text-[10rem] leading-none font-black tabular-nums tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
                {trainer.timeRemaining}
              </div>

              <p className="text-zinc-400 text-xl md:text-2xl font-medium mt-2 md:mt-4">
                {settings.mode === "agility_test"
                  ? trainer.state === "working"
                    ? `Движение ${trainer.agilityActionsDone} от ${settings.workSec}`
                    : trainer.state === "countdown" ? "Подготовка..." : ""
                  : `Серия ${trainer.currentSet} от ${settings.sets}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-md">
              {trainer.state === "idle" ? (
                <Button size="lg" className="col-span-2 h-20 md:h-24 text-2xl md:text-3xl font-black bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shadow-[0_0_40px_rgba(var(--primary),0.3)]" onClick={trainer.startTraining}>
                  <Play className="mr-3 md:mr-4 w-8 h-8 md:w-10 md:h-10" /> СТАРТ
                </Button>
              ) : (
                <>
                  {trainer.state === "paused" ? (
                    <Button size="lg" className="h-20 md:h-24 text-xl md:text-2xl font-black bg-green-600 hover:bg-green-700 rounded-2xl" onClick={trainer.resumeTraining}>
                      <Play className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" /> ПРОДЪЛЖИ
                    </Button>
                  ) : (
                    <Button size="lg" className="h-20 md:h-24 text-xl md:text-2xl font-black bg-yellow-500 hover:bg-yellow-600 text-yellow-950 rounded-2xl" onClick={trainer.pauseTraining}>
                      <Pause className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" /> ПАУЗА
                    </Button>
                  )}
                  <Button size="lg" variant="destructive" className="h-20 md:h-24 text-xl md:text-2xl font-black rounded-2xl" onClick={() => {
                    if (confirm("Сигурни ли сте, че искате да спрете тренировката предсрочно?")) trainer.stopTraining();
                  }}>
                    <Square className="mr-2 md:mr-3 w-6 h-6 md:w-8 md:h-8" /> СТОП
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
