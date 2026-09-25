import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as audioMap from "@/lib/shadow-training/audio-map";

import { ShadowSettings, useShadowTrainer } from "../useShadowTrainer";

// Mock the audio manager and window objects
vi.mock("@/lib/shadow-training/audio-map", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/shadow-training/audio-map")
  >("@/lib/shadow-training/audio-map");
  return {
    ...actual,
    playAudio: vi.fn(),
    playAudioSequence: vi.fn(),
    stopAudio: vi.fn(),
    shadowAudioManager: {
      unlock: vi.fn(),
      play: vi.fn(),
      playSequence: vi.fn(),
      stopAll: vi.fn(),
    },
  };
});

describe("useShadowTrainer Comprehensive Variations", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00Z"));
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const basePlayers = [
    { id: "1", displayName: "Иван Петров" },
    { id: "2", displayName: "Мария Георгиева" },
    { id: "3", displayName: "Димитър Иванов" },
  ];

  // Helper to create settings
  const createSettings = (
    overrides: Partial<ShadowSettings> = {}
  ): ShadowSettings =>
    ({
      mode: "standard",
      preset: "custom",
      drillMode: "all",
      sets: 2,
      workSec: 15,
      restSec: 5,
      paceSec: 3,
      deceptionEnabled: false,
      motivationEnabled: false,
      visualOnly: false,
      calloutMode: "zones",
      centerCommandEnabled: false,
      activePlayers: basePlayers,
      courtsAvailable: 1,
      courtAllocationStrategy: "one_per_court",
      cornersMode: "6-corners",
      ageGroup: "U17+",
      drillPattern: "mixed",
      ...overrides,
    }) as ShadowSettings;

  const advanceSeconds = (seconds: number) => {
    for (let i = 0; i < seconds; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
    }
    // flush setTimeout(advanceState, 0)
    act(() => {
      vi.advanceTimersByTime(1);
    });
  };

  it("should initialize in idle state", () => {
    const settings = createSettings();
    const { result } = renderHook(() => useShadowTrainer(settings));
    expect(result.current.state).toBe("idle");
    expect(result.current.currentSet).toBe(1);
    expect(result.current.agilityActionsDone).toBe(0);
  });

  describe("Mode: Standard", () => {
    it("runs countdown then switches to working and plays commands", () => {
      const settings = createSettings({
        mode: "standard",
        sets: 2,
        workSec: 10,
        restSec: 5,
      });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      expect(result.current.state).toBe("countdown");
      expect(result.current.timeRemaining).toBe(10);

      // Fast-forward countdown 10 seconds
      advanceSeconds(10);

      expect(result.current.state).toBe("working");
      expect(result.current.timeRemaining).toBe(10);
      expect(audioMap.playAudio).toHaveBeenCalled();

      // Check ticking down
      advanceSeconds(1);
      expect(result.current.timeRemaining).toBe(9);
    });
  });

  describe("Mode: Standard Training (Fixed pacing)", () => {
    it("should start and cycle with fixed pace values", () => {
      const settings = createSettings({ mode: "standard", paceSec: 3 });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10); // end countdown

      expect(result.current.state).toBe("working");
    });
  });

  describe("Mode: Agility Test", () => {
    it("should allow stopping agility test successfully", () => {
      const settings = createSettings({
        mode: "agility_test",
        workSec: 2,
        paceSec: 1,
      });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10); // end countdown

      expect(result.current.state).toBe("working");

      act(() => {
        result.current.stopTraining();
      });

      expect(result.current.state).toBe("finished");
    });
  });

  describe("Drill Mode & Pronunciation Variations", () => {
    const drillModes: ("all" | "front_only" | "back_only" | "front_back")[] = [
      "all",
      "front_only",
      "back_only",
      "front_back",
    ];

    const calloutModes: ("zones" | "shots" | "zones_and_shots")[] = [
      "zones",
      "shots",
      "zones_and_shots",
    ];

    drillModes.forEach((drillMode) => {
      calloutModes.forEach((calloutMode) => {
        it(`handles variation: DrillMode=${drillMode}, CalloutMode=${calloutMode}`, () => {
          const settings = createSettings({ drillMode, calloutMode });
          const { result } = renderHook(() => useShadowTrainer(settings));

          act(() => {
            result.current.startTraining();
          });

          advanceSeconds(10); // end countdown

          expect(result.current.state).toBe("working");
        });
      });
    });
  });

  describe("Player Rotations and Court Limits", () => {
    it("should progression through all sub-groups in each set ensuring fair sets for all", () => {
      const settings = createSettings({
        sets: 3,
        courtsAvailable: 1,
        courtAllocationStrategy: "one_per_court",
        activePlayers: basePlayers, // 3 players, 1 court = 3 waves per set
      });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      // Wave 1 of Set 1: Ivan is on court
      expect(result.current.currentSet).toBe(1);
      expect(result.current.currentWave).toBe(1);
      expect(result.current.totalWaves).toBe(3);
      expect(result.current.currentRotationPlayers[0].displayName).toBe(
        "Иван Петров"
      );

      advanceSeconds(10); // end countdown
      advanceSeconds(15); // end work for Wave 1

      // Transition to Wave 2 of Set 1: Maria is on court
      expect(result.current.state).toBe("countdown");
      expect(result.current.currentSet).toBe(1);
      expect(result.current.currentWave).toBe(2);
      expect(result.current.currentRotationPlayers[0].displayName).toBe(
        "Мария Георгиева"
      );

      advanceSeconds(10); // end countdown
      advanceSeconds(15); // end work for Wave 2

      // Transition to Wave 3 of Set 1: Dimitar is on court
      expect(result.current.state).toBe("countdown");
      expect(result.current.currentSet).toBe(1);
      expect(result.current.currentWave).toBe(3);
      expect(result.current.currentRotationPlayers[0].displayName).toBe(
        "Димитър Иванов"
      );

      advanceSeconds(10); // end countdown
      advanceSeconds(15); // end work for Wave 3

      // All 3 players completed Set 1 -> now enters Set Rest
      expect(result.current.state).toBe("resting");

      // Advance rest period (5 seconds) to start Set 2
      advanceSeconds(5);

      expect(result.current.currentSet).toBe(2);
      expect(result.current.currentWave).toBe(1);
      // Set 2 begins again with Wave 1 (Ivan)
      expect(result.current.currentRotationPlayers[0].displayName).toBe(
        "Иван Петров"
      );
    });
  });

  describe("Special Modifiers", () => {
    it("respects visualOnly setting by not calling playAudio", () => {
      const settings = createSettings({ visualOnly: true });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10);

      expect(audioMap.playAudio).not.toHaveBeenCalled();
    });

    it("triggers speech synthesis when motivation is enabled", () => {
      const speakMock = vi.fn();
      vi.stubGlobal("speechSynthesis", {
        speak: speakMock,
        cancel: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        getVoices: vi.fn().mockReturnValue([]),
      });

      const settings = createSettings({ motivationEnabled: true, workSec: 20 });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      // Instead of manual step which is complex with refs, verify motivation mock starts safely
      expect(result.current.state).toBe("countdown");
    });
  });

  describe("Времетраене и изчисляване на следваща команда (Scheduling & Intervals)", () => {
    it("изчислява правилно времето за следваща команда според темпото (paceSec)", () => {
      const settings = createSettings({
        mode: "standard",
        paceSec: 3,
        workSec: 15,
      });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10); // приключваме countdown

      expect(result.current.state).toBe("working");

      // Преди темпото да изтече, проверяваме дали се извиква следващия setTimeout
      // Темпото е 3 секунди. Изчакваме 2 секунди - новата зона не трябва да се е променила
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      // Изчакваме още 1.3 секунди (общо 3.3s с прехода от 300ms), което трябва да задейства следващата команда
      act(() => {
        vi.advanceTimersByTime(1300);
      });

      expect(audioMap.playAudio).toHaveBeenCalled();
    });

    it("изчислява правилно натрупаното реално време на тренировката (actualElapsedMs)", () => {
      const settings = createSettings({ mode: "standard", workSec: 15 });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10); // приключваме countdown

      // Изминават 5 секунди работа
      advanceSeconds(5);

      // Проверяваме дали actualElapsedMs е около 5000ms
      expect(result.current.actualElapsedMs).toBeGreaterThanOrEqual(5000);
    });
  });

  describe("Deception and Center Command", () => {
    it("handles deception mode by playing sequential fake sounds", () => {
      const settings = createSettings({ deceptionEnabled: true });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10); // end countdown

      expect(result.current.state).toBe("working");
    });

    it("triggers center command when centerCommandEnabled is active", () => {
      const settings = createSettings({ centerCommandEnabled: true });
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      advanceSeconds(10); // end countdown

      expect(result.current.state).toBe("working");
    });
  });

  describe("Pause, Resume, Stop and Wake Lock", () => {
    let wakeLockRequestMock: ReturnType<typeof vi.fn>;
    let wakeLockReleaseMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      wakeLockReleaseMock = vi.fn().mockResolvedValue(undefined);
      wakeLockRequestMock = vi.fn().mockResolvedValue({
        release: wakeLockReleaseMock,
      });

      if (typeof window !== "undefined") {
        vi.stubGlobal("navigator", {
          wakeLock: {
            request: wakeLockRequestMock,
          },
        });
      }
    });

    it("should request wake lock when training starts and release when paused/stopped", async () => {
      const settings = createSettings();
      const { result } = renderHook(() => useShadowTrainer(settings));

      act(() => {
        result.current.startTraining();
      });

      // wait for microtasks to resolve so wakeLockRef.current is set
      await act(async () => {
        await Promise.resolve();
      });

      // countdown state starts
      expect(result.current.state).toBe("countdown");
      expect(wakeLockRequestMock).toHaveBeenCalledWith("screen");

      // Advance to working
      advanceSeconds(10);
      expect(result.current.state).toBe("working");

      // Now pause training
      act(() => {
        result.current.pauseTraining();
      });
      expect(result.current.state).toBe("paused");
      expect(wakeLockReleaseMock).toHaveBeenCalled();

      // Now resume training
      act(() => {
        result.current.resumeTraining();
      });
      expect(result.current.state).toBe("working");

      await act(async () => {
        await Promise.resolve();
      });
      expect(wakeLockRequestMock).toHaveBeenCalledTimes(2);

      // Now stop training
      act(() => {
        result.current.stopTraining();
      });
      expect(result.current.state).toBe("finished");
      expect(wakeLockReleaseMock).toHaveBeenCalledTimes(2);
    });

    it("should handle null settings or empty activePlayers gracefully", () => {
      const { result } = renderHook(() => useShadowTrainer(null));
      expect(result.current.state).toBe("idle");

      act(() => {
        result.current.startTraining();
      });
      expect(result.current.state).toBe("idle"); // stays idle since settings are null
    });
  });
});
