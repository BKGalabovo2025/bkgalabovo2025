"use client";

import {
  Activity,
  ArrowLeft,
  Check,
  Copy,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Radio,
  RotateCcw,
  Sparkles,
  Square,
  Target,
  Timer,
  Tv,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
import {
  ShadowPlayer,
  ShadowSettings,
  useShadowTrainer,
} from "@/hooks/useShadowTrainer";
import { ZONE_NAMES } from "@/lib/shadow-training/audio-map";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";

import { CourtVisualizer } from "../CourtVisualizer";
import { MultiCourtGrid } from "./MultiCourtGrid";

interface ShadowActiveScreenProps {
  trainer: ReturnType<typeof useShadowTrainer>;
  settings: ShadowSettings;
  onBackToSetup?: () => void;
}

function getStateLabel(state: string) {
  if (state === "countdown") return "Приготви се...";
  if (state === "working") return "РАБОТА";
  if (state === "resting") return "ПОЧИВКА";
  if (state === "paused") return "ПАУЗА";
  return "ГОТОВНОСТ";
}

function getModeLabel(mode: string) {
  if (mode === "agility_test")
    return {
      label: "Тест за бързина (Agility)",
      icon: Target,
      color: "text-red-400",
    };
  return {
    label: "Стандартен тренировъчен",
    icon: Timer,
    color: "text-blue-400",
  };
}

function getSubLabel(
  mode: string,
  state: string,
  _agilityActionsDone: number,
  _workSec: number,
  currentSet: number,
  sets: number
) {
  if (mode === "agility_test") {
    if (state === "countdown") return "Подготовка за спринт...";
    return "";
  }
  return `Серия ${currentSet} от ${sets}`;
}

export function ShadowActiveScreen({
  trainer,
  settings,
  onBackToSetup,
}: ShadowActiveScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trainerRef = useRef(trainer);
  useEffect(() => {
    trainerRef.current = trainer;
  }, [trainer]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHallMode, setIsHallMode] = useState(false);
  const isUltraContrast = isFullscreen || isHallMode;
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [hallViewMode, setHallViewMode] = useState<"hall" | "focus">(
    trainer.courtSlots && trainer.courtSlots.length > 1 ? "hall" : "focus"
  );
  const [focusedCourt, setFocusedCourt] = useState<number | null>(null);
  const [isPresenterHelpOpen, setIsPresenterHelpOpen] = useState(false);

  const toggleWorkoutMusic = () => {
    if (isMusicPlaying) {
      trainer.stopWorkoutBeat?.();
      setIsMusicPlaying(false);
      toast.info("Фоновата музика е спряна.");
    } else {
      trainer.startWorkoutBeat?.("electronic_128");
      setIsMusicPlaying(true);
      toast.success(
        "Фонова музика (128 BPM) е пусната с активен Audio Ducking!"
      );
    }
  };

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

  // Keyboard hotkeys for coaches during live training (supporting standard Bluetooth clickers / presenters)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName))
        return;

      const currentTrainer = trainerRef.current;

      // 1. Next / Advance (Bluetooth Clicker Next, PageDown, ArrowRight, ArrowDown, Space)
      if (
        e.code === "PageDown" ||
        e.code === "ArrowRight" ||
        e.code === "ArrowDown" ||
        e.code === "Space"
      ) {
        e.preventDefault();
        shadowLogger.trainer(
          `Coach remote clicker: [${e.code}] Next/Advance action`
        );
        if (currentTrainer.state === "countdown") {
          currentTrainer.skipCountdown();
          toast.info("10s отброяване беше прескочено!");
        } else if (currentTrainer.state === "resting") {
          currentTrainer.skipRest?.();
          toast.info("Почивката беше прескочена — старт на следващата серия!");
        } else if (currentTrainer.state === "working") {
          currentTrainer.pauseTraining();
          toast.info("Тренировката е поставена на пауза.");
        } else if (currentTrainer.state === "paused") {
          currentTrainer.resumeTraining();
          toast.info("Тренировката е възобновена!");
        } else if (currentTrainer.state === "idle") {
          currentTrainer.startTraining();
          toast.info("Тренировката е стартирана!");
        }
      }
      // 2. Previous / Pause (Bluetooth Clicker Prev, PageUp, ArrowLeft, ArrowUp)
      else if (
        e.code === "PageUp" ||
        e.code === "ArrowLeft" ||
        e.code === "ArrowUp"
      ) {
        e.preventDefault();
        shadowLogger.trainer(
          `Coach remote clicker: [${e.code}] Prev/Pause action`
        );
        if (
          currentTrainer.state === "working" ||
          currentTrainer.state === "resting" ||
          currentTrainer.state === "countdown"
        ) {
          currentTrainer.pauseTraining();
          toast.info("Тренировката е поставена на пауза.");
        }
      }
      // 3. Blackout / Blank screen (Bluetooth Presenter "B" or "." / Period key)
      else if (
        e.key === "b" ||
        e.key === "B" ||
        e.key === "." ||
        e.code === "Period"
      ) {
        e.preventDefault();
        shadowLogger.trainer("Coach remote clicker: Blackout / Hall toggle");
        setIsHallMode((prev) => {
          const next = !prev;
          toast.info(
            next
              ? "Активиран Режим Зала / Проектор (Ultra-Contrast)"
              : "Деактивиран Режим Зала"
          );
          return next;
        });
      }
      // 4. Play / Presentation mode (F5)
      else if (e.key === "F5") {
        e.preventDefault();
        shadowLogger.trainer(
          "Coach remote clicker: [F5] Presentation mode toggled"
        );
        toggleFullscreen();
      }
      // 5. Escape (Exit fullscreen or pause training)
      else if (e.code === "Escape") {
        if (typeof document !== "undefined" && document.fullscreenElement) {
          // Let browser exit fullscreen without stopping training
          return;
        }
        e.preventDefault();
        shadowLogger.trainer("Coach hotkey: [Esc] pressed");
        currentTrainer.pauseTraining();
        toast.warning("Тренировката е паузирана.");
      }
      // 6. Keyboard shortcuts 'F' and 'H'
      else if (
        e.key === "f" ||
        e.key === "F" ||
        e.key === "ф" ||
        e.key === "Ф"
      ) {
        e.preventDefault();
        shadowLogger.trainer("Coach hotkey: [F] fullscreen toggled");
        toggleFullscreen();
      } else if (
        e.key === "h" ||
        e.key === "H" ||
        e.key === "х" ||
        e.key === "Х"
      ) {
        e.preventDefault();
        setIsHallMode((prev) => {
          const next = !prev;
          toast.info(
            next
              ? "Активиран Режим Зала / Проектор (Ultra-Contrast)"
              : "Деактивиран Режим Зала"
          );
          return next;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeIds = trainer.currentRotationPlayers.map(
    (p: ShadowPlayer) => p.id
  );
  const restingPlayers = settings.activePlayers.filter(
    (p) => !activeIds.includes(p.id)
  );

  const activeZoneLabel = trainer.activeZone
    ? ZONE_NAMES[trainer.activeZone] || trainer.activeZone
    : null;

  const canGoBackToSetup =
    trainer.state === "idle" ||
    trainer.state === "paused" ||
    trainer.state === "finished";

  return (
    <div
      ref={containerRef}
      className={`flex w-full flex-col duration-300 animate-in fade-in zoom-in-95 ${
        isFullscreen
          ? "fixed inset-0 z-50 overflow-y-auto bg-black p-4 sm:p-8"
          : isHallMode
            ? "space-y-4 md:space-y-6 bg-black p-2 sm:p-4 rounded-3xl"
            : "space-y-4 md:space-y-6"
      }`}
    >
      <Card
        className={`relative flex w-full flex-col overflow-hidden rounded-3xl border-none text-white shadow-2xl transition-colors ${
          isUltraContrast ? "bg-black" : "bg-zinc-950"
        }`}
      >
        {/* ─── ГОЛЯМ ЕКРАН ХЕДЪР & РОТАЦИЯ НА ИГРАЧИТЕ ─── */}
        <div
          className={`flex shrink-0 flex-col items-center justify-between gap-4 border-b p-4 sm:px-6 md:flex-row transition-colors ${
            isUltraContrast
              ? "border-zinc-800/80 bg-black"
              : "border-zinc-800 bg-zinc-900/90"
          }`}
        >
          {/* Active players on court */}
          <div className="flex flex-wrap items-center gap-3">
            {canGoBackToSetup && onBackToSetup && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBackToSetup}
                className="h-9 cursor-pointer rounded-xl border-zinc-700 bg-zinc-800/90 px-3 text-xs font-bold text-zinc-200 hover:border-zinc-600 hover:bg-zinc-700 hover:text-white"
              >
                <ArrowLeft size={14} className="mr-1.5" /> Назад към настройки
              </Button>
            )}
            <span className="flex items-center gap-2 text-xs font-black tracking-wider text-zinc-400 uppercase">
              <Activity size={16} className="text-emerald-400" />{" "}
              {trainer.totalWaves > 1
                ? `На Корта (Част ${trainer.currentWave}/${trainer.totalWaves}):`
                : "На Корта:"}
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
                  <RotateCcw size={14} />{" "}
                  {trainer.totalWaves > 1
                    ? `Чакащи за Част ${
                        trainer.currentWave < trainer.totalWaves
                          ? trainer.currentWave + 1
                          : 1
                      }:`
                    : "Следват:"}
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

            {/* Copy Diagnostics Log (dev only) */}
            {process.env.NODE_ENV !== "production" && (
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
            )}

            {/* Workout Background Music & Audio Ducking */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleWorkoutMusic}
              className={`h-9 cursor-pointer rounded-xl text-xs font-bold transition-all ${
                isMusicPlaying
                  ? "border-purple-500/50 bg-purple-500/20 text-purple-300 shadow-sm"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              }`}
              title="Фонова ритмична музика (128 BPM) с автоматично приглушаване (Audio Ducking) при гласови команди"
            >
              <Music
                size={14}
                className={`mr-1.5 ${
                  isMusicPlaying ? "animate-bounce text-purple-400" : ""
                }`}
              />
              {isMusicPlaying ? "Музика: 128 BPM (Ducking)" : "Фонова музика"}
            </Button>

            {/* Ultra-High Contrast Hall Display Mode Toggle */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsHallMode((prev) => {
                  const next = !prev;
                  toast.info(
                    next
                      ? "Активиран Режим Зала / Проектор (Ultra-Contrast)"
                      : "Деактивиран Режим Зала"
                  );
                  return next;
                });
              }}
              className={`h-9 cursor-pointer rounded-xl text-xs font-bold transition-all ${
                isHallMode
                  ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-xs"
                  : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              }`}
              title="Превключи Режим Зала / Проектор с максимален контраст (H)"
            >
              <Tv size={14} className="mr-1.5" />
              {isHallMode ? "Зала Активна" : "Режим Зала (TV)"}
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

            {/* Bluetooth Clicker / Remote Guide */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPresenterHelpOpen(true)}
              className="h-9 cursor-pointer rounded-xl border-zinc-800 bg-zinc-900 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              title="Управление с безжично дистанционно / Bluetooth Презентер"
            >
              <Radio size={14} className="mr-1.5 text-blue-400" />
              <span className="hidden sm:inline">Кликер</span>
            </Button>
          </div>
        </div>

        {/* ─── ОСНОВЕН ДАШБОРД ─── */}
        <CardContent className="flex flex-1 flex-col items-center justify-between gap-6 p-6 md:flex-row md:gap-12 md:p-10">
          {/* LEFT: Интерактивен Бадминтон Корт / Зала */}
          <div
            className={`flex w-full flex-col items-center justify-center transition-all ${
              hallViewMode === "hall" && (trainer.courtSlots?.length ?? 0) > 1
                ? "max-w-full lg:max-w-3xl xl:max-w-4xl flex-2"
                : "max-w-85 md:max-w-115 flex-1"
            }`}
          >
            {trainer.courtSlots && trainer.courtSlots.length > 1 && (
              <div className="mb-4 flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/90 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setHallViewMode("hall");
                    setFocusedCourt(null);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    hallViewMode === "hall"
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  🏸 Цяла зала ({trainer.courtSlots.length} корта)
                </button>
                <button
                  type="button"
                  onClick={() => setHallViewMode("focus")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    hallViewMode === "focus"
                      ? "bg-zinc-800 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  🎯 Фокус корт
                </button>
              </div>
            )}

            {hallViewMode === "hall" &&
            (trainer.courtSlots?.length ?? 0) > 1 ? (
              <MultiCourtGrid
                slots={trainer.courtSlots}
                activeZone={trainer.activeZone}
                visualPhase={trainer.visualPhase}
                focusedCourtNumber={focusedCourt}
                highContrast={isUltraContrast}
                onToggleFocus={(cNum) => {
                  if (cNum !== null) {
                    setFocusedCourt(cNum);
                    setHallViewMode("focus");
                  } else {
                    setFocusedCourt(null);
                  }
                }}
                className="w-full"
              />
            ) : (
              <div className="flex w-full flex-col items-center gap-2">
                {trainer.courtSlots && trainer.courtSlots.length > 1 && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className="text-xs font-bold text-zinc-400">
                      Корт:
                    </span>
                    <div className="flex gap-1">
                      {trainer.courtSlots.map((s) => (
                        <button
                          key={s.courtNumber}
                          type="button"
                          onClick={() => setFocusedCourt(s.courtNumber)}
                          className={`size-7 rounded-lg text-xs font-black transition-all ${
                            (focusedCourt ?? 1) === s.courtNumber
                              ? "bg-amber-500 text-black font-black"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          }`}
                        >
                          {s.courtNumber}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {(() => {
                  const activeSlot =
                    trainer.courtSlots?.find(
                      (s) => s.courtNumber === (focusedCourt ?? 1)
                    ) || trainer.courtSlots?.[0];

                  return (
                    <CourtVisualizer
                      activeZone={trainer.activeZone}
                      visualPhase={trainer.visualPhase}
                      courtNumber={activeSlot?.courtNumber ?? 1}
                      playerBottom={activeSlot?.halfA}
                      playerTop={activeSlot?.halfB}
                      viewMode={activeSlot?.isFullCourt ? "full" : "half"}
                      dualActive={activeSlot?.isFullCourt}
                      leftHanded={settings.leftHanded}
                      highContrast={isUltraContrast}
                      allowToggleView
                      className="w-full origin-center scale-100 transition-transform duration-300 md:scale-105"
                    />
                  );
                })()}
              </div>
            )}
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
                    {settings.preset === "custom"
                      ? "Персонализиран"
                      : settings.preset}
                  </Badge>
                )}

                <Badge
                  variant="outline"
                  className="border-zinc-800 text-[11px] font-bold text-zinc-300"
                >
                  Серия {trainer.currentSet} от {settings.sets}
                </Badge>
                {trainer.totalWaves > 1 && (
                  <Badge
                    variant="outline"
                    className="border-blue-500/40 bg-blue-500/10 text-[11px] font-bold text-blue-300"
                  >
                    Част {trainer.currentWave} от {trainer.totalWaves}
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

              {/* Main Number Display (Ultra-High Contrast Hall Display visible from 25m) */}
              {settings.mode === "agility_test" &&
              trainer.state === "working" ? (
                <div className="space-y-2">
                  <div
                    className={`leading-none font-black tracking-tighter tabular-nums transition-all ${
                      isUltraContrast
                        ? "text-[10rem] text-red-500 drop-shadow-[0_0_40px_rgba(239,68,68,0.85)] sm:text-[13rem] md:text-[16rem] lg:text-[20rem]"
                        : "bg-linear-to-b from-red-400 via-rose-500 to-red-600 bg-clip-text text-8xl text-transparent sm:text-9xl md:text-[10rem]"
                    }`}
                  >
                    {trainer.agilityActionsDone}
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-zinc-400 md:justify-start">
                    <span className="text-base font-semibold md:text-lg">
                      движения от общо {settings.workSec}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center gap-1.5 text-base font-bold text-amber-400 md:text-lg">
                      <Timer size={18} className="animate-pulse" />
                      {trainer.timeRemaining}s хронометър
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  className={`leading-none font-black tracking-tighter tabular-nums transition-all ${
                    isUltraContrast
                      ? trainer.state === "working"
                        ? "text-[10rem] text-red-500 drop-shadow-[0_0_45px_rgba(239,68,68,0.9)] sm:text-[13rem] md:text-[16rem] lg:text-[20rem]"
                        : trainer.state === "resting"
                          ? "text-[10rem] text-blue-400 drop-shadow-[0_0_45px_rgba(59,130,246,0.9)] sm:text-[13rem] md:text-[16rem] lg:text-[20rem]"
                          : "text-[10rem] text-amber-300 drop-shadow-[0_0_35px_rgba(250,204,21,0.8)] sm:text-[13rem] md:text-[16rem] lg:text-[20rem]"
                      : "bg-linear-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-8xl text-transparent sm:text-9xl md:text-[10rem]"
                  }`}
                >
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
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid w-full max-w-md grid-cols-2 gap-3 md:gap-4">
              {trainer.state === "idle" || trainer.state === "finished" ? (
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
                      className="h-16 min-w-0 cursor-pointer rounded-2xl bg-emerald-600 px-3 text-xs font-black text-white hover:bg-emerald-700 sm:h-20 sm:px-6 sm:text-base md:h-24 md:text-xl"
                      onClick={trainer.resumeTraining}
                    >
                      <Play className="mr-1.5 size-4 shrink-0 fill-current sm:mr-2 sm:size-6 md:size-7" />
                      <span className="truncate">ПРОДЪЛЖИ</span>
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="h-16 min-w-0 cursor-pointer rounded-2xl bg-amber-500 px-3 text-xs font-black text-amber-950 hover:bg-amber-600 sm:h-20 sm:px-6 sm:text-base md:h-24 md:text-xl"
                      onClick={trainer.pauseTraining}
                    >
                      <Pause className="mr-1.5 size-4 shrink-0 fill-current sm:mr-2 sm:size-6 md:size-7" />
                      <span className="truncate">ПАУЗА</span>
                    </Button>
                  )}
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-16 min-w-0 cursor-pointer rounded-2xl px-3 text-xs font-black sm:h-20 sm:px-6 sm:text-base md:h-24 md:text-xl"
                    onClick={() => trainer.stopTraining()}
                  >
                    <Square className="mr-1.5 size-4 shrink-0 fill-current sm:mr-2 sm:size-6 md:size-7" />
                    <span className="truncate">СТОП</span>
                  </Button>
                </>
              )}
            </div>

            {/* Keyboard & Remote Clicker Shortcuts Hint Bar */}
            <div className="hidden flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-semibold text-zinc-500 sm:flex md:justify-start">
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                  Space / ⏩
                </kbd>{" "}
                Пауза / Продължи / Пропусни
              </span>
              <span>•</span>
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                  H / B
                </kbd>{" "}
                Режим Зала (TV)
              </span>
              <span>•</span>
              <span>
                <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                  F / F5
                </kbd>{" "}
                Цял екран
              </span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setIsPresenterHelpOpen(true)}
                className="inline-flex items-center gap-1 text-blue-400 hover:underline"
              >
                <Radio size={12} />
                Дистанционно / Кликер (Помощ)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── ДИАЛОГ: БЕЗЖИЧНО ДИСТАНЦИОННО / BLUETOOTH ПРЕЗЕНТЕР ─── */}
      <Dialog open={isPresenterHelpOpen} onOpenChange={setIsPresenterHelpOpen}>
        <DialogContent className="max-w-md border-zinc-800 bg-zinc-950 p-6 text-white shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Radio size={18} />
              </span>
              <div>
                <DialogTitle className="text-base font-black text-white">
                  Безжично управление с презентер
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Управлявайте тренировката от корта с всеки Bluetooth кликер
                  (Logitech, Baseus и др.)
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 font-black text-emerald-400 text-xs border border-emerald-500/30">
                ⏩
              </span>
              <div>
                <p className="font-bold text-zinc-200">
                  Бутон „Напред“ (PageDown / ➡️ / Space)
                </p>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Старт на сесията • Прескачане на 10s отброяване • Прескачане
                  на почивката • Възобновяване / Пауза.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 font-black text-amber-400 text-xs border border-amber-500/30">
                ⏪
              </span>
              <div>
                <p className="font-bold text-zinc-200">
                  Бутон „Назад“ (PageUp / ⬅️)
                </p>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Моментална пауза на тренировката за даване на наставления на
                  децата.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 font-black text-purple-400 text-xs border border-purple-500/30">
                ⬛
              </span>
              <div>
                <p className="font-bold text-zinc-200">
                  Бутон „Blackout / Черен екран“ (Клавиш B / .)
                </p>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Превключва Режим „Зала / Проектор“ с максимален контраст за
                  виждане от 25 метра.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 font-black text-blue-400 text-xs border border-blue-500/30">
                🖥️
              </span>
              <div>
                <p className="font-bold text-zinc-200">
                  Бутон „Презентация“ (F5 или F)
                </p>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Разгъва или свива прозореца на цял екран за проектора в
                  залата.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 text-right">
            <Button
              type="button"
              size="sm"
              onClick={() => setIsPresenterHelpOpen(false)}
              className="h-8 rounded-lg bg-zinc-800 px-3 text-xs font-bold text-white hover:bg-zinc-700"
            >
              Разбрах
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
