"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  AUDIO_PATHS,
  ZoneId,
  getRandomZoneForMode,
  playAudio,
  shadowAudioPool,
  getRandomShotForZone,
} from "@/lib/shadow-training/audio-map";

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
  activePlayers: any[]; // The full selected players array
  courtsAvailable: number;
}

export function useShadowTrainer(settings: ShadowSettings | null) {
  const [state, setState] = useState<TrainerState>("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0); // Also used as elapsed time in agility
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);
  const [rotationGroupIndex, setRotationGroupIndex] = useState(0);
  const [agilityActionsDone, setAgilityActionsDone] = useState(0);

  // Refs for intervals, timeouts, and wake lock
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wakeLockRef = useRef<any>(null); // any because WakeLockSentinel might not be in standard DOM types

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
        wakeLockRef.current = await (navigator as any).wakeLock.request(
          "screen"
        );
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
    releaseWakeLock();
  }, []);

  const triggerNextAction = useCallback(() => {
    if (!settings) return;
    if (stateRef.current !== "working") return;

    if (settings.mode === "agility_test") {
      if (agilityActionsDoneRef.current >= 20) {
        // Stop agility test when 20 actions are done
        setState("finished");
        cleanup();
        if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.endSet);
        return;
      }
      setAgilityActionsDone((prev) => prev + 1);
    }

    // Ghost match: random pace
    const pace =
      settings.mode === "ghost_match"
        ? Math.random() * 2 + 1.5
        : settings.paceSec;
    const zone = getRandomZoneForMode(settings.drillMode);
    setActiveZone(zone);

    let audioPath = AUDIO_PATHS.zones[zone];
    let secondAudioPath: string | null = null;

    if (
      settings.calloutMode === "shots" ||
      (settings.calloutMode === "mixed" && Math.random() > 0.5)
    ) {
      audioPath = getRandomShotForZone(zone);
    } else if (settings.calloutMode === "zones_and_shots") {
      audioPath = AUDIO_PATHS.zones[zone];
      secondAudioPath = getRandomShotForZone(zone);
    }

    if (!settings.visualOnly) {
      if (settings.deceptionEnabled && Math.random() < 0.1) {
        const fakeZone = getRandomZoneForMode(settings.drillMode);
        let fakePath = AUDIO_PATHS.zones[fakeZone];
        if (
          settings.calloutMode === "shots" ||
          (settings.calloutMode === "mixed" && Math.random() > 0.5)
        ) {
          fakePath = getRandomShotForZone(fakeZone);
        } else if (settings.calloutMode === "zones_and_shots") {
          fakePath = AUDIO_PATHS.zones[fakeZone]; // Just use zone for fake
        }
        playAudio(fakePath);
        setTimeout(() => {
          if (stateRef.current !== "working") return;
          playAudio(audioPath);
          if (secondAudioPath) {
            setTimeout(() => {
              if (stateRef.current === "working") playAudio(secondAudioPath!);
            }, 800);
          }
        }, 600);
      } else {
        playAudio(audioPath);
        if (secondAudioPath) {
          setTimeout(() => {
            if (stateRef.current === "working") playAudio(secondAudioPath!);
          }, 800);
        }
      }
    }

    if (settings.centerCommandEnabled && !settings.visualOnly) {
      setTimeout(
        () => {
          if (stateRef.current === "working") {
            playAudio(AUDIO_PATHS.common.center);
          }
        },
        (pace * 1000) / 2
      );
    }

    actionTimeoutRef.current = setTimeout(() => {
      setActiveZone(null); // clear highlight
      actionTimeoutRef.current = setTimeout(triggerNextAction, 300);
    }, pace * 1000);
  }, [settings, cleanup]);

  const speakMotivation = useCallback(() => {
    if (!settings?.motivationEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const groupSize = settings.courtsAvailable || 1;
    const startIndex = rotationGroupIndex * groupSize;
    const currentPlayers = settings.activePlayers.slice(
      startIndex,
      startIndex + groupSize
    );

    if (currentPlayers.length > 0) {
      const randomPlayer =
        currentPlayers[Math.floor(Math.random() * currentPlayers.length)];
      const phrases = [
        `Давай, ${randomPlayer.displayName.split(" ")[0]}!`,
        `Още малко, ${randomPlayer.displayName.split(" ")[0]}!`,
        `Дръж стойката, ${randomPlayer.displayName.split(" ")[0]}!`,
      ];
      const text = phrases[Math.floor(Math.random() * phrases.length)];
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = "bg-BG";
      window.speechSynthesis.speak(msg);
    }
  }, [settings, rotationGroupIndex]);

  const advanceState = useCallback(() => {
    if (!settings) return;

    if (stateRef.current === "countdown") {
      setState("working");

      if (settings.mode === "agility_test") {
        setTimeRemaining(0); // count UP
        setAgilityActionsDone(0);
      } else {
        setTimeRemaining(settings.workSec); // count DOWN
      }

      if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.startSet);
      requestWakeLock();
      actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
    } else if (stateRef.current === "working") {
      cleanup();
      setActiveZone(null);

      if (
        currentSetRef.current >= settings.sets ||
        settings.mode === "agility_test"
      ) {
        setState("finished");
        if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.endSet);
      } else {
        setState("resting");
        setTimeRemaining(settings.restSec);
        if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.rest);
      }
    } else if (stateRef.current === "resting") {
      setCurrentSet((c) => c + 1);

      if (
        settings.courtsAvailable &&
        settings.activePlayers.length > settings.courtsAvailable
      ) {
        setRotationGroupIndex((prev) => {
          const maxGroups = Math.ceil(
            settings.activePlayers.length / settings.courtsAvailable
          );
          return (prev + 1) % maxGroups;
        });
      }

      setState("countdown");
      setTimeRemaining(10);
      if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.endRest);
    }
  }, [settings, cleanup, triggerNextAction]);

  useEffect(() => {
    if (state === "idle" || state === "finished" || state === "paused") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Precise timer using Date.now() to avoid drift
    let lastTick = Date.now();

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.round((now - lastTick) / 1000);
      if (deltaSec >= 1) {
        lastTick = now;

        setTimeRemaining((prev) => {
          if (
            stateRef.current === "working" &&
            settings?.mode === "agility_test"
          ) {
            return prev + 1; // Count UP
          }

          if (prev <= 1) {
            advanceState();
            return 0;
          }

          if (
            stateRef.current === "working" &&
            settings?.mode !== "agility_test" &&
            prev === 16 &&
            settings?.motivationEnabled
          ) {
            speakMotivation();
          }

          return prev - 1;
        });
      }
    }, 200); // Check more frequently to prevent drift

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, advanceState, settings, speakMotivation]);

  const startTraining = useCallback(() => {
    if (!settings) return;
    shadowAudioPool.unlock(); // Unlock audio on user gesture
    requestWakeLock();
    setState("countdown");
    setCurrentSet(1);
    setTimeRemaining(10);
    setRotationGroupIndex(0);
    setAgilityActionsDone(0);
    if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.startSet);
  }, [settings]);

  const pauseTraining = useCallback(() => {
    setState("paused");
    cleanup();
  }, [cleanup]);

  const resumeTraining = useCallback(() => {
    if (stateRef.current === "paused") {
      setState("working");
      requestWakeLock();
      actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
    }
  }, [triggerNextAction]);

  const stopTraining = useCallback(() => {
    setState("finished");
    cleanup();
  }, [cleanup]);

  const currentRotationPlayers = settings
    ? settings.activePlayers.slice(
        rotationGroupIndex * (settings.courtsAvailable || 1),
        rotationGroupIndex * (settings.courtsAvailable || 1) +
          (settings.courtsAvailable || 1)
      )
    : [];

  return {
    state,
    currentSet,
    timeRemaining,
    activeZone,
    currentRotationPlayers,
    agilityActionsDone,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining,
  };
}
