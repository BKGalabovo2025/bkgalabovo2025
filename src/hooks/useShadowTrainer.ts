/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars, sonarjs/cognitive-complexity, sonarjs/no-redundant-assignments, sonarjs/no-dead-store */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AUDIO_PATHS,
  getRandomShotForZone,
  getRandomZoneForMode,
  isAudioPlaying,
  isAudioSequencePlaying,
  setPlaybackPace,
  ZONE_NAMES,
  ZoneId,
} from "@/lib/shadow-training/audio-map";
import {
  calculateCourtAssignments,
  splitPlayersIntoWaves,
} from "@/lib/shadow-training/court-logistics";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";

import {
  CourtSlot,
  ShadowPlayer,
  ShadowSettings,
  TrainerState,
  VisualPhase,
  WakeLockSentinel,
} from "./shadow-trainer/types";
import { useShadowAudio } from "./shadow-trainer/useShadowAudio";
import { useShadowTimer } from "./shadow-trainer/useShadowTimer";

export type {
  CourtSlot,
  ShadowPlayer,
  ShadowSettings,
  TrainerState,
  VisualPhase,
};

// ─── Pure helper functions ─────────

// ─── Drill pattern zone pickers ─────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

type CornersMode = "2-corners" | "4-corners" | "6-corners";

function getZonePools(cornersMode: CornersMode) {
  return {
    back: (cornersMode !== "6-corners"
      ? ["backForehand", "backBackhand"]
      : ["backForehand", "backBackhand", "overhead"]) as ZoneId[],
    net: ["frontForehand", "frontBackhand"] as ZoneId[],
    mid: ["midForehand", "midBackhand"] as ZoneId[],
  };
}

export function applyNetBack(
  lastZone: ZoneId,
  cornersMode: CornersMode
): ZoneId {
  const { back, net } = getZonePools(cornersMode);
  return lastZone.startsWith("front") ? pick(back) : pick(net);
}

export function applyTriangle(
  lastZone: ZoneId | null,
  cornersMode: CornersMode
): ZoneId {
  const { back, net, mid } = getZonePools(cornersMode);
  if (!lastZone || lastZone.startsWith("front")) return pick(back);
  if (lastZone.startsWith("back") || lastZone === "overhead") {
    return Math.random() < 0.5 && cornersMode === "6-corners"
      ? pick(mid)
      : pick(net);
  }
  return pick(net);
}

export function applyMixed(
  lastZone: ZoneId,
  cornersMode: CornersMode,
  fallback: ZoneId
): ZoneId {
  if (Math.random() < 0.33) return fallback;
  const { back, net } = getZonePools(cornersMode);
  if (lastZone.startsWith("front")) return pick(back);
  if (lastZone.startsWith("back") || lastZone === "overhead") return pick(net);
  return fallback;
}

export function applyForehandOnly(
  lastZone: ZoneId | null,
  cornersMode: CornersMode
): ZoneId {
  const { back, net, mid } = getZonePools(cornersMode);
  const forehandZones: ZoneId[] = [
    ...net.filter((z) => z.toLowerCase().includes("forehand")),
    ...(cornersMode === "6-corners"
      ? mid.filter((z) => z.toLowerCase().includes("forehand"))
      : []),
    ...back.filter((z) => z.toLowerCase().includes("forehand")),
  ];

  if (forehandZones.length === 0) return "frontForehand";
  if (forehandZones.length === 1) return forehandZones[0];

  const candidates = lastZone
    ? forehandZones.filter((z) => z !== lastZone)
    : forehandZones;
  return pick(candidates.length > 0 ? candidates : forehandZones);
}

export function applyBackhandOnly(
  lastZone: ZoneId | null,
  cornersMode: CornersMode
): ZoneId {
  const { back, net, mid } = getZonePools(cornersMode);
  const backhandZones: ZoneId[] = [
    ...net.filter((z) => z.toLowerCase().includes("backhand")),
    ...(cornersMode === "6-corners"
      ? mid.filter((z) => z.toLowerCase().includes("backhand"))
      : []),
    ...back.filter(
      (z) => z.toLowerCase().includes("backhand") || z === "overhead"
    ),
  ];

  if (backhandZones.length === 0) return "frontBackhand";
  if (backhandZones.length === 1) return backhandZones[0];

  const candidates = lastZone
    ? backhandZones.filter((z) => z !== lastZone)
    : backhandZones;
  return pick(candidates.length > 0 ? candidates : backhandZones);
}

export function applyDrillPattern(
  drillPattern: string,
  lastZone: ZoneId | null,
  cornersMode: CornersMode,
  randomZone: ZoneId
): ZoneId {
  if (drillPattern === "forehand-only")
    return applyForehandOnly(lastZone, cornersMode);
  if (drillPattern === "backhand-only")
    return applyBackhandOnly(lastZone, cornersMode);
  if (drillPattern === "fixed-net-back" && lastZone)
    return applyNetBack(lastZone, cornersMode);
  if (drillPattern === "fixed-triangle")
    return applyTriangle(lastZone, cornersMode);
  if (drillPattern === "mixed" && lastZone)
    return applyMixed(lastZone, cornersMode, randomZone);
  return randomZone;
}

export function resolveAudioPathsAndZone(
  drillMode: string,
  calloutMode: string,
  cornersMode: "2-corners" | "4-corners" | "6-corners" = "6-corners",
  drillPattern: string = "random",
  lastZone: ZoneId | null = null,
  _pace: number = 3.0
) {
  const randomZone: ZoneId = getRandomZoneForMode(
    drillMode as
      | "all"
      | "front_only"
      | "back_only"
      | "forehand_only"
      | "backhand_only"
      | "front_back",
    cornersMode
  );

  const zone = applyDrillPattern(
    drillPattern,
    lastZone,
    cornersMode,
    randomZone
  );

  let audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.frontForehand;
  let secondAudioPath: string | null = null;

  if (calloutMode === "shots") {
    // Само удари: само аудиото на удара, без зона
    audioPath = getRandomShotForZone(zone) || AUDIO_PATHS.shots.defense;
    secondAudioPath = null;
  } else if (calloutMode === "zones_and_shots") {
    // В режим "Зони + Удари" ВСИЧКО се изговаря на глас за децата: първо Зоната, после Удара!
    audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.frontForehand;
    secondAudioPath = getRandomShotForZone(zone) || AUDIO_PATHS.shots.defense;
  } else {
    // Само зони
    audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.frontForehand;
    secondAudioPath = null;
  }

  return { zone, audioPath, secondAudioPath };
}

function calculateGhostMatchPace(
  consecutiveFastShotsRef: React.MutableRefObject<number>,
  basePace: number
): number {
  if (consecutiveFastShotsRef.current >= 3) {
    if (Math.random() > 0.2) {
      // Slow shot (clear/lift): 1.0x to 1.3x basePace
      consecutiveFastShotsRef.current = 0;
      return basePace * (Math.random() * 0.3 + 1.0);
    } else {
      // Fast shot (drive/smash/push): 0.6x to 0.8x basePace
      consecutiveFastShotsRef.current++;
      return basePace * (Math.random() * 0.2 + 0.6);
    }
  }

  // Random shot when no consecutive fast shots streak
  const rand = Math.random();
  if (rand < 0.4) {
    // Fast shot: 0.6x to 0.8x basePace
    consecutiveFastShotsRef.current++;
    return basePace * (Math.random() * 0.2 + 0.6);
  } else if (rand < 0.8) {
    // Normal shot: 0.8x to 1.0x basePace
    consecutiveFastShotsRef.current = 0;
    return basePace * (Math.random() * 0.2 + 0.8);
  } else {
    // Slow shot: 1.0x to 1.3x basePace
    consecutiveFastShotsRef.current = 0;
    return basePace * (Math.random() * 0.3 + 1.0);
  }
}

function getCapacity(currentSettings: ShadowSettings): number {
  const courts = Math.max(1, Math.min(6, currentSettings.courtsAvailable || 1));
  const strategy = currentSettings.courtAllocationStrategy || "two_per_court";
  return strategy === "two_per_court" ? courts * 2 : courts;
}

function getMinTimeRequiredForAction(settings: ShadowSettings): number {
  if (settings.mode === "agility_test") {
    return 0;
  }

  const hasShots = settings.calloutMode === "zones_and_shots";
  const hasCenter = settings.centerCommandEnabled && !settings.visualOnly;

  // Real Bulgarian voice durations + biomechanical movement delays:
  // - Zone cue: ~2.0s - 2.5s (e.g. "Бекхенд задна линия")
  // - Shot cue: ~1.8s - 2.8s (e.g. "Смач с отскок по диагонал")
  // - Shot execution delay at corner: 0.3s
  // - Center cue: ~1.2s ("Център") + ~1.2s ("Леко подскачане") = ~2.4s
  if (hasShots && hasCenter) {
    return 6.5; // Needs at least 6.5s to finish zone + shot + corner + center + hop
  }
  if (hasShots && !hasCenter) {
    return 4.5; // Needs at least 4.5s for zone + shot + corner
  }
  if (!hasShots && hasCenter) {
    return 4.5; // Needs at least 4.5s for zone + corner + center + hop
  }
  return 2.5; // Single zone or shot cue: ~2.5s
}

function rotatePlayers(
  currentSettings: ShadowSettings,
  currentPlayersRef: React.MutableRefObject<ShadowPlayer[]>,
  playCountsRef: React.MutableRefObject<Record<string, number>>
): ShadowPlayer[] {
  const groupSize = getCapacity(currentSettings);
  if (currentSettings.activePlayers.length <= groupSize)
    return currentPlayersRef.current;

  currentPlayersRef.current.forEach((p) => {
    if (playCountsRef.current[p.id] !== undefined) {
      playCountsRef.current[p.id]++;
    }
  });

  const sorted = [...currentSettings.activePlayers].sort((a, b) => {
    const cA = playCountsRef.current[a.id] || 0;
    const cB = playCountsRef.current[b.id] || 0;
    if (cA !== cB) return cA - cB;
    return (
      currentSettings.activePlayers.indexOf(a) -
      currentSettings.activePlayers.indexOf(b)
    );
  });

  return sorted.slice(0, groupSize);
}

// ─── The Orchestrator Hook ─────────

export function useShadowTrainer(settings: ShadowSettings | null) {
  const [state, setState] = useState<TrainerState>("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [visualPhase, setVisualPhase] = useState<VisualPhase>("idle");

  const [currentPlayersState, setCurrentPlayersState] = useState<
    ShadowPlayer[]
  >([]);
  const [currentWave, setCurrentWave] = useState(1);
  const [agilityActionsDone, setAgilityActionsDone] = useState(0);
  const [nextActionDelay, setNextActionDelay] = useState<number | null>(null);

  const playCountsRef = useRef<Record<string, number>>({});
  const consecutiveFastShotsRef = useRef(0);
  const currentPlayersRef = useRef<ShadowPlayer[]>([]);
  const currentWaveRef = useRef(1);

  const previousStateRef = useRef<TrainerState>("idle");

  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deceptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const centerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isFirstActionRef = useRef(false);
  const activeZoneRef = useRef<ZoneId | null>(null);
  const triggerNextActionRef = useRef<() => void>(() => {});
  const lastActionTimestampRef = useRef<number>(0);
  const expectedPaceRef = useRef<number>(3.0);
  const tempoWaitStartRef = useRef<number>(0);

  const settingsRef = useRef(settings);
  const stateRef = useRef(state);
  const currentSetRef = useRef(currentSet);
  const agilityActionsDoneRef = useRef(agilityActionsDone);

  useEffect(() => {
    currentWaveRef.current = currentWave;
  }, [currentWave]);

  const totalWaves = useMemo(() => {
    if (!settings) return 1;
    const capacity = getCapacity(settings);
    return splitPlayersIntoWaves(settings.activePlayers, capacity).length || 1;
  }, [settings]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    currentSetRef.current = currentSet;
  }, [currentSet]);
  useEffect(() => {
    agilityActionsDoneRef.current = agilityActionsDone;
  }, [agilityActionsDone]);

  const audio = useShadowAudio();

  useEffect(() => {
    if (settings) {
      const counts = playCountsRef.current;
      settings.activePlayers.forEach((p) => {
        if (counts[p.id] === undefined) counts[p.id] = 0;
      });
      playCountsRef.current = counts;

      const capacity = getCapacity(settings);
      const waves = splitPlayersIntoWaves(settings.activePlayers, capacity);
      const initialPlayers = waves[0] || [];
      currentPlayersRef.current = initialPlayers;
      setCurrentPlayersState(initialPlayers);
      setCurrentWave(1);
      currentWaveRef.current = 1;
      consecutiveFastShotsRef.current = 0;
    }
  }, [settings]);

  const requestWakeLock = async () => {
    if (
      typeof navigator !== "undefined" &&
      "wakeLock" in navigator &&
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      if (wakeLockRef.current) {
        return;
      }
      try {
        const lock = await (navigator as any).wakeLock.request("screen");
        wakeLockRef.current = lock;
        lock.onrelease = () => {
          wakeLockRef.current = null;
        };
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          err.name !== "NotAllowedError" &&
          err.name !== "AbortError"
        ) {
          console.warn("Wake Lock error:", err);
        }
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  const cleanupActions = useCallback(() => {
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    if (deceptionTimeoutRef.current) clearTimeout(deceptionTimeoutRef.current);
    if (centerTimeoutRef.current) clearTimeout(centerTimeoutRef.current);
    audio.stop();
    setActiveZone(null);
    activeZoneRef.current = null;
    lastActionTimestampRef.current = 0;
    tempoWaitStartRef.current = 0;
    setVisualPhase("idle");
    setNextActionDelay(null);
    releaseWakeLock();
    shadowLogger.court(
      "⚪ [КОРТ В ПОКОЙ] Всички светлинни маркери са изчистени.",
      {
        visualPhase: "idle",
        activeZone: null,
      }
    );
  }, [audio]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        ["working", "resting", "countdown"].includes(stateRef.current)
      ) {
        requestWakeLock();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const triggerNextAction = useCallback(() => {
    try {
      const currentSettings = settingsRef.current;
      if (!currentSettings) return;
      if (stateRef.current !== "working") return;

      const isFirst = isFirstActionRef.current;
      isFirstActionRef.current = false;

      // Agility Test Logic
      if (currentSettings.mode === "agility_test") {
        let nextCount = agilityActionsDoneRef.current;
        if (!isFirst) {
          nextCount = nextCount + 1;
          setAgilityActionsDone(nextCount);
          agilityActionsDoneRef.current = nextCount;
          shadowLogger.diagnostic(
            `🏃 [ТЕСТ ЗА ПЪРГАВИНА: ПРОГРЕС] Изпълнени: ${nextCount} / ${currentSettings.workSec} движения.`,
            { done: nextCount, target: currentSettings.workSec }
          );
        }
        if (nextCount >= currentSettings.workSec) {
          setState("finished");
          timerRef.current.syncState("finished");
          cleanupActions();
          if (!currentSettings.visualOnly)
            audio.play(AUDIO_PATHS.common.endSet);
          return;
        }
      }

      if (!isFirst && currentSettings.mode !== "agility_test") {
        const remaining = timerRef.current.getTimeRemaining?.() ?? 0;
        const minRequired = getMinTimeRequiredForAction(currentSettings);
        if (remaining <= 0 || remaining < minRequired) {
          shadowLogger.trainer(
            `⏳ [ФИНАЛ НА СЕРИЯТА] Оставащото време (${remaining}s) не е достатъчно за цялостен нов удар (нужни са поне ${minRequired.toFixed(1)}s). Състезателите завършват в центъра и изчакват таймера.`
          );
          return;
        }
      }

      const pace = currentSettings.paceSec;

      setNextActionDelay(pace);

      // Diagnostic 1: Audio Overlap Guard
      if (!isFirst && !currentSettings.visualOnly && isAudioPlaying()) {
        const isSequenceStillActive = isAudioSequencePlaying();
        if (isSequenceStillActive) {
          shadowLogger.diagnostic(
            `⚠️ [ВНИМАНИЕ: ОСНОВЕН УДАР НЕ Е ЗАВЪРШИЛ] Предишният удар още се изговаряше при старта на новия сигнал! Препоръка: Темпото (${pace}s) е твърде бързо за тази комбинация.`,
            { currentPace: pace, calloutMode: currentSettings.calloutMode }
          );
        } else {
          shadowLogger.diagnostic(
            `⚠️ [ВНИМАНИЕ: ЗВУКОВО ПРИПОКРИВАНЕ] Командата за център още затихваше при старта на новия сигнал. Препоръка: Темпото (${pace}s) е на границата за пълно връщане.`,
            { currentPace: pace, calloutMode: currentSettings.calloutMode }
          );
        }
      }

      // Diagnostic 2: Timer Drift & Execution Precision Monitor
      const now =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      if (tempoWaitStartRef.current > 0 && !isFirst) {
        const actualWaitSec = (now - tempoWaitStartRef.current) / 1000;
        const expectedPace = expectedPaceRef.current;
        const driftMs = Math.round((actualWaitSec - expectedPace) * 1000);
        if (Math.abs(driftMs) > 250) {
          shadowLogger.diagnostic(
            `⏱️ [ОТКЛОНЕНИЕ В ТАЙМЕРА: ${driftMs > 0 ? "+" : ""}${driftMs}ms] Засечен е дрифт в паузата между ударите (зададено: ${expectedPace}s, реално: ${actualWaitSec.toFixed(2)}s). Възможна причина: минимизиран таб или пестене на батерия.`,
            {
              driftMs,
              actualWaitSec: Number(actualWaitSec.toFixed(3)),
              expectedPace,
            }
          );
        }
      }
      tempoWaitStartRef.current = 0;
      lastActionTimestampRef.current = now;
      expectedPaceRef.current = pace;

      const { zone, audioPath, secondAudioPath } = resolveAudioPathsAndZone(
        currentSettings.drillMode,
        currentSettings.calloutMode,
        currentSettings.cornersMode,
        currentSettings.drillPattern,
        activeZoneRef.current,
        pace
      );

      activeZoneRef.current = zone;

      // Biomechanical Phase Timing
      const ageGroup = currentSettings.ageGroup;
      // Landing delay after split-step hop (150ms - 300ms realistic range)
      let splitStepDelay = Math.min(0.25, Math.max(0.15, pace * 0.08));
      let strokeDuration = pace * 0.5;

      if (ageGroup === "U9-U11") {
        splitStepDelay = Math.min(0.3, Math.max(0.2, pace * 0.08));
      } else if (ageGroup === "U11-U13") {
        splitStepDelay = Math.min(0.26, Math.max(0.17, pace * 0.075));
      } else if (ageGroup === "U13-U15") {
        splitStepDelay = Math.min(0.24, Math.max(0.15, pace * 0.07));
      } else if (ageGroup === "U15-U17") {
        splitStepDelay = Math.min(0.22, Math.max(0.13, pace * 0.065));
        strokeDuration = pace * 0.48;
      } else if (ageGroup === "U17+") {
        splitStepDelay = Math.min(0.2, Math.max(0.12, pace * 0.06));
        strokeDuration = pace * 0.45;
      }
      const recoveryDelay = splitStepDelay + strokeDuration;

      // Adapt speech playback speed (natural 1.0x)
      setPlaybackPace(pace, currentSettings.calloutMode);

      const realSeq = [audioPath];
      if (secondAudioPath) realSeq.push(secondAudioPath);
      const canDeceive =
        currentSettings.deceptionEnabled && Math.random() < 0.15;

      shadowLogger.trainer(
        `🏸 Action cue: ${ZONE_NAMES[zone] || zone} (Pace delay: ${pace.toFixed(1)}s, Landing: ${Math.round(splitStepDelay * 1000)}ms)`,
        { zone, audioSequence: realSeq, canDeceive, ageGroup }
      );

      // Phase 1: SPLIT STEP
      setVisualPhase("split_step");
      shadowLogger.court(
        `🟡 [КОРТ: SPLIT-STEP 0ms] Центърът пулсира в жълто. Очакване на приземяване (${Math.round(splitStepDelay * 1000)}ms).`,
        {
          visualPhase: "split_step",
          activeZone: null,
          voiceStatus: !currentSettings.visualOnly
            ? `Стартира: ${realSeq.join(" + ")}`
            : "Звук изключен",
        }
      );

      if (!currentSettings.visualOnly) {
        audio.stopVoiceOnly();
        audio.playSyntheticBeep(850, 0.08);
      }

      // Robust execution callback runner
      const playWithFallback = (
        paths: string[],
        onDone: () => void,
        timeoutMs = paths.length * 4000 + 3000
      ) => {
        let isDone = false;
        let fallbackTimer: NodeJS.Timeout | null = null;

        const handleDone = () => {
          if (isDone) return;
          isDone = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          if (stateRef.current === "working") {
            onDone();
          }
        };

        fallbackTimer = setTimeout(handleDone, timeoutMs);

        if (!currentSettings.visualOnly) {
          audio.playSequence(paths, handleDone);
        } else {
          setTimeout(handleDone, Math.min(800, timeoutMs));
        }
      };

      // Handler when ALL audio for this movement cycle (target + recovery) is completely finished
      const handleCycleComplete = () => {
        if (stateRef.current !== "working") return;
        tempoWaitStartRef.current =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        shadowLogger.trainer(
          `⏳ [ТЕМПО ЗАБАВЯНЕ] Всички гласови команди приключиха. Пауза от ${pace.toFixed(1)}s преди следващ удар.`
        );
        actionTimeoutRef.current = setTimeout(() => {
          if (stateRef.current === "working") {
            triggerNextActionRef.current();
          }
        }, pace * 1000);
      };

      // Handler when corner audio sequence finishes
      const handleCornerAudioDone = () => {
        if (stateRef.current !== "working") return;

        // Allow 300ms window for athlete to execute the shot at the corner
        centerTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== "working") return;
          setActiveZone(null);
          activeZoneRef.current = null;
          setVisualPhase("center");
          shadowLogger.court(
            "🟢 [ВРЪЩАНЕ В ЦЕНТЪРА] Зоната изгасва. Центърът свети в зелено (прибиране към базова позиция).",
            { visualPhase: "center", activeZone: null }
          );

          const allowCenterVoice =
            currentSettings.centerCommandEnabled && !currentSettings.visualOnly;

          if (allowCenterVoice) {
            shadowLogger.trainer(
              "🎯 Center recovery cue: Център! + Леко подскачане!"
            );
            playWithFallback(
              [AUDIO_PATHS.common.center, AUDIO_PATHS.common.beep],
              handleCycleComplete,
              6000
            );
          } else {
            handleCycleComplete();
          }
        }, 300);
      };

      if (canDeceive) {
        const fakeResolved = resolveAudioPathsAndZone(
          currentSettings.drillMode,
          currentSettings.calloutMode,
          currentSettings.cornersMode,
          "random",
          null,
          pace
        );

        shadowLogger.trainer(
          `🎭 Deception triggered! Showing fake [${ZONE_NAMES[fakeResolved.zone] || fakeResolved.zone}] then switching to [${ZONE_NAMES[zone] || zone}]`
        );

        setActiveZone(fakeResolved.zone);
        if (!currentSettings.visualOnly) {
          audio.playSequence([fakeResolved.audioPath]);
        }

        deceptionTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== "working") return;
          setActiveZone(zone);
          setVisualPhase("shot");
          shadowLogger.court(
            `⚡ [СМЯНА ДЕЦЕПЦИЯ +${Math.round(splitStepDelay * 1000)}ms] Кортът превключва към РЕАЛНАТА зона: [${ZONE_NAMES[zone] || zone}]!`,
            {
              visualPhase: "shot",
              activeZone: zone,
              switchedFrom: fakeResolved.zone,
            }
          );
          playWithFallback(realSeq, handleCornerAudioDone);
        }, splitStepDelay * 1000);
      } else {
        deceptionTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== "working") return;
          setActiveZone(zone);
          setVisualPhase("shot");
          shadowLogger.court(
            `🎯 [КОРТ АКТИВАЦИЯ +${Math.round(splitStepDelay * 1000)}ms] Светва целева зона: [${ZONE_NAMES[zone] || zone}]! Показва се стрелка за придвижване.`,
            {
              visualPhase: "shot",
              activeZone: zone,
              zoneName: ZONE_NAMES[zone] || zone,
              landingDelayMs: Math.round(splitStepDelay * 1000),
            }
          );
        }, splitStepDelay * 1000);

        playWithFallback(realSeq, handleCornerAudioDone);
      }
    } catch (error) {
      shadowLogger.error("Error in triggerNextAction", error);
      console.error("Error in triggerNextAction", error);
      const pace = settingsRef.current?.paceSec || 3;
      actionTimeoutRef.current = setTimeout(() => {
        triggerNextActionRef.current();
      }, pace * 1000);
    }
  }, [audio, cleanupActions]);

  useEffect(() => {
    triggerNextActionRef.current = triggerNextAction;
  }, [triggerNextAction]);

  const handleMotivationTick = useCallback(() => {
    audio.triggerMotivation(
      currentPlayersRef.current,
      !!settings?.motivationEnabled
    );
  }, [audio, settings]);

  const advanceState = useCallback(() => {
    const currentSettings = settingsRef.current;
    if (!currentSettings) return;

    const phase = stateRef.current;

    if (phase === "countdown") {
      setState("working");
      timerRef.current.syncState("working");
      isFirstActionRef.current = true;
      if (currentSettings.mode === "agility_test") {
        timerRef.current.updateTimeRemaining(0);
      } else {
        timerRef.current.updateTimeRemaining(currentSettings.workSec);
      }
      setAgilityActionsDone(0);
      requestWakeLock();
      if (typeof navigator !== "undefined" && !("wakeLock" in navigator)) {
        shadowLogger.diagnostic(
          "📱 [СЪВЕТ ЗА ЕКРАНА] Браузърът не поддържа Screen Wake Lock. Препоръчва се да увеличите времето за изгасване на екрана в настройките на устройството."
        );
      }
      shadowLogger.trainer(
        `🏁 Set ${currentSetRef.current}/${currentSettings.sets} WORK PHASE STARTED`,
        {
          mode: currentSettings.mode,
          durationSec: currentSettings.workSec,
          activePlayers: currentPlayersRef.current.map((p) => p.displayName),
        }
      );
      shadowLogger.court(
        "🟢 [КОРТ АКТИВЕН] Кортът преминава в боен режим (WORK PHASE). Очаква се първият сплит-степ."
      );
      actionTimeoutRef.current = setTimeout(() => {
        triggerNextActionRef.current();
      }, 0);
    } else if (phase === "working") {
      const proceedToNextPhase = () => {
        setActiveZone(null);
        cleanupActions();

        const capacity = getCapacity(currentSettings);
        const waves = splitPlayersIntoWaves(
          currentSettings.activePlayers,
          capacity
        );
        const waveCount = waves.length;
        const isLastWaveInSet = currentWaveRef.current >= waveCount;

        if (!isLastWaveInSet) {
          // --- Преход към следващата група (вълна) в същата серия ---
          const nextWave = currentWaveRef.current + 1;
          currentWaveRef.current = nextWave;
          setCurrentWave(nextWave);

          const nextPlayers = waves[nextWave - 1] || [];
          currentPlayersRef.current = nextPlayers;
          setCurrentPlayersState(nextPlayers);

          shadowLogger.trainer(
            `🔄 Смяна на групите в Серия ${currentSetRef.current}: Влиза Част ${nextWave}/${waveCount} (${nextPlayers.map((p) => p.displayName).join(", ")})`,
            nextPlayers.map((p) => p.displayName)
          );
          shadowLogger.court(
            `🔄 [СМЯНА НА ГРУПИ] Серия ${currentSetRef.current}, Част ${nextWave} от ${waveCount}. На корта влизат чакащите състезатели.`
          );

          setState("countdown");
          timerRef.current.syncState("countdown");
          timerRef.current.updateTimeRemaining(10);
          audio.stop();
          if (!currentSettings.visualOnly) {
            audio.play(AUDIO_PATHS.common.startSet);
          }
        } else {
          // --- Всички групи в текущата серия са приключили! ---
          const isLastSet =
            currentSetRef.current >= currentSettings.sets ||
            currentSettings.mode === "agility_test";

          if (isLastSet) {
            shadowLogger.trainer(
              `🏆 Training session finished successfully! Completed sets: ${currentSetRef.current}`
            );
            setState("finished");
            if (!currentSettings.visualOnly)
              audio.play(AUDIO_PATHS.common.endSet);
          } else {
            shadowLogger.trainer(
              `⏸️ Set ${currentSetRef.current} complete for all ${currentSettings.activePlayers.length} players. Entering rest period (${currentSettings.restSec}s).`
            );
            shadowLogger.court(
              `⏸️ [КОРТ ПОЧИВКА] Край на Серия ${currentSetRef.current} за всички състезатели. Кортът е в режим на почивка (${currentSettings.restSec}s).`
            );
            setState("resting");
            timerRef.current.syncState("resting");
            audio.stop();
            timerRef.current.updateTimeRemaining(currentSettings.restSec);
            if (!currentSettings.visualOnly)
              audio.play(AUDIO_PATHS.common.rest);
          }
        }
      };

      if (!currentSettings.visualOnly && audio.isPlaying()) {
        shadowLogger.trainer(
          "⏳ [ИЗЧАКВАНЕ НА ГЛАСА] Таймерът за фазата изтече, но гласовата команда завършва последните си думи. Плавният преход ще изчака края на изговора."
        );
        let waitedMs = 0;
        const maxWaitMs = 2500;
        const checkInterval = setInterval(() => {
          waitedMs += 100;
          if (!audio.isPlaying() || waitedMs >= maxWaitMs) {
            clearInterval(checkInterval);
            proceedToNextPhase();
          }
        }, 100);
      } else {
        proceedToNextPhase();
      }
    } else if (phase === "resting") {
      const nextSet = currentSetRef.current + 1;
      currentSetRef.current = nextSet;
      setCurrentSet(nextSet);

      // За новата серия започваме отново от първата група (Част 1)!
      currentWaveRef.current = 1;
      setCurrentWave(1);

      const capacity = getCapacity(currentSettings);
      const waves = splitPlayersIntoWaves(
        currentSettings.activePlayers,
        capacity
      );
      const firstWavePlayers = waves[0] || [];
      currentPlayersRef.current = firstWavePlayers;
      setCurrentPlayersState(firstWavePlayers);

      shadowLogger.trainer(
        `🔔 Rest period ended. Starting countdown for Set ${nextSet}/${currentSettings.sets} (Част 1)`
      );
      setState("countdown");
      timerRef.current.syncState("countdown");
      timerRef.current.updateTimeRemaining(10);
      if (!currentSettings.visualOnly) {
        audio.play(AUDIO_PATHS.common.startSet);
      }
    }
  }, [audio, cleanupActions]);

  const handleCountdownReady = useCallback(() => {
    if (!settingsRef.current?.visualOnly) {
      shadowLogger.trainer("👟 Pre-drill readiness cue: Леко подскачане!");
      audio.play(AUDIO_PATHS.common.beep);
    }
  }, [audio]);

  const {
    timeRemaining,
    actualElapsedMs,
    updateTimeRemaining,
    syncState,
    setActualElapsedMs,
    cleanupTimer,
    getTimeRemaining,
  } = useShadowTimer({
    state,
    settings,
    advanceState,
    onMotivationTick: handleMotivationTick,
    onCountdownReady: handleCountdownReady,
  });

  const timerRef = useRef({
    syncState,
    updateTimeRemaining,
    setActualElapsedMs,
    cleanupTimer,
    getTimeRemaining,
  });
  useEffect(() => {
    timerRef.current = {
      syncState,
      updateTimeRemaining,
      setActualElapsedMs,
      cleanupTimer,
      getTimeRemaining,
    };
  }, [
    syncState,
    updateTimeRemaining,
    setActualElapsedMs,
    cleanupTimer,
    getTimeRemaining,
  ]);

  const startTraining = useCallback(() => {
    if (!settings) return;
    audio.unlock();
    audio.stop();
    requestWakeLock();
    setState("countdown");
    timerRef.current.syncState("countdown");
    setCurrentSet(1);
    currentSetRef.current = 1;
    setCurrentWave(1);
    currentWaveRef.current = 1;
    const capacity = getCapacity(settings);
    const waves = splitPlayersIntoWaves(settings.activePlayers, capacity);
    const initialPlayers = waves[0] || [];
    currentPlayersRef.current = initialPlayers;
    setCurrentPlayersState(initialPlayers);

    timerRef.current.updateTimeRemaining(10);
    setAgilityActionsDone(0);
    agilityActionsDoneRef.current = 0;
    consecutiveFastShotsRef.current = 0;
    timerRef.current.setActualElapsedMs(0);

    shadowLogger.trainer("🚀 Training Launched from Coach Interface", {
      mode: settings.mode,
      preset: settings.preset,
      drillMode: settings.drillMode,
      cornersMode: settings.cornersMode,
      sets: settings.sets,
      workSec: settings.workSec,
      restSec: settings.restSec,
      paceSec: settings.paceSec,
      calloutMode: settings.calloutMode,
      deceptionEnabled: settings.deceptionEnabled,
      centerCommandEnabled: settings.centerCommandEnabled,
      playersCount: settings.activePlayers.length,
      players: settings.activePlayers.map((p) => p.displayName),
    });

    if (!settings.visualOnly) {
      audio.play(AUDIO_PATHS.common.startSet);
    }
  }, [settings, audio]);

  const pauseTraining = useCallback(() => {
    if (
      stateRef.current !== "paused" &&
      stateRef.current !== "idle" &&
      stateRef.current !== "finished"
    ) {
      previousStateRef.current = stateRef.current;
    }
    shadowLogger.trainer("⏸️ Training Paused by Coach", {
      fromState: stateRef.current,
    });
    setState("paused");
    timerRef.current.syncState("paused");
    audio.stop();
    cleanupActions();
  }, [audio, cleanupActions]);

  const resumeTraining = useCallback(() => {
    if (stateRef.current === "paused") {
      const targetState = previousStateRef.current;
      shadowLogger.trainer("▶️ Training Resumed", {
        resumingState: targetState,
      });
      setState(targetState);
      timerRef.current.syncState(targetState);
      requestWakeLock();
      if (targetState === "working") {
        actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
      }
    }
  }, [triggerNextAction]);

  const stopTraining = useCallback(() => {
    shadowLogger.trainer("⏹️ Training Stopped by Coach");
    setState("finished");
    timerRef.current.syncState("finished");
    audio.stop();
    cleanupActions();
  }, [audio, cleanupActions]);

  useEffect(() => {
    if (
      settings === null &&
      stateRef.current !== "idle" &&
      stateRef.current !== "finished"
    ) {
      stopTraining();
    }
  }, [settings, stopTraining]);

  useEffect(() => {
    return () => {
      cleanupActions();
      timerRef.current.cleanupTimer();
    };
  }, [cleanupActions, cleanupTimer]);

  const skipCountdown = useCallback(() => {
    if (stateRef.current === "countdown") {
      shadowLogger.trainer("⏩ Countdown skipped — Starting work immediately");
      audio.stop();
      advanceState();
    }
  }, [advanceState, audio]);

  const courtSlots = useMemo(() => {
    if (!settings) return [];
    return calculateCourtAssignments(
      settings.activePlayers,
      settings.courtsAvailable,
      settings.courtAllocationStrategy || "two_per_court",
      currentPlayersState
    ).slots;
  }, [settings, currentPlayersState]);

  return {
    state,
    currentSet,
    currentWave,
    totalWaves,
    activeZone,
    visualPhase,
    timeRemaining,
    actualElapsedMs,
    currentRotationPlayers: currentPlayersState,
    courtSlots,
    agilityActionsDone,
    nextActionDelay,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
    skipCountdown,
  };
}
