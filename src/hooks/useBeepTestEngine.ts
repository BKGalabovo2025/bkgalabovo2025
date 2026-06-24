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

// Plays a loud, piercing beep sound using the Web Audio API
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
      // Square wave is much louder and more piercing than sine wave
      osc.type = "square";
      // 1000 Hz is the standard frequency for the beep test
      osc.frequency.setValueAtTime(1000, ctx.currentTime);

      // Full volume
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      osc.start(ctx.currentTime);

      // Keep it loud for 0.4 seconds, then sharply fade out in 0.1s to avoid clicking
      gainNode.gain.setValueAtTime(1, ctx.currentTime + 0.4);
      gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Level Up beep: Long and intense, changing pitch
      osc.type = "square";
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gainNode.gain.setValueAtTime(1, ctx.currentTime);
      osc.start(ctx.currentTime);

      // Pitch jumps to signify Level Up
      osc.frequency.setValueAtTime(1300, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(1600, ctx.currentTime + 0.6);

      // Play for 1.0 second, then fade out
      gainNode.gain.setValueAtTime(1, ctx.currentTime + 1.0);
      gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 1.2);

      osc.stop(ctx.currentTime + 1.2);
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
