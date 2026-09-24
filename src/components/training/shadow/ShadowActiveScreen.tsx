/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-nested-conditional */
"use client";

import {
  Activity,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  Timer,
  Zap,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ShadowPlayer,
  ShadowSettings,
  useShadowTrainer,
} from "@/hooks/useShadowTrainer";
import { ZONE_NAMES } from "@/lib/shadow-training/audio-map";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";

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
    return {
      label: "Мач на сенки (Ghost Match)",
      icon: Zap,
      color: "text-amber-400",
    };
  if (mode === "agility_test")
    return {
      label: "Тест за бързина (Agility)",
      icon: Target,
      color: "text-red-400",
    };
  return { label: "Стандартен ритъм", icon: Timer, color: "text-blue-400" };
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
    if (state === "countdown") return "Подготовка за спринт...";
    return "";
  }
  return `Серия ${currentSet} от ${sets}`;
}

export function ShadowActiveScreen({
  trainer,
  settings,
}: ShadowActiveScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const [hasCopiedLog, setHasCopiedLog] = useState(false);

  const handleCopyDiagnosticsLog = async () => {
    try {
      const logs = shadowLogger.getHistory();
      const logsJson = JSON.stringify(logs, null, 2);
      await navigator.clipboard.writeText(logsJson);
      setHasCopiedLog(true);
      toast.success(
        "Конзолният лог е копиран в клипборда! Можете да го поставите директно в чата."
      );
      setTimeout(() => setHasCopiedLog(false), 2500);
    } catch {
      toast.info("Отворете конзолата на браузъра (F12) за пълния лог.");
    }
  };

  // Keyboard hotkeys for coaches during live training
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;

      if (e.code === "Space") {
        e.preventDefault();
        shadowLogger.trainer("Coach hotkey: [Space] pressed");
        if (trainer.state === "working") {
          trainer.pauseTraining();
        } else if (trainer.state === "paused") {
          trainer.resumeTraining();
        } else if (trainer.state === "idle") {
          trainer.startTraining();
        }
      } else if (e.code === "Escape") {
        e.preventDefault();
        shadowLogger.trainer("Coach hotkey: [Esc] pressed");
        trainer.stopTraining();
      } else if (
        e.key === "f" ||
        e.key === "F" ||
        e.key === "ф" ||
        e.key === "Ф"
      ) {
        e.preventDefault();
        shadowLogger.trainer("Coach hotkey: [F] fullscreen toggled");
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trainer]);

  const activeIds = trainer.currentRotationPlayers.map(
    (p: ShadowPlayer) => p.id
  );
  const restingPlayers = settings.activePlayers.filter(
    (p) => !activeIds.includes(p.id)
  );

  const activeZoneLabel = trainer.activeZone
    ? ZONE_NAMES[trainer.activeZone] || trainer.activeZone
    : null;

  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col duration-300 animate-in fade-in zoom-in-95 ${
        isFullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-black p-4 sm:p-8"
          : "space-y-4 md:space-y-6"
      }`}
    >
      <Card className="relative flex w-full flex-col overflow-hidden rounded-3xl border-none bg-zinc-950 text-white shadow-2xl">
        {/* ─── ГОЛЯМ ЕКРАН ХЕДЪР & РОТАЦИЯ НА ИГРАЧИТЕ ─── */}
        <div className="flex shrink-0 flex-col items-center justify-between gap-4 border-b border-zinc-850 bg-zinc-900/90 px-6 py-4 md:flex-row">
          {/* Active players on court */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 text-xs font-black tracking-wider text-zinc-400 uppercase">
              <Activity size={16} className="text-emerald-400" /> На Корта:
            </span>
            <div className="flex flex-wrap gap-2">
              {trainer.currentRotationPlayers.length === 0 ? (
                <span className="text-xs text-zinc-500">Всички играчи</span>
              ) : (
                trainer.currentRotationPlayers.map(
                  (p: ShadowPlayer, i: number) => (
                    <span
                      key={p.id || i}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-3.5 py-1 text-sm font-black text-emerald-400 shadow-sm"
                    >
                      <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                      {p.displayName || `Играч ${i + 1}`}
                    </span>
                  )
                )
              )}
            </div>
          </div>

          {/* Resting / Next players & Fullscreen action */}
          <div className="flex flex-wrap items-center gap-3">
            {restingPlayers.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-black tracking-wider text-zinc-500 uppercase">
                  <RotateCcw size={14} /> Следват:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {restingPlayers.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-800/80 px-2.5 py-1 text-xs font-semibold text-zinc-300"
                    >
                      {p.displayName}
                    </span>
                  ))}
                  {restingPlayers.length > 3 && (
                    <span className="rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                      +{restingPlayers.length - 3} още
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Copy Diagnostics Log */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyDiagnosticsLog}
              className="h-9 cursor-pointer rounded-xl border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              title="Копирай конзолния лог за диагностика"
            >
              {hasCopiedLog ? (
                <>
                  <Check size={14} className="mr-1.5 text-emerald-400" />{" "}
                  Копиран!
                </>
              ) : (
                <>
                  <Copy size={14} className="mr-1.5 text-blue-400" /> Копирай
                  лог
                </>
              )}
            </Button>

            {/* Fullscreen Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-9 cursor-pointer rounded-xl border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              title="Цял екран (F)"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 size={14} className="mr-1.5" /> Изход
                </>
              ) : (
                <>
                  <Maximize2 size={14} className="mr-1.5" /> Цял екран (TV)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ─── ОСНОВЕН ДАШБОРД ─── */}
        <CardContent className="flex flex-1 flex-col items-center justify-between gap-6 p-6 md:flex-row md:gap-12 md:p-10">
          {/* LEFT: Интерактивен Бадминтон Корт */}
          <div className="flex w-full max-w-75 flex-1 items-center justify-center md:max-w-105">
            <CourtVisualizer
              activeZone={trainer.activeZone}
              visualPhase={trainer.visualPhase}
              className="w-full origin-center scale-100 transition-transform duration-300 md:scale-105"
            />
          </div>

          {/* RIGHT: Таймер, Команди и Контроли */}
          <div className="flex w-full flex-1 flex-col items-center space-y-6 text-center md:items-start md:space-y-8 md:text-left">
            <div className="w-full space-y-3 md:space-y-4">
              {/* Mode Badge & Set Progress */}
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {(() => {
                  const modeInfo = getModeLabel(settings.mode);
                  const ModeIcon = modeInfo.icon;
                  return (
                    <div
                      className={`inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3.5 py-1 ${modeInfo.color} text-xs font-black`}
                    >
                      <ModeIcon size={14} />
                      {modeInfo.label}
                    </div>
                  );
                })()}

                {settings.preset && (
                  <Badge
                    variant="outline"
                    className="border-zinc-800 text-[11px] font-semibold text-zinc-400"
                  >
                    {settings.preset}
                  </Badge>
                )}
              </div>

              {/* State Label with pulse */}
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <span
                  className={`size-3 rounded-full ${
                    trainer.state === "working"
                      ? "bg-red-500 animate-ping"
                      : trainer.state === "resting"
                        ? "bg-blue-400"
                        : "bg-yellow-400"
                  }`}
                />
                <span
                  className={`text-2xl font-black tracking-widest sm:text-3xl md:text-4xl ${
                    trainer.state === "working"
                      ? "text-red-500"
                      : trainer.state === "resting"
                        ? "text-blue-400"
                        : "text-amber-400"
                  }`}
                >
                  {getStateLabel(trainer.state)}
                </span>
                {trainer.state === "countdown" && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={trainer.skipCountdown}
                    className="ml-2 h-8 rounded-xl border-amber-400/40 bg-amber-400/20 text-xs font-bold text-amber-300 hover:bg-amber-400/30"
                  >
                    <Play className="mr-1 size-3 fill-current" /> Старт веднага
                  </Button>
                )}
              </div>

              {/* LIVE ACTION ANNOUNCEMENT HUD */}
              {trainer.state === "working" && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-4 shadow-inner">
                  {trainer.visualPhase === "split_step" ? (
                    <div className="flex items-center justify-center gap-2 text-yellow-400 md:justify-start">
                      <Sparkles className="size-5 animate-spin" />
                      <span className="text-xl font-black tracking-wider uppercase md:text-2xl">
                        СПЛИТ-СТЕП (ПОДСКОК)
                      </span>
                    </div>
                  ) : trainer.visualPhase === "center" ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-400 md:justify-start">
                      <RotateCcw className="size-5" />
                      <span className="text-xl font-black tracking-wider uppercase md:text-2xl">
                        ВРЪЩАНЕ В ЦЕНТЪРА
                      </span>
                    </div>
                  ) : activeZoneLabel ? (
                    <div className="flex items-center justify-center gap-2.5 text-red-400 md:justify-start">
                      <Target className="size-6 animate-pulse text-red-500" />
                      <span className="text-2xl font-black tracking-tight text-white uppercase sm:text-3xl md:text-4xl">
                        {activeZoneLabel}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm font-semibold text-zinc-400">
                      Очаква се следващ удар...
                    </div>
                  )}
                </div>
              )}

              {/* Main Number Display (Big Hall Display) */}
              {settings.mode === "agility_test" &&
              trainer.state === "working" ? (
                <div className="space-y-1">
                  <div className="bg-linear-to-b from-red-400 via-rose-500 to-red-600 bg-clip-text text-8xl leading-none font-black tracking-tighter text-transparent tabular-nums sm:text-9xl md:text-[10rem]">
                    {trainer.agilityActionsDone}
                  </div>
                  <p className="text-base font-semibold text-zinc-400 md:text-lg">
                    движения от общо {settings.workSec}
                  </p>
                </div>
              ) : (
                <div className="bg-linear-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-8xl leading-none font-black tracking-tighter text-transparent tabular-nums sm:text-9xl md:text-[10rem]">
                  {trainer.timeRemaining}
                </div>
              )}

              {/* Sub-label info */}
              <p className="text-lg font-bold text-zinc-400 md:text-xl">
                {getSubLabel(
                  settings.mode,
                  trainer.state,
                  trainer.agilityActionsDone,
                  settings.workSec,
                  trainer.currentSet,
                  settings.sets
                )}
              </p>

              {/* Ghost Match next delay indicator */}
              {settings.mode === "ghost_match" &&
                trainer.state === "working" &&
                trainer.nextActionDelay !== undefined &&
                trainer.nextActionDelay !== null && (
                  <div className="mt-2 flex items-center justify-center gap-2 text-base font-bold text-amber-400 md:justify-start md:text-lg">
                    <Timer size={18} className="animate-spin" />
                    <span>
                      Следващо отиграване след:{" "}
                      {trainer.nextActionDelay.toFixed(1)} сек
                    </span>
                  </div>
                )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid w-full max-w-md grid-cols-2 gap-3 md:gap-4">
              {trainer.state === "idle" ? (
                <Button
                  size="lg"
                  className="col-span-2 h-20 cursor-pointer rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-2xl font-black text-white shadow-xl shadow-blue-500/25 transition-transform hover:scale-1.02 md:h-24 md:text-3xl"
                  onClick={trainer.startTraining}
                >
                  <Play className="mr-3 size-8 fill-current md:size-10" /> СТАРТ
                </Button>
              ) : (
                <>
                  {trainer.state === "paused" ? (
                    <Button
                      size="lg"
                      className="h-20 cursor-pointer rounded-2xl bg-emerald-600 text-xl font-black text-white hover:bg-emerald-700 md:h-24 md:text-2xl"
                      onClick={trainer.resumeTraining}
                    >
                      <Play className="mr-2 size-6 fill-current md:size-8" />{" "}
                      ПРОДЪЛЖИ
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="h-20 cursor-pointer rounded-2xl bg-amber-500 text-xl font-black text-amber-950 hover:bg-amber-600 md:h-24 md:text-2xl"
                      onClick={trainer.pauseTraining}
                    >
                      <Pause className="mr-2 size-6 fill-current md:size-8" />{" "}
                      ПАУЗА
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-20 cursor-pointer rounded-2xl text-xl font-black md:h-24 md:text-2xl"
                    onClick={() => trainer.stopTraining()}
                  >
                    <Square className="mr-2 size-6 fill-current md:size-8" />{" "}
                    СТОП
                  </Button>
                </>
              )}
            </div>

            {/* Keyboard Shortcuts Hint Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-semibold text-zinc-500 md:justify-start">
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                  Space
                </kbd>{" "}
                Пауза / Продължи
              </span>
              <span>•</span>
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                  F
                </kbd>{" "}
                Цял екран
              </span>
              <span>•</span>
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                  Esc
                </kbd>{" "}
                Край
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
