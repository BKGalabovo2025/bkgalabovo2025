"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AUDIO_PATHS,
  ZoneId,
  getRandomZoneForMode,
  getRandomShotForZone,
} from "@/lib/shadow-training/audio-map";
import { useShadowAudio } from "./shadow-trainer/useShadowAudio";
import { useShadowTimer } from "./shadow-trainer/useShadowTimer";
import {
  ShadowSettings,
  TrainerState,
  VisualPhase,
  ShadowPlayer,
  WakeLockSentinel,
} from "./shadow-trainer/types";

export type { ShadowSettings, TrainerState, VisualPhase, ShadowPlayer };

// ─── Pure helper functions ─────────

function resolveAudioPathsAndZone(
  drillMode: string,
  calloutMode: string,
  cornersMode: "4-corners" | "6-corners" = "6-corners",
  drillPattern: string = "random",
  lastZone: ZoneId | null = null
) {
  let zone: ZoneId = getRandomZoneForMode(
    drillMode as "all" | "front_only" | "back_only" | "front_back",
    cornersMode
  );

  if (drillPattern === "fixed-net-back" && lastZone) {
    if (lastZone.startsWith("front")) {
      const pool =
        cornersMode === "4-corners"
          ? ["backForehand", "backBackhand"]
          : ["backForehand", "backBackhand", "overhead"];
      zone = pool[Math.floor(Math.random() * pool.length)] as ZoneId;
    } else {
      const pool = ["frontForehand", "frontBackhand"];
      zone = pool[Math.floor(Math.random() * pool.length)] as ZoneId;
    }
  }

  let audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.frontForehand;
  let secondAudioPath: string | null = null;

  const isShotMode =
    calloutMode === "shots" || (calloutMode === "mixed" && Math.random() > 0.5);

  if (isShotMode) {
    if (zone.startsWith("mid")) {
      audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.midForehand;
      secondAudioPath = getRandomShotForZone(zone) || AUDIO_PATHS.shots.defense;
    } else {
      audioPath = getRandomShotForZone(zone) || AUDIO_PATHS.shots.defense;
    }
  } else if (calloutMode === "zones_and_shots") {
    audioPath = AUDIO_PATHS.zones[zone] || AUDIO_PATHS.zones.frontForehand;
    secondAudioPath = getRandomShotForZone(zone) || AUDIO_PATHS.shots.defense;
  }

  return { zone, audioPath, secondAudioPath };
}

function calculateGhostMatchPace(
  consecutiveFastShotsRef: React.MutableRefObject<number>
): number {
  let pace = 3;
  if (consecutiveFastShotsRef.current >= 3) {
    if (Math.random() > 0.2) {
      pace = Math.random() * 1.0 + 2.5;
      consecutiveFastShotsRef.current = 0;
    } else {
      pace = Math.random() * 1.0 + 1.2;
      consecutiveFastShotsRef.current++;
    }
  } else {
    pace = Math.random() * 1.0 + 1.2;
    if (pace < 2.0) {
      consecutiveFastShotsRef.current++;
    } else {
      consecutiveFastShotsRef.current = 0;
    }
  }
  return pace;
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

  const [currentPlayersState, setCurrentPlayersState] = useState<ShadowPlayer[]>([]);
  const [agilityActionsDone, setAgilityActionsDone] = useState(0);

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

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);
  useEffect(() => { agilityActionsDoneRef.current = agilityActionsDone; }, [agilityActionsDone]);

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
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      } catch (err) {
        console.log("Wake Lock error:", err);
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
    setVisualPhase("idle");
    releaseWakeLock();
  }, []);

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
        }
        if (nextCount >= currentSettings.workSec) {
          setState("finished");
          cleanupActions();
          if (!currentSettings.visualOnly) audio.play(AUDIO_PATHS.common.endSet);
          return;
        }
      }

      const pace =
        currentSettings.mode === "ghost_match"
          ? calculateGhostMatchPace(consecutiveFastShotsRef)
          : currentSettings.paceSec;

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

      // Phase 1: SPLIT STEP
      setVisualPhase("split_step");
      if (!currentSettings.visualOnly) {
        if (!isFirst) audio.play(AUDIO_PATHS.common.splitStep);
        else audio.play(AUDIO_PATHS.common.beep);
      }

      // Phase 2: STROKE
      deceptionTimeoutRef.current = setTimeout(() => {
        if (stateRef.current !== "working") return;

        const canDeceive = currentSettings.deceptionEnabled && Math.random() < 0.15;

        if (canDeceive) {
          const fakeResolved = resolveAudioPathsAndZone(
            currentSettings.drillMode,
            currentSettings.calloutMode,
            currentSettings.cornersMode,
            "random"
          );

          if (!currentSettings.visualOnly) {
            const fakeSeq = [fakeResolved.audioPath];
            if (fakeResolved.secondAudioPath) fakeSeq.push(fakeResolved.secondAudioPath);
            audio.playSequence(fakeSeq);
          }
          setActiveZone(fakeResolved.zone);
          setVisualPhase("shot");

          setTimeout(() => {
            if (stateRef.current !== "working") return;
            setActiveZone(zone);
            if (!currentSettings.visualOnly) {
              audio.stop();
              const realSeq = [audioPath];
              if (secondAudioPath) realSeq.push(secondAudioPath);
              audio.playSequence(realSeq);
            }
          }, Math.max(300, splitStepDelay * 1000));
        } else {
          setActiveZone(zone);
          setVisualPhase("shot");
          if (!currentSettings.visualOnly) {
            const realSeq = [audioPath];
            if (secondAudioPath) realSeq.push(secondAudioPath);
            audio.playSequence(realSeq);
          }
        }
      }, splitStepDelay * 1000);

      // Phase 3: RECOVERY
      centerTimeoutRef.current = setTimeout(() => {
        if (stateRef.current === "working") {
          setActiveZone(null);
          setVisualPhase("center");
          if (currentSettings.centerCommandEnabled && !currentSettings.visualOnly) {
            audio.play(AUDIO_PATHS.common.center);
          }
        }
      }, recoveryDelay * 1000);

      // Phase 4: Next Cycle
      actionTimeoutRef.current = setTimeout(() => {
        triggerNextAction();
      }, pace * 1000);

    } catch (error) {
      console.error("Error in triggerNextAction", error);
      const pace = settingsRef.current?.paceSec || 3;
      actionTimeoutRef.current = setTimeout(triggerNextAction, pace * 1000);
    }
  }, [audio, activeZone, cleanupActions]);

  const handleMotivationTick = useCallback(() => {
    audio.triggerMotivation(currentPlayersRef.current, !!settings?.motivationEnabled);
  }, [audio, settings]);

  const advanceState = useCallback(() => {
    const currentSettings = settingsRef.current;
    if (!currentSettings) return;

    const phase = stateRef.current;
    
    if (phase === "countdown") {
      setState("working");
      isFirstActionRef.current = true;
      if (currentSettings.mode === "agility_test") {
        timer.updateTimeRemaining(0);
      } else {
        timer.updateTimeRemaining(currentSettings.workSec);
      }
      setAgilityActionsDone(0);
      requestWakeLock();
      actionTimeoutRef.current = setTimeout(triggerNextAction, 0);
    } 
    else if (phase === "working") {
      setActiveZone(null);
      cleanupActions();
      const isLastSet = currentSetRef.current >= currentSettings.sets || currentSettings.mode === "agility_test";
      
      if (isLastSet) {
        setState("finished");
        if (!currentSettings.visualOnly) audio.play(AUDIO_PATHS.common.endSet);
      } else {
        const nextPlayers = rotatePlayers(currentSettings, currentPlayersRef, playCountsRef);
        if (nextPlayers !== currentPlayersRef.current) {
          currentPlayersRef.current = nextPlayers;
          setCurrentPlayersState(nextPlayers);
        }
        setState("resting");
        audio.stop();
        timer.updateTimeRemaining(currentSettings.restSec);
        if (!currentSettings.visualOnly) audio.play(AUDIO_PATHS.common.rest);
      }
    } 
    else if (phase === "resting") {
      setCurrentSet((c) => c + 1);
      setState("countdown");
      timer.updateTimeRemaining(10);
      if (!currentSettings.visualOnly) {
        audio.playSequence([AUDIO_PATHS.common.endRest, AUDIO_PATHS.common.startSet]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audio, cleanupActions, triggerNextAction]);

  const timer = useShadowTimer({
    state,
    settings,
    advanceState,
    onMotivationTick: handleMotivationTick,
  });

  const startTraining = useCallback(() => {
    if (!settings) return;
    audio.unlock();
    audio.stop();
    requestWakeLock();
    setState("countdown");
    setCurrentSet(1);
    timer.updateTimeRemaining(10);
    setAgilityActionsDone(0);
    timer.setActualElapsedMs(0);
    if (!settings.visualOnly) {
      audio.play(AUDIO_PATHS.common.startSet);
    }
  }, [settings, audio, timer]);

  const pauseTraining = useCallback(() => {
    if (stateRef.current !== "paused" && stateRef.current !== "idle" && stateRef.current !== "finished") {
      previousStateRef.current = stateRef.current;
    }
    setState("paused");
    audio.stop();
    cleanupActions();
  }, [audio, cleanupActions]);

  const resumeTraining = useCallback(() => {
    if (stateRef.current === "paused") {
      const targetState = previousStateRef.current;
      setState(targetState);
      requestWakeLock();
      if (targetState === "working") {
        actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
      }
    }
  }, [triggerNextAction]);

  const stopTraining = useCallback(() => {
    setState("finished");
    audio.stop();
    cleanupActions();
  }, [audio, cleanupActions]);

  useEffect(() => {
    if (settings === null && stateRef.current !== "idle" && stateRef.current !== "finished") {
      stopTraining();
    }
  }, [settings, stopTraining]);

  useEffect(() => {
    return () => {
      cleanupActions();
      timer.cleanupTimer();
    };
  }, [cleanupActions, timer]);

  return {
    state,
    currentSet,
    timeRemaining: timer.timeRemaining,
    activeZone,
    visualPhase,
    currentRotationPlayers: currentPlayersState,
    agilityActionsDone,
    actualElapsedMs: timer.actualElapsedMs,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
  };
}
