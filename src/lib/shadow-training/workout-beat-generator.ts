/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Synthesizes dynamic badminton training workout beats (115-135 BPM)
 * using Web Audio API oscillators and noise buffers.
 * Completely offline, 0 external dependencies, ultra-lightweight.
 *
 * Connected directly to AudioManager's musicGainNode for smooth Audio Ducking.
 */

import { shadowLogger } from "./shadow-logger";

export type WorkoutBeatPreset =
  "electronic_128" | "energetic_135" | "ambient_115";

export interface BeatPresetConfig {
  id: WorkoutBeatPreset;
  label: string;
  bpm: number;
}

export const WORKOUT_BEAT_PRESETS: BeatPresetConfig[] = [
  { id: "electronic_128", label: "Динамичен кардио ритъм (128 BPM)", bpm: 128 },
  { id: "energetic_135", label: "Скоростен спринт ритъм (135 BPM)", bpm: 135 },
  { id: "ambient_115", label: "Умерено темпо / Техника (115 BPM)", bpm: 115 },
];

export class WorkoutBeatGenerator {
  private audioCtx: AudioContext | null = null;
  private destinationNode: GainNode | null = null;
  private isRunning = false;
  private bpm = 128;
  private currentPreset: WorkoutBeatPreset = "electronic_128";
  private stepInterval: any = null;
  private currentStep = 0; // 0 to 15 (16th notes loop)
  private noiseBuffer: AudioBuffer | null = null;

  constructor(audioCtx?: AudioContext, destinationNode?: GainNode) {
    if (audioCtx) this.audioCtx = audioCtx;
    if (destinationNode) this.destinationNode = destinationNode;
  }

  public setContext(audioCtx: AudioContext, destinationNode: GainNode) {
    this.audioCtx = audioCtx;
    this.destinationNode = destinationNode;
    this.createNoiseBuffer();
  }

  private createNoiseBuffer() {
    if (!this.audioCtx) return;
    try {
      const bufferSize = this.audioCtx.sampleRate * 0.1; // 100ms noise
      const buffer = this.audioCtx.createBuffer(
        1,
        bufferSize,
        this.audioCtx.sampleRate
      );
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    } catch {
      // ignore
    }
  }

  public start(preset: WorkoutBeatPreset = "electronic_128") {
    if (this.isRunning) this.stop();
    this.currentPreset = preset;
    const found = WORKOUT_BEAT_PRESETS.find((p) => p.id === preset);
    this.bpm = found ? found.bpm : 128;

    if (!this.audioCtx) return;
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }

    if (!this.noiseBuffer) {
      this.createNoiseBuffer();
    }

    this.isRunning = true;
    this.currentStep = 0;

    const stepTimeMs = (60 / this.bpm / 4) * 1000; // 16th note in ms

    shadowLogger.audio(
      `Workout beat started: [${this.currentPreset}] at ${this.bpm} BPM`
    );

    // Initial first beat
    this.scheduleStep(this.currentStep);
    this.currentStep = (this.currentStep + 1) % 16;

    this.stepInterval = setInterval(() => {
      if (!this.isRunning) return;
      this.scheduleStep(this.currentStep);
      this.currentStep = (this.currentStep + 1) % 16;
    }, stepTimeMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
    this.currentStep = 0;
    shadowLogger.audio("Workout beat stopped");
  }

  public getIsPlaying(): boolean {
    return this.isRunning;
  }

  public getPreset(): WorkoutBeatPreset {
    return this.currentPreset;
  }

  public getBpm(): number {
    return this.bpm;
  }

  /**
   * Schedules sound events on the 16-step grid
   * - Steps 0, 4, 8, 12: Kick drum (punchy 4-on-the-floor)
   * - Steps 2, 6, 10, 14: Offbeat Hi-hat
   * - Steps 0, 8: Sub-bass note
   */
  private scheduleStep(step: number) {
    if (!this.audioCtx || !this.destinationNode) return;
    const now = this.audioCtx.currentTime;

    // 1. Kick on downbeats (0, 4, 8, 12)
    if (step % 4 === 0) {
      this.playKick(now);
    }

    // 2. Offbeat Hi-hat (2, 6, 10, 14)
    if (step % 4 === 2) {
      this.playHiHat(now);
    }

    // 3. Sub-bass pulse on beats 0 and 8
    if (step === 0 || step === 8) {
      this.playSubBass(now, step === 0 ? 55 : 48); // A1 or G1
    }
  }

  private playKick(time: number) {
    if (!this.audioCtx || !this.destinationNode) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(42, time + 0.12);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      osc.connect(gain);
      gain.connect(this.destinationNode);

      osc.start(time);
      osc.stop(time + 0.14);
    } catch {
      // ignore
    }
  }

  private playHiHat(time: number) {
    if (!this.audioCtx || !this.destinationNode || !this.noiseBuffer) return;
    try {
      const source = this.audioCtx.createBufferSource();
      source.buffer = this.noiseBuffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.setValueAtTime(7500, time);

      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.22, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.destinationNode);

      source.start(time);
      source.stop(time + 0.05);
    } catch {
      // ignore
    }
  }

  private playSubBass(time: number, freq: number) {
    if (!this.audioCtx || !this.destinationNode) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.35, time);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.22);

      osc.connect(gain);
      gain.connect(this.destinationNode);

      osc.start(time);
      osc.stop(time + 0.22);
    } catch {
      // ignore
    }
  }
}
