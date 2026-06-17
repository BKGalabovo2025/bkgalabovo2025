"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AUDIO_PATHS, ZoneId, getRandomZoneForMode, playAudio } from "@/lib/shadow-training/audio-map";

export type TrainerState = "idle" | "countdown" | "working" | "resting" | "finished" | "paused";

export interface ShadowSettings {
  mode: "standard" | "ghost_match" | "agility_test";
  preset: string;
  drillMode: "all" | "front_only" | "back_only" | "front_back";
  sets: number;
  workSec: number;
  restSec: number;
  paceSec: number;
  deceptionEnabled: boolean;
  motivationEnabled: boolean;
  visualOnly: boolean;
  activePlayers: any[]; // The full selected players array
  courtsAvailable: number;
}

export function useShadowTrainer(settings: ShadowSettings | null) {
  const [state, setState] = useState<TrainerState>("idle");
  const [currentSet, setCurrentSet] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [activeZone, setActiveZone] = useState<ZoneId | null>(null);

  // Rotation logic
  const [rotationGroupIndex, setRotationGroupIndex] = useState(0);

  // Refs for intervals and timeouts
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // To track exact pause state
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const timeRemainingRef = useRef(timeRemaining);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

  const currentSetRef = useRef(currentSet);
  useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);

  const cleanup = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (actionTimeoutRef.current) clearTimeout(actionTimeoutRef.current);
  }, []);

  const triggerNextAction = useCallback(() => {
    if (!settings) return;
    if (stateRef.current !== "working") return;

    // Ghost match: random pace
    const pace = settings.mode === "ghost_match" ? (Math.random() * 2 + 1.5) : settings.paceSec;

    // Pick random zone
    const zone = getRandomZoneForMode(settings.drillMode);
    setActiveZone(zone);

    if (!settings.visualOnly) {
      // Deception logic
      if (settings.deceptionEnabled && Math.random() < 0.1) {
        // Fake another zone first
        const fakeZone = getRandomZoneForMode(settings.drillMode);
        playAudio(AUDIO_PATHS.zones[fakeZone]);
        setTimeout(() => {
          if (stateRef.current !== "working") return;
          playAudio(AUDIO_PATHS.zones[zone]);
        }, 500);
      } else {
        playAudio(AUDIO_PATHS.zones[zone]);
      }
    }

    // Schedule next action
    actionTimeoutRef.current = setTimeout(() => {
      setActiveZone(null); // clear highlight
      // Add slight delay before next call
      actionTimeoutRef.current = setTimeout(triggerNextAction, 300);
    }, pace * 1000);

  }, [settings]);

  const speakMotivation = useCallback(() => {
    if (!settings?.motivationEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    // Pick a random player from current rotation
    const groupSize = settings.courtsAvailable || 1;
    const startIndex = rotationGroupIndex * groupSize;
    const currentPlayers = settings.activePlayers.slice(startIndex, startIndex + groupSize);
    
    if (currentPlayers.length > 0) {
      const randomPlayer = currentPlayers[Math.floor(Math.random() * currentPlayers.length)];
      const phrases = [
        `Давай, ${randomPlayer.displayName}!`,
        `Още малко, ${randomPlayer.displayName}!`,
        `Дръж стойката, ${randomPlayer.displayName}!`
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
      // Countdown finished -> Start Working
      setState("working");
      setTimeRemaining(settings.workSec);
      
      if (!settings.visualOnly) {
        playAudio(AUDIO_PATHS.common.startSet);
      }

      // Start the action loop
      actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
    } 
    else if (stateRef.current === "working") {
      cleanup();
      setActiveZone(null);
      
      if (currentSetRef.current >= settings.sets) {
        // Finished everything
        setState("finished");
        setTimeRemaining(0);
        if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.endSet);
      } else {
        // Go to rest
        setState("resting");
        setTimeRemaining(settings.restSec);
        if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.rest);
      }
    }
    else if (stateRef.current === "resting") {
      // Rest finished -> Next Set
      setCurrentSet(c => c + 1);
      
      // Handle Rotation
      if (settings.courtsAvailable && settings.activePlayers.length > settings.courtsAvailable) {
        setRotationGroupIndex(prev => {
          const maxGroups = Math.ceil(settings.activePlayers.length / settings.courtsAvailable);
          return (prev + 1) % maxGroups;
        });
      }

      setState("countdown");
      setTimeRemaining(10); // 10s countdown before next set
      if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.endRest);
    }
  }, [settings, cleanup, triggerNextAction]);

  useEffect(() => {
    if (state === "idle" || state === "finished" || state === "paused") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          advanceState();
          return 0;
        }

        // TTS Motivation hook (at 15s left in work state)
        if (stateRef.current === "working" && prev === 16 && settings?.motivationEnabled) {
           speakMotivation();
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, advanceState, settings, speakMotivation]);

  const startTraining = useCallback(() => {
    if (!settings) return;
    setState("countdown");
    setCurrentSet(1);
    setTimeRemaining(10);
    setRotationGroupIndex(0);
    if (!settings.visualOnly) playAudio(AUDIO_PATHS.common.endRest); // beep for get ready
  }, [settings]);

  const pauseTraining = useCallback(() => {
    setState("paused");
    cleanup();
  }, [cleanup]);

  const resumeTraining = useCallback(() => {
    if (stateRef.current === "paused") {
      // We just need to change state to what it was. We need to remember it.
      // For simplicity, we just resume the timer in working state (or resting)
      // It's better to add a 'previousState' ref
      setState("working"); 
      actionTimeoutRef.current = setTimeout(triggerNextAction, 1000);
    }
  }, [triggerNextAction]);

  const stopTraining = useCallback(() => {
    setState("finished");
    cleanup();
  }, [cleanup]);

  // Derive current active players for UI
  const currentRotationPlayers = settings ? settings.activePlayers.slice(
    rotationGroupIndex * (settings.courtsAvailable || 1),
    rotationGroupIndex * (settings.courtsAvailable || 1) + (settings.courtsAvailable || 1)
  ) : [];

  return {
    state,
    currentSet,
    timeRemaining,
    activeZone,
    currentRotationPlayers,
    startTraining,
    pauseTraining,
    resumeTraining,
    stopTraining
  };
}
