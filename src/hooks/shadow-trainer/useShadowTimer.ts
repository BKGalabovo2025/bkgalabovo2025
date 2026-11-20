import { useCallback, useEffect, useRef, useState } from "react";

import {
  AUDIO_PATHS,
  playAudio as playSingleAudio,
  playCountdownBeep,
} from "@/lib/shadow-training/audio-map";
import { shadowLogger } from "@/lib/shadow-training/shadow-logger";

import { ShadowSettings, TrainerState } from "./types";

interface TimerOptions {
  state: TrainerState;
  settings: ShadowSettings | null;
  advanceState: () => void;
  onMotivationTick: () => void;
  onCountdownReady?: () => void;
}

export function useShadowTimer({
  state,
  settings,
  advanceState,
  onMotivationTick,
  onCountdownReady,
}: TimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [actualElapsedMs, setActualElapsedMsState] = useState(0);

  const expectedTimeRemainingRef = useRef(0);
  const actualElapsedMsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stateRef = useRef(state);
  const settingsRef = useRef(settings);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const setActualElapsedMs = useCallback((val: number) => {
    actualElapsedMsRef.current = val;
    setActualElapsedMsState(val);
  }, []);

  const updateTimeRemaining = useCallback((val: number) => {
    expectedTimeRemainingRef.current = val;
    setTimeRemaining(val);
  }, []);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const syncState = useCallback((newState: TrainerState) => {
    stateRef.current = newState;
    if (newState === "finished" || newState === "paused") {
      setActualElapsedMsState(actualElapsedMsRef.current);
    }
  }, []);

  const pause = useCallback(() => {
    cleanupTimer();
    setActualElapsedMsState(actualElapsedMsRef.current);
  }, [cleanupTimer]);

  const stop = useCallback(() => {
    cleanupTimer();
    setActualElapsedMsState(actualElapsedMsRef.current);
  }, [cleanupTimer]);

  const reset = useCallback(() => {
    cleanupTimer();
    stateRef.current = "idle";
    expectedTimeRemainingRef.current = 0;
    setTimeRemaining(0);
    actualElapsedMsRef.current = 0;
    setActualElapsedMsState(0);
  }, [cleanupTimer]);

  const getTimeRemaining = useCallback(() => {
    return expectedTimeRemainingRef.current;
  }, []);

  const advanceStateRef = useRef(advanceState);
  useEffect(() => {
    advanceStateRef.current = advanceState;
  }, [advanceState]);

  const onMotivationTickRef = useRef(onMotivationTick);
  useEffect(() => {
    onMotivationTickRef.current = onMotivationTick;
  }, [onMotivationTick]);

  const onCountdownReadyRef = useRef(onCountdownReady);
  useEffect(() => {
    onCountdownReadyRef.current = onCountdownReady;
  }, [onCountdownReady]);

  useEffect(() => {
    if (state === "idle" || state === "finished" || state === "paused") {
      cleanupTimer();
      if (state === "finished" || state === "paused") {
        setActualElapsedMsState(actualElapsedMsRef.current);
      }
      return;
    }

    const accumulatedMsRef = { current: 0 };
    let lastTick = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTick;
      lastTick = now;

      if (stateRef.current === "working" || stateRef.current === "resting") {
        actualElapsedMsRef.current += deltaMs;
      }

      accumulatedMsRef.current += deltaMs;
      if (accumulatedMsRef.current >= 1000) {
        accumulatedMsRef.current -= 1000;

        if (stateRef.current === "working" || stateRef.current === "resting") {
          setActualElapsedMsState(actualElapsedMsRef.current);
        }

        const currentPrev = expectedTimeRemainingRef.current;
        const currentSettings = settingsRef.current;
        const isAgilityWorking =
          stateRef.current === "working" &&
          currentSettings?.mode === "agility_test";

        let nextVal: number;
        if (isAgilityWorking) {
          nextVal = currentPrev + 1;
        } else {
          if (currentPrev <= 1) {
            shadowLogger.timer(
              `Timer finished for phase [${stateRef.current}], advancing state`
            );
            if (
              stateRef.current === "countdown" &&
              !currentSettings?.visualOnly
            ) {
              playCountdownBeep(0);
            }
            setTimeout(() => advanceStateRef.current(), 0);
            nextVal = 0;
          } else {
            nextVal = currentPrev - 1;
            if (stateRef.current === "countdown") {
              shadowLogger.timer(`Countdown: ${nextVal}s`);
              if (
                nextVal <= 3 &&
                nextVal >= 1 &&
                !currentSettings?.visualOnly
              ) {
                playCountdownBeep(nextVal);
              }
              if (nextVal === 2 && onCountdownReadyRef.current) {
                onCountdownReadyRef.current();
              }
            } else {
              if (
                stateRef.current === "resting" &&
                nextVal === 5 &&
                !currentSettings?.visualOnly
              ) {
                playSingleAudio(AUDIO_PATHS.common.krai_pochivka);
              }
              if (
                stateRef.current === "resting" &&
                nextVal <= 3 &&
                nextVal >= 1 &&
                !currentSettings?.visualOnly
              ) {
                playCountdownBeep(nextVal);
              }
              if (nextVal % 5 === 0 || nextVal <= 3) {
                shadowLogger.timer(
                  `Phase [${stateRef.current}]: ${nextVal}s remaining`
                );
              }
            }
          }
        }

        const shouldMotivate =
          stateRef.current === "working" &&
          currentSettings?.mode !== "agility_test" &&
          currentPrev === 16 &&
          currentSettings?.motivationEnabled;

        if (shouldMotivate) {
          shadowLogger.timer(
            "Motivation cue triggered at 15s remaining threshold"
          );
          onMotivationTickRef.current();
        }

        expectedTimeRemainingRef.current = nextVal;
        setTimeRemaining(nextVal);
      }
    }, 100);

    timerRef.current = intervalId;

    return cleanupTimer;
  }, [state, cleanupTimer]);

  return {
    timeRemaining,
    actualElapsedMs,
    updateTimeRemaining,
    syncState,
    setActualElapsedMs,
    cleanupTimer,
    getTimeRemaining,
    pause,
    stop,
    reset,
  };
}
