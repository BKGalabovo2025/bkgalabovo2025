"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AUDIO_PATHS,
  ZoneId,
  getRandomZoneForMode,
  playAudio,
  playAudioSequence,
  stopAudio,
  shadowAudioManager,
  getRandomShotForZone,
  isAudioPlaying,
} from "@/lib/shadow-training/audio-map";

export interface ShadowPlayer {
  id: string;
  displayName?: string;
  [key: string]: unknown;
}

export interface WakeLockSentinel {
  release(): Promise<void>;
}

export type TrainerState =
  | "idle"
  | "countdown"
  | "working"
  | "resting"
  | "finished"
  | "paused";

export interface ShadowSettings {
  mode: "standard" | "ghost_match" | "agility_test";
  preset: string;
  drillMode: "all" | "front_only" | "back_only" | "front_back";
  sets: number;
  workSec: number; // For agility_test, this will be the Target Actions
  restSec: number;
  paceSec: number;
  deceptionEnabled: boolean;
  motivationEnabled: boolean;
  visualOnly: boolean;
  calloutMode: "zones" | "shots" | "mixed" | "zones_and_shots";
  centerCommandEnabled: boolean;
  activePlayers: ShadowPlayer[]; // The full selected players array
  courtsAvailable: number;
}

// ─── Pure helper functions (extracted to reduce cognitive complexity) ─────────

function _resolveAudioPathsAndZone(
  drillMode: string,
  calloutMode: string
) {
  const zone = getRandomZoneForMode(drillMode as "all" | "front_only" | "back_only" | "front_back") || "frontForehand";
  let audioPath = AUDIO_PATHS.zones[zone as ZoneId] || AUDIO_PATHS.zones.frontForehand;
  let secondAudioPath: string | null = null;

  const isShotMode =
    calloutMode === "shots" ||
    (calloutMode === "mixed" && Math.random() > 0.5);

  if (isShotMode) {
    if (zone.startsWith("mid")) {
      audioPath = AUDIO_PATHS.zones[zone as ZoneId] || AUDIO_PATHS.zones.midForehand;
      secondAudioPath = getRandomShotForZone(zone as ZoneId) || AUDIO_PATHS.shots.defense;
    } else {
      audioPath = getRandomShotForZone(zone as ZoneId) || AUDIO_PATHS.shots.defense;
    }
  } else if (calloutMode === "zones_and_shots") {
    audioPath = AUDIO_PATHS.zones[zone as ZoneId] || AUDIO_PATHS.zones.frontForehand;
    secondAudioPath = getRandomShotForZone(zone as ZoneId) || AUDIO_PATHS.shots.defense;
  }

  return { zone: zone as ZoneId, audioPath, secondAudioPath };
}

function _calculateGhostMatchPace(consecutiveFastShotsRef: React.MutableRefObject<number>): number {
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

function _rotatePlayers(
  currentSettings: ShadowSettings,
  currentPlayersRef: React.MutableRefObject<ShadowPlayer[]>,
  playCountsRef: React.MutableRefObject<Record<string, number>>
): ShadowPlayer[] {
  const groupSize = currentSettings.courtsAvailable || 1;
  if (currentSettings.activePlayers.length <= groupSize) return currentPlayersRef.current;

  currentPlayersRef.current.forEach((p) => {
    if (playCountsRef.current[p.id] !== undefined) {
      playCountsRef.current[p.id]++;
    }
  });

  const sorted = [...currentSettings.activePlayers].sort((a, b) => {
    const cA = playCountsRef.current[a.id] || 0;
    const cB = playCountsRef.current[b.id] || 0;
    if (cA !== cB) return cA - cB;
    return currentSettings.activePlayers.indexOf(a) - currentSettings.activePlayers.indexOf(b);
  });

  return sorted.slice(0, groupSize);
}

type TriggerNextActionRefs = {
  stateRef: React.MutableRefObject<TrainerState>;
  settingsRef: React.MutableRefObject<ShadowSettings | null>;
  agilityActionsDoneRef: React.MutableRefObject<number>;
  isFirstActionRef: React.MutableRefObject<boolean>;
  consecutiveFastShotsRef: React.MutableRefObject<number>;
  deceptionTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  centerTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  actionTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
};

function _handleAgilityTestAction(
  isFirst: boolean,
  refs: TriggerNextActionRefs,
  setAgilityActionsDone: (v: number) => void,
  cleanup: () => void
): boolean {
  const currentSettings = refs.settingsRef.current!;
  let nextCount = refs.agilityActionsDoneRef.current;
  if (!isFirst) {
    nextCount = nextCount + 1;
    setAgilityActionsDone(nextCount);
    refs.agilityActionsDoneRef.current = nextCount;
  }
  if (nextCount >= currentSettings.workSec) {
    refs.stateRef.current = "finished";
    cleanup();
    if (!currentSettings.visualOnly) playAudio(AUDIO_PATHS.common.endSet);
    return true; // signal: finished
  }
  return false;
}

function _scheduleAudio(
  isFirst: boolean,
  pace: number,
  audioPath: string,
  secondAudioPath: string | null,
  deceptionEnabled: boolean,
  deceptionTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  stateRef: React.MutableRefObject<TrainerState>,
  drillMode: string,
  calloutMode: string
) {
  if (deceptionEnabled && Math.random() < 0.1) {
    const fakeResolved = _resolveAudioPathsAndZone(drillMode, calloutMode);
    const fakeSequence: string[] = [];
    if (isFirst) fakeSequence.push(AUDIO_PATHS.common.beep);
    fakeSequence.push(fakeResolved.audioPath);
    if (fakeResolved.secondAudioPath) fakeSequence.push(fakeResolved.secondAudioPath);
    playAudioSequence(fakeSequence);

    const deceptionDelay = Math.max(300, Math.min(pace * 1000 * 0.35, 800));
    deceptionTimeoutRef.current = setTimeout(() => {
      if (stateRef.current !== "working") return;
      const realSequence = [audioPath];
      if (secondAudioPath) realSequence.push(secondAudioPath);
      playAudioSequence(realSequence);
    }, deceptionDelay);
  } else {
    const sequence: string[] = [];
    if (isFirst) sequence.push(AUDIO_PATHS.common.beep);
    sequence.push(audioPath);
    if (secondAudioPath) sequence.push(secondAudioPath);
    playAudioSequence(sequence);
  }
}

function _scheduleNextAction(
  pace: number,
  secondAudioPath: string | null,
  centerCommandEnabled: boolean,
  visualOnly: boolean,
  centerTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  actionTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  stateRef: React.MutableRefObject<TrainerState>,
  setActiveZone: (zone: ZoneId | null) => void,
  triggerNextAction: () => void
) {
  if (centerCommandEnabled && !visualOnly) {
    centerTimeoutRef.current = setTimeout(() => {
      if (stateRef.current === "working") {
        playAudio(AUDIO_PATHS.common.center);
      }
    }, (pace * 1000) / 2);
  }
  const expectedAudioFiles = 1 + (secondAudioPath ? 1 : 0);
  const approxAudioDuration = expectedAudioFiles * 900;
  let nextPaceMs = pace * 1000;
  if (nextPaceMs < approxAudioDuration) {
    nextPaceMs = approxAudioDuration + 200;
  }
  actionTimeoutRef.current = setTimeout(() => {
    setActiveZone(null);
    actionTimeoutRef.current = setTimeout(triggerNextAction, 300);
  }, nextPaceMs);
}

type AdvanceStateRefs = {
  stateRef: React.MutableRefObject<TrainerState>;
  currentSetRef: React.MutableRefObject<number>;
  timerRef: React.MutableRefObject<NodeJS.Timeout | null>;
  actionTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
  isFirstActionRef: React.MutableRefObject<boolean>;
  currentPlayersRef: React.MutableRefObject<ShadowPlayer[]>;
  playCountsRef: React.MutableRefObject<Record<string, number>>;
};

function _advanceFromCountdown(
  currentSettings: ShadowSettings,
  refs: AdvanceStateRefs,
  updateTimeRemaining: (v: number) => void,
  setAgilityActionsDone: (v: number) => void,
  requestWakeLock: () => void,
  triggerNextAction: () => void
) {
  refs.stateRef.current = "working";
  refs.isFirstActionRef.current = true;
  if (currentSettings.mode === "agility_test") {
    updateTimeRemaining(0);
  } else {
    updateTimeRemaining(currentSettings.workSec);
  }
  setAgilityActionsDone(0);
  requestWakeLock();
  refs.actionTimeoutRef.current = setTimeout(triggerNextAction, 0);
}

function _advanceFromWorking(
  currentSettings: ShadowSettings,
  refs: AdvanceStateRefs,
  updateTimeRemaining: (v: number) => void,
  setCurrentPlayersState: (p: ShadowPlayer[]) => void,
  cleanup: () => void
) {
  cleanup();
  const isLastSet =
    refs.currentSetRef.current >= currentSettings.sets ||
    currentSettings.mode === "agility_test";
  if (isLastSet) {
    refs.stateRef.current = "finished";
    if (!currentSettings.visualOnly) playAudio(AUDIO_PATHS.common.endSet);
  } else {
    const nextPlayers = _rotatePlayers(currentSettings, refs.currentPlayersRef, refs.playCountsRef);
    if (nextPlayers !== refs.currentPlayersRef.current) {
      refs.currentPlayersRef.current = nextPlayers;
      setCurrentPlayersState(nextPlayers);
    }
    refs.stateRef.current = "resting";
    stopAudio();
    updateTimeRemaining(currentSettings.restSec);
    if (!currentSettings.visualOnly) playAudio(AUDIO_PATHS.common.rest);
  }
}

function _advanceFromResting(
  currentSettings: ShadowSettings,
  refs: AdvanceStateRefs,
  updateTimeRemaining: (v: number) => void,
  setCurrentSet: (fn: (c: number) => number) => void
) {
  setCurrentSet((c) => c + 1);
  refs.stateRef.current = "countdown";
  updateTimeRemaining(10);
  if (!currentSettings.visualOnly) {
    playAudioSequence([AUDIO_PATHS.common.endRest, AUDIO_PATHS.common.startSet]);
  }
}

// ─── Extracted tick-level logic ───────────────────────────────────────────────

type TickContext = {
  expectedTimeRemainingRef: React.MutableRefObject<number>;
  stateRef: React.MutableRefObject<TrainerState>;
  settingsRef: React.MutableRefObject<ShadowSettings | null>;
  advanceState: () => void;
  speakMotivation: () => void;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  setActualElapsedMs: React.Dispatch<React.SetStateAction<number>>;
};

function _onSecondTick(ctx: TickContext) {
  const {
    expectedTimeRemainingRef,
    stateRef,
    settingsRef,
    advanceState,
    speakMotivation,
    setTimeRemaining,
  } = ctx;

  setTimeRemaining((prev) => {
    const currentPrev =
      expectedTimeRemainingRef.current !== prev
        ? expectedTimeRemainingRef.current
        : prev;

    const currentSettings = settingsRef.current;
    const isAgilityWorking =
      stateRef.current === "working" &&
      currentSettings?.mode === "agility_test";

    if (isAgilityWorking) {
      const nextVal = currentPrev + 1;
      expectedTimeRemainingRef.current = nextVal;
      return nextVal;
    }

    if (currentPrev <= 1) {
      setTimeout(advanceState, 0);
      expectedTimeRemainingRef.current = 0;
      return 0;
    }

    const shouldMotivate =
      stateRef.current === "working" &&
      currentSettings?.mode !== "agility_test" &&
      currentPrev === 16 &&
      currentSettings?.motivationEnabled;

    if (shouldMotivate) {
      speakMotivation();
    }

    const nextVal = currentPrev - 1;
    expectedTimeRemainingRef.current = nextVal;
    return nextVal;
  });
}

function _handleTick(
  deltaMs: number,
  accumulatedMsRef: React.MutableRefObject<number>,
  ctx: TickContext
) {
  const { stateRef, setActualElapsedMs } = ctx;

  if (stateRef.current === "working" || stateRef.current === "resting") {
    setActualElapsedMs((prev) => prev + deltaMs);
  }

  accumulatedMsRef.current += deltaMs;
  if (accumulatedMsRef.current >= 1000) {
    accumulatedMsRef.current -= 1000;
    _onSecondTick(ctx);
  }
}

// ─── Extracted motivation (pure, no hook deps) ────────────────────────────────

function _speakMotivation(currentPlayers: ShadowPlayer[], motivationEnabled: boolean) {
  if (!motivationEnabled) return;
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (isAudioPlaying()) return;

  if (currentPlayers.length > 0) {
    const randomPlayer = currentPlayers[Math.floor(Math.random() * currentPlayers.length)];
    if (!randomPlayer?.displayName) return;
    const firstName = randomPlayer.displayName.split(" ")[0] || "играч";
    const phrases = [
      `Давай, ${firstName}!`,
      `Още малко, ${firstName}!`,
      `Дръж стойката, ${firstName}!`,
    ];
    const text = phrases[Math.floor(Math.random() * phrases.length)];
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = "bg-BG";
    window.speechSynthesis.speak(msg);
  }
}

// ─── The hook ────────────────────────────────────────────────────────────────

export function useShadowTrainer(settings: ShadowSettings | null) {
  const [state, setState] = useState<TrainerState>("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);

  const [currentPlayersState, setCurrentPlayersState] = useState<ShadowPlayer[]>([]);
  const playCountsRef = useRef<Record<string, number>>({});
  const consecutiveFastShotsRef = useRef(0);
  const currentPlayersRef = useRef<ShadowPlayer[]>([]);
  const [agilityActionsDone, setAgilityActionsDone] = useState(0);
  const [actualElapsedMs, setActualElapsedMs] = useState(0);

  const expectedTimeRemainingRef = useRef<number>(0);
  const updateTimeRemaining = useCallback((val: number) => {
    expectedTimeRemainingRef.current = val;
    setTimeRemaining(val);
  }, []);

  const previousStateRef = useRef<TrainerState>("idle");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deceptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const centerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const isFirstActionRef = useRef(false);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
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

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const currentSetRef = useRef(currentSet);
  useEffect(() => {
    currentSetRef.current = currentSet;
  }, [currentSet]);

  const agilityActionsDoneRef = useRef(agilityActionsDone);
  useEffect(() => {
    agilityActionsDoneRef.current = agilityActionsDone;
  }, [agilityActionsDone]);

  const requestWakeLock = async () => {
    if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
      try {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request(type: string): Promise<WakeLockSentinel> } }).wakeLock.request("screen");
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

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
    if (deceptionTimeoutRef.current) clearTimeout(deceptionTimeoutRef.current);
    if (centerTimeoutRef.current) clearTimeout(centerTimeoutRef.current);
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

  const actionRefs: TriggerNextActionRefs = {
    stateRef, settingsRef, agilityActionsDoneRef, isFirstActionRef,
    consecutiveFastShotsRef, deceptionTimeoutRef, centerTimeoutRef, actionTimeoutRef,
  };

  const triggerNextAction = useCallback(() => {
    try {
      const currentSettings = settingsRef.current;
      if (!currentSettings) return;
      if (stateRef.current !== "working") return;

      const isFirst = isFirstActionRef.current;
      isFirstActionRef.current = false;

      if (currentSettings.mode === "agility_test") {
        const finished = _handleAgilityTestAction(isFirst, actionRefs, setAgilityActionsDone, cleanup);
        if (finished) { setState("finished"); return; }
      }

      const pace =
        currentSettings.mode === "ghost_match"
          ? _calculateGhostMatchPace(consecutiveFastShotsRef)
          : currentSettings.paceSec;

      const { zone, audioPath, secondAudioPath } = _resolveAudioPathsAndZone(
        currentSettings.drillMode, currentSettings.calloutMode
      );
      setActiveZone(zone);

      if (!currentSettings.visualOnly) {
        _scheduleAudio(
          isFirst, pace, audioPath, secondAudioPath,
          currentSettings.deceptionEnabled, deceptionTimeoutRef, stateRef,
          currentSettings.drillMode, currentSettings.calloutMode
        );
      }

      _scheduleNextAction(
        pace, secondAudioPath,
        currentSettings.centerCommandEnabled, currentSettings.visualOnly,
        centerTimeoutRef, actionTimeoutRef, stateRef, setActiveZone, triggerNextAction
      );
    } catch (error) {
      console.error("Error in triggerNextAction", error);
      const pace = settingsRef.current?.paceSec || 3;
      actionTimeoutRef.current = setTimeout(triggerNextAction, pace * 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup]);

  const speakMotivation = useCallback(() => {
    try {
      const currentSettings = settingsRef.current;
      _speakMotivation(currentPlayersRef.current, !!currentSettings?.motivationEnabled);
    } catch (e) {
      console.error("Speech synthesis error", e);
    }
  }, []);

  const advanceStateRefs: AdvanceStateRefs = {
    stateRef, currentSetRef, timerRef, actionTimeoutRef,
    isFirstActionRef, currentPlayersRef, playCountsRef,
  };

  const advanceState = useCallback(() => {
    const currentSettings = settingsRef.current;
    if (!currentSettings) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const phase = stateRef.current;
    if (phase === "countdown") {
      setState("working");
      _advanceFromCountdown(
        currentSettings, advanceStateRefs, updateTimeRemaining,
        setAgilityActionsDone, requestWakeLock, triggerNextAction
      );
    } else if (phase === "working") {
      setActiveZone(null);
      _advanceFromWorking(
        currentSettings, advanceStateRefs, updateTimeRemaining,
        setCurrentPlayersState, cleanup
      );
      setState(advanceStateRefs.stateRef.current);
    } else if (phase === "resting") {
      setState("countdown");
      _advanceFromResting(
        currentSettings, advanceStateRefs, updateTimeRemaining, setCurrentSet
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanup, triggerNextAction, updateTimeRemaining]);

  useEffect(() => {
    if (state === "idle" || state === "finished" || state === "paused") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const accumulatedMsRef = { current: 0 };
    let lastTick = Date.now();

    const tickCtx: TickContext = {
      expectedTimeRemainingRef,
      stateRef,
      settingsRef,
      advanceState,
      speakMotivation,
      setTimeRemaining,
      setActualElapsedMs,
    };

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTick;
      lastTick = now;
      _handleTick(deltaMs, accumulatedMsRef, tickCtx);
    }, 100);

    timerRef.current = intervalId;

    return () => {
      clearInterval(intervalId);
    };
  }, [state, advanceState, speakMotivation]);

  const startTraining = useCallback(() => {
    if (!settings) return;
    shadowAudioManager.unlock();
    stopAudio();
    requestWakeLock();
    stateRef.current = "countdown";
    setState("countdown");
    setCurrentSet(1);
    updateTimeRemaining(10);
    setAgilityActionsDone(0);
    setActualElapsedMs(0);
    if (!settings.visualOnly) {
      playAudio(AUDIO_PATHS.common.startSet);
    }
  }, [settings, updateTimeRemaining]);

  const pauseTraining = useCallback(() => {
    if (
      stateRef.current !== "paused" &&
      stateRef.current !== "idle" &&
      stateRef.current !== "finished"
    ) {
      previousStateRef.current = stateRef.current;
    }
    stateRef.current = "paused";
    setState("paused");
    stopAudio();
    cleanup();
  }, [cleanup]);

  const resumeTraining = useCallback(() => {
    if (stateRef.current === "paused") {
      const targetState = previousStateRef.current;
      stateRef.current = targetState;
      setState(targetState);
      requestWakeLock();
      if (targetState === "working") {
        actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
      }
    }
  }, [triggerNextAction]);

  const stopTraining = useCallback(() => {
    stateRef.current = "finished";
    setState("finished");
    stopAudio();
    cleanup();
  }, [cleanup]);

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
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    currentSet,
    timeRemaining,
    activeZone,
    currentRotationPlayers: currentPlayersState,
    agilityActionsDone,
    actualElapsedMs,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
  };
}
