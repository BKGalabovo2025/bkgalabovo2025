import { useCallback, useEffect, useRef, useState } from "react";

import { ShadowSettings, TrainerState } from "./types";

interface TimerOptions {
  state: TrainerState;
  settings: ShadowSettings | null;
  advanceState: () => void;
  onMotivationTick: () => void;
}

export function useShadowTimer({
  state,
  settings,
  advanceState,
  onMotivationTick,
}: TimerOptions) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [actualElapsedMs, setActualElapsedMs] = useState(0);

  const expectedTimeRemainingRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stateRef = useRef(state);
  const settingsRef = useRef(settings);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const updateTimeRemaining = useCallback((val: number) => {
    expectedTimeRemainingRef.current = val;
    setTimeRemaining(val);
  }, []);

  const syncState = useCallback((newState: TrainerState) => {
    stateRef.current = newState;
  }, []);

  const cleanupTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advanceStateRef = useRef(advanceState);
  useEffect(() => {
    advanceStateRef.current = advanceState;
  }, [advanceState]);

  const onMotivationTickRef = useRef(onMotivationTick);
  useEffect(() => {
    onMotivationTickRef.current = onMotivationTick;
  }, [onMotivationTick]);

  useEffect(() => {
    if (state === "idle" || state === "finished" || state === "paused") {
      cleanupTimer();
      return;
    }

    const accumulatedMsRef = { current: 0 };
    let lastTick = Date.now();

    const intervalId = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTick;
      lastTick = now;

      if (stateRef.current === "working" || stateRef.current === "resting") {
        setActualElapsedMs((prev) => prev + deltaMs);
      }

      accumulatedMsRef.current += deltaMs;
      if (accumulatedMsRef.current >= 1000) {
        accumulatedMsRef.current -= 1000;

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
            setTimeout(() => advanceStateRef.current(), 0);
            nextVal = 0;
          } else {
            nextVal = currentPrev - 1;
          }
        }

        const shouldMotivate =
          stateRef.current === "working" &&
          currentSettings?.mode !== "agility_test" &&
          currentPrev === 16 &&
          currentSettings?.motivationEnabled;

        if (shouldMotivate) {
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
  };
}
