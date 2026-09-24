"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUDIO_PATHS,
  getRandomShotForZone,
  getRandomZoneForMode,
  setPlaybackPace,
  ZONE_NAMES,
  ZoneId,
} from "@/lib/shadow-training/audio-map";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";

import {
  ShadowPlayer,
  ShadowSettings,
  TrainerState,
  VisualPhase,
  WakeLockSentinel,
} from "./shadow-trainer/types";
import { useShadowAudio } from "./shadow-trainer/useShadowAudio";
import { useShadowTimer } from "./shadow-trainer/useShadowTimer";

export type { ShadowPlayer, ShadowSettings, TrainerState, VisualPhase };

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

function applyNetBack(lastZone: ZoneId, cornersMode: CornersMode): ZoneId {
  const { back, net } = getZonePools(cornersMode);
  return lastZone.startsWith("front") ? pick(back) : pick(net);
}

function applyTriangle(
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

function applyMixed(
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

function applyDrillPattern(
  drillPattern: string,
  lastZone: ZoneId | null,
  cornersMode: CornersMode,
  randomZone: ZoneId
): ZoneId {
  if (drillPattern === "fixed-net-back" && lastZone)
    return applyNetBack(lastZone, cornersMode);
  if (drillPattern === "fixed-triangle")
    return applyTriangle(lastZone, cornersMode);
  if (drillPattern === "mixed" && lastZone)
    return applyMixed(lastZone, cornersMode, randomZone);
  return randomZone;
}

function resolveAudioPathsAndZone(
  drillMode: string,
  calloutMode: string,
  cornersMode: "2-corners" | "4-corners" | "6-corners" = "6-corners",
  drillPattern: string = "random",
  lastZone: ZoneId | null = null
) {
  const randomZone: ZoneId = getRandomZoneForMode(
    drillMode as "all" | "front_only" | "back_only" | "front_back",
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
  } else if (calloutMode === "zones_and_shots") {
    // Зони + Удари: първо зоната, после удара
    audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.frontForehand;
    secondAudioPath = getRandomShotForZone(zone) || AUDIO_PATHS.shots.defense;
  }
  // calloutMode === "zones": само audioPath (зоната) — вече е зададен по-горе

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

function rotatePlayers(
  currentSettings: ShadowSettings,
  currentPlayersRef: React.MutableRefObject<ShadowPlayer[]>,
  playCountsRef: React.MutableRefObject<Record<string, number>>
): ShadowPlayer[] {
  const groupSize = currentSettings.courtsAvailable || 1;
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
  const [agilityActionsDone, setAgilityActionsDone] = useState(0);
  const [nextActionDelay, setNextActionDelay] = useState<number | null>(null);

  const playCountsRef = useRef<Record<string, number>>({});
  const consecutiveFastShotsRef = useRef(0);
  const currentPlayersRef = useRef<ShadowPlayer[]>([]);

  const previousStateRef = useRef<TrainerState>("idle");

  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deceptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const centerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isFirstActionRef = useRef(false);

  const settingsRef = useRef(settings);
  const stateRef = useRef(state);
  const currentSetRef = useRef(currentSet);
  const agilityActionsDoneRef = useRef(agilityActionsDone);

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

      const groupSize = settings.courtsAvailable || 1;
      const initialPlayers = settings.activePlayers.slice(0, groupSize);
      currentPlayersRef.current = initialPlayers;
      setCurrentPlayersState(initialPlayers);
      consecutiveFastShotsRef.current = 0;
    }
  }, [settings]);

  const requestWakeLock = async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (
          navigator as unknown as {
            wakeLock: { request(type: string): Promise<WakeLockSentinel> };
          }
        ).wakeLock.request("screen");
      } catch (err) {
        console.warn("Wake Lock error:", err);
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
    setVisualPhase("idle");
    setNextActionDelay(null);
    releaseWakeLock();
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

  // eslint-disable-next-line sonarjs/cognitive-complexity
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

      const pace =
        currentSettings.mode === "ghost_match"
          ? calculateGhostMatchPace(
              consecutiveFastShotsRef,
              currentSettings.paceSec
            )
          : currentSettings.paceSec;

      setNextActionDelay(pace);

      const { zone, audioPath, secondAudioPath } = resolveAudioPathsAndZone(
        currentSettings.drillMode,
        currentSettings.calloutMode,
        currentSettings.cornersMode,
        currentSettings.drillPattern,
        activeZone
      );

      // Biomechanical Phase Timing
      const ageGroup = currentSettings.ageGroup;
      let splitStepDelay = pace * 0.15;
      let strokeDuration = pace * 0.5;

      if (ageGroup === "U9-U11") {
        splitStepDelay = Math.max(0.5, pace * 0.15);
      } else if (ageGroup === "U17+") {
        splitStepDelay = Math.min(0.25, pace * 0.1);
        strokeDuration = pace * 0.45;
      }
      const recoveryDelay = splitStepDelay + strokeDuration;

      // Adapt speech playback speed to pace & callout mode
      setPlaybackPace(pace, currentSettings.calloutMode);

      const realSeq = [audioPath];
      if (secondAudioPath) realSeq.push(secondAudioPath);
      const canDeceive =
        currentSettings.deceptionEnabled && Math.random() < 0.15;

      shadowLogger.trainer(
        `🏸 Action cue: ${ZONE_NAMES[zone] || zone} (Pace: ${pace.toFixed(1)}s, Landing: ${Math.round(splitStepDelay * 1000)}ms)`,
        { zone, audioSequence: realSeq, canDeceive, ageGroup }
      );

      // Phase 1: SPLIT STEP
      setVisualPhase("split_step");
      if (!currentSettings.visualOnly) {
        audio.stopVoiceOnly();
        if (!isFirst) audio.play(AUDIO_PATHS.common.splitStep);
        else audio.play(AUDIO_PATHS.common.beep);
      }

      if (canDeceive) {
        const fakeResolved = resolveAudioPathsAndZone(
          currentSettings.drillMode,
          currentSettings.calloutMode,
          currentSettings.cornersMode,
          "random"
        );

        shadowLogger.trainer(
          `🎭 Deception triggered! Showing fake [${ZONE_NAMES[fakeResolved.zone] || fakeResolved.zone}] then switching to [${ZONE_NAMES[zone] || zone}]`
        );

        if (!currentSettings.visualOnly) {
          const fakeSeq = [fakeResolved.audioPath];
          if (fakeResolved.secondAudioPath)
            fakeSeq.push(fakeResolved.secondAudioPath);
          audio.playSequence(fakeSeq);
        }

        setActiveZone(fakeResolved.zone);

        deceptionTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== "working") return;
          setActiveZone(zone);
          setVisualPhase("shot");
          if (!currentSettings.visualOnly) {
            audio.stop();
            audio.playSequence(realSeq);
          }
        }, splitStepDelay * 1000);
      } else {
        // Synchronized with landing from split-step
        deceptionTimeoutRef.current = setTimeout(() => {
          if (stateRef.current !== "working") return;
          setActiveZone(zone);
          setVisualPhase("shot");
          if (!currentSettings.visualOnly) {
            audio.playSequence(realSeq);
          }
        }, splitStepDelay * 1000);
      }

      // Phase 3: RECOVERY
      centerTimeoutRef.current = setTimeout(() => {
        if (stateRef.current === "working") {
          setActiveZone(null);
          setVisualPhase("center");
          // In two-word mode (zones_and_shots) on high tempo (< 3.8s), voice Center cue
          // would collide with the active shot audio. Center recovery remains visual.
          const allowCenterVoice =
            currentSettings.centerCommandEnabled &&
            !currentSettings.visualOnly &&
            (currentSettings.calloutMode !== "zones_and_shots" || pace >= 3.8);

          if (allowCenterVoice && pace >= 2.2) {
            shadowLogger.trainer("🎯 Center recovery cue triggered");
            audio.play(AUDIO_PATHS.common.center);
          }
        }
      }, recoveryDelay * 1000);

      // Phase 4: Next Cycle
      actionTimeoutRef.current = setTimeout(() => {
        triggerNextAction();
      }, pace * 1000);
    } catch (error) {
      shadowLogger.error("Error in triggerNextAction", error);
      console.error("Error in triggerNextAction", error);
      const pace = settingsRef.current?.paceSec || 3;
      actionTimeoutRef.current = setTimeout(triggerNextAction, pace * 1000);
    }
  }, [audio, activeZone, cleanupActions]);

  const handleMotivationTick = useCallback(() => {
    audio.triggerMotivation(
      currentPlayersRef.current,
      !!settings?.motivationEnabled
    );
  }, [audio, settings]);

  // eslint-disable-next-line sonarjs/cognitive-complexity
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
      shadowLogger.trainer(
        `🏁 Set ${currentSetRef.current}/${currentSettings.sets} WORK PHASE STARTED`,
        {
          mode: currentSettings.mode,
          durationSec: currentSettings.workSec,
          activePlayers: currentPlayersRef.current.map((p) => p.displayName),
        }
      );
      actionTimeoutRef.current = setTimeout(triggerNextAction, 0);
    } else if (phase === "working") {
      setActiveZone(null);
      cleanupActions();
      const isLastSet =
        currentSetRef.current >= currentSettings.sets ||
        currentSettings.mode === "agility_test";

      if (isLastSet) {
        shadowLogger.trainer(
          `🏆 Training session finished successfully! Completed sets: ${currentSetRef.current}`
        );
        setState("finished");
        if (!currentSettings.visualOnly) audio.play(AUDIO_PATHS.common.endSet);
      } else {
        const nextPlayers = rotatePlayers(
          currentSettings,
          currentPlayersRef,
          playCountsRef
        );
        if (nextPlayers !== currentPlayersRef.current) {
          currentPlayersRef.current = nextPlayers;
          setCurrentPlayersState(nextPlayers);
        }
        shadowLogger.trainer(
          `⏸️ Set ${currentSetRef.current} complete. Entering rest period (${currentSettings.restSec}s). Next players rotation: ${nextPlayers.map((p) => p.displayName).join(", ")}`,
          nextPlayers.map((p) => p.displayName)
        );
        setState("resting");
        timerRef.current.syncState("resting");
        audio.stop();
        timerRef.current.updateTimeRemaining(currentSettings.restSec);
        if (!currentSettings.visualOnly) audio.play(AUDIO_PATHS.common.rest);
      }
    } else if (phase === "resting") {
      setCurrentSet((c) => c + 1);
      shadowLogger.trainer(
        `🔔 Rest period ended. Starting countdown for Set ${currentSetRef.current + 1}/${currentSettings.sets}`
      );
      setState("countdown");
      timerRef.current.syncState("countdown");
      timerRef.current.updateTimeRemaining(10);
      if (!currentSettings.visualOnly) {
        audio.playSequence([
          AUDIO_PATHS.common.endRest,
          AUDIO_PATHS.common.startSet,
        ]);
      }
    }
  }, [audio, cleanupActions, triggerNextAction]);

  const {
    timeRemaining,
    actualElapsedMs,
    updateTimeRemaining,
    syncState,
    setActualElapsedMs,
    cleanupTimer,
  } = useShadowTimer({
    state,
    settings,
    advanceState,
    onMotivationTick: handleMotivationTick,
  });

  const timerRef = useRef({
    syncState,
    updateTimeRemaining,
    setActualElapsedMs,
    cleanupTimer,
  });
  useEffect(() => {
    timerRef.current = {
      syncState,
      updateTimeRemaining,
      setActualElapsedMs,
      cleanupTimer,
    };
  }, [syncState, updateTimeRemaining, setActualElapsedMs, cleanupTimer]);

  const startTraining = useCallback(() => {
    if (!settings) return;
    audio.unlock();
    audio.stop();
    requestWakeLock();
    setState("countdown");
    timerRef.current.syncState("countdown");
    setCurrentSet(1);
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

  return {
    state,
    currentSet,
    activeZone,
    visualPhase,
    timeRemaining,
    actualElapsedMs,
    currentRotationPlayers: currentPlayersState,
    agilityActionsDone,
    nextActionDelay,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
    skipCountdown,
  };
}
