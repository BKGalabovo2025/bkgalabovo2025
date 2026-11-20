import { describe, expect, it, vi } from "vitest";

import {
  WORKOUT_BEAT_PRESETS,
  WorkoutBeatGenerator,
} from "../workout-beat-generator";

describe("WorkoutBeatGenerator", () => {
  it("initializes with presets correctly", () => {
    expect(WORKOUT_BEAT_PRESETS).toHaveLength(3);
    expect(WORKOUT_BEAT_PRESETS[0].bpm).toBe(128);
    expect(WORKOUT_BEAT_PRESETS[1].bpm).toBe(135);
    expect(WORKOUT_BEAT_PRESETS[2].bpm).toBe(115);
  });

  it("handles start, stop and status checks safely without audio context in tests", () => {
    const generator = new WorkoutBeatGenerator();
    expect(generator.getIsPlaying()).toBe(false);

    generator.start("electronic_128");
    expect(generator.getPreset()).toBe("electronic_128");
    expect(generator.getBpm()).toBe(128);

    generator.stop();
    expect(generator.getIsPlaying()).toBe(false);
  });

  it("schedules steps when audio context is mocked", () => {
    const mockGain = {
      connect: vi.fn(),
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
    };

    const mockOsc = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };

    const mockCtx = {
      currentTime: 10,
      state: "running",
      sampleRate: 44100,
      createOscillator: vi.fn().mockReturnValue(mockOsc),
      createGain: vi.fn().mockReturnValue(mockGain),
      createBuffer: vi.fn().mockReturnValue({
        getChannelData: vi.fn().mockReturnValue(new Float32Array(100)),
      }),
      createBufferSource: vi.fn().mockReturnValue({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }),
      createBiquadFilter: vi.fn().mockReturnValue({
        type: "highpass",
        frequency: { setValueAtTime: vi.fn() },
        connect: vi.fn(),
      }),
      destination: {},
    } as unknown as AudioContext;

    const generator = new WorkoutBeatGenerator(
      mockCtx,
      mockGain as unknown as GainNode
    );
    generator.start("energetic_135");

    expect(generator.getIsPlaying()).toBe(true);
    expect(generator.getBpm()).toBe(135);
    expect(mockCtx.createOscillator).toHaveBeenCalled();

    generator.stop();
    expect(generator.getIsPlaying()).toBe(false);
  });
});
