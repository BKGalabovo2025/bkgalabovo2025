import { useState, useEffect, useRef, useCallback } from "react";

export interface BeepTestState {
  level: number;
  shuttle: number;
  speedKmH: number;
  totalTimeMs: number;
  isPlaying: boolean;
  isFinished: boolean;
  timeToNextBeep: number;
}

const SHUTTLES_PER_LEVEL = [
  0, 7, 8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16,
  16,
];

// Plays a short beep sound using the Web Audio API
const playBeep = (type: "normal" | "levelUp" = "normal") => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof window.AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "normal") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      osc.start();
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        ctx.currentTime + 0.5
      );
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Level Up triple beep
      osc.type = "square";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      osc.start();

      // We will just do a longer higher pitch for level up for simplicity
      osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(
        0.00001,
        ctx.currentTime + 1.0
      );
      osc.stop(ctx.currentTime + 1.0);
    }
  } catch (e) {
    console.error("Audio API error", e);
  }
};

export function useBeepTestEngine() {
  const [state, setState] = useState<BeepTestState>({
    level: 1,
    shuttle: 1,
    speedKmH: 8.5,
    totalTimeMs: 0,
    isPlaying: false,
    isFinished: false,
    timeToNextBeep: 0,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const nextBeepTimeRef = useRef<number>(0);

  const calculateShuttleTimeMs = (level: number) => {
    const speed = 8.0 + level * 0.5; // Level 1 = 8.5, Level 2 = 9.0
    const mps = speed / 3.6;
    return (20 / mps) * 1000;
  };

  const tick = useCallback(() => {
    if (!state.isPlaying) return;

    const now = Date.now();
    const elapsedTotal = now - startTimeRef.current;
    const timeRemaining = nextBeepTimeRef.current - now;

    if (timeRemaining <= 0) {
      // BEEP!
      setState((prev) => {
        let newShuttle = prev.shuttle + 1;
        let newLevel = prev.level;
        let isLevelUp = false;

        const maxShuttles = SHUTTLES_PER_LEVEL[prev.level] || 16;

        if (newShuttle > maxShuttles) {
          newLevel++;
          newShuttle = 1;
          isLevelUp = true;
        }

        if (newLevel >= SHUTTLES_PER_LEVEL.length) {
          playBeep("levelUp");
          return {
            ...prev,
            isPlaying: false,
            isFinished: true,
            totalTimeMs: elapsedTotal,
            timeToNextBeep: 0,
          };
        }

        playBeep(isLevelUp ? "levelUp" : "normal");

        const newSpeed = 8.0 + newLevel * 0.5;
        const shuttleTimeMs = calculateShuttleTimeMs(newLevel);

        // Compensate for any drift
        nextBeepTimeRef.current = nextBeepTimeRef.current + shuttleTimeMs;

        return {
          ...prev,
          level: newLevel,
          shuttle: newShuttle,
          speedKmH: newSpeed,
          totalTimeMs: elapsedTotal,
          timeToNextBeep: shuttleTimeMs,
        };
      });
    } else {
      // Just update times
      setState((prev) => ({
        ...prev,
        totalTimeMs: elapsedTotal,
        timeToNextBeep: timeRemaining,
      }));
    }

    timerRef.current = setTimeout(tick, 50); // High frequency check for accuracy
  }, [state.isPlaying]);

  useEffect(() => {
    if (state.isPlaying) {
      timerRef.current = setTimeout(tick, 50);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [state.isPlaying, tick]);

  const start = () => {
    if (state.isFinished) return;
    playBeep("levelUp"); // Start sound
    startTimeRef.current = Date.now() - state.totalTimeMs;

    if (state.timeToNextBeep === 0) {
      nextBeepTimeRef.current =
        Date.now() + calculateShuttleTimeMs(state.level);
    } else {
      nextBeepTimeRef.current = Date.now() + state.timeToNextBeep;
    }

    setState((prev) => ({ ...prev, isPlaying: true }));
  };

  const pause = () => {
    setState((prev) => ({ ...prev, isPlaying: false }));
  };

  const reset = () => {
    setState({
      level: 1,
      shuttle: 1,
      speedKmH: 8.5,
      totalTimeMs: 0,
      isPlaying: false,
      isFinished: false,
      timeToNextBeep: 0,
    });
  };

  return { state, start, pause, reset };
}
