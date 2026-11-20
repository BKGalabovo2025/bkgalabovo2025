/* eslint-disable @typescript-eslint/no-explicit-any */
// Defines the available audio files and helper functions for Shadow Training

import { shadowLogger } from "./shadow-logger";
import {
  WorkoutBeatGenerator,
  WorkoutBeatPreset,
} from "./workout-beat-generator";

export const AUDIO_PATHS = {
  common: {
    startSet: "/shadow/common/podgotvi_se.mp3",
    podgotvi_se: "/shadow/common/podgotvi_se.mp3",
    beep: "/shadow/common/lek_podskok.mp3",
    splitStep: "/shadow/common/split_step.mp3",
    endSet: "/shadow/common/krai.mp3",
    rest: "/shadow/common/pochivka.mp3",
    endRest: "/shadow/common/krai_pochivka.mp3",
    krai_pochivka: "/shadow/common/krai_pochivka.mp3",
    center: "/shadow/common/tsentar.mp3",
  },
  zones: {
    frontForehand: "/shadow/zones/forhend_mrezha.mp3",
    midForehand: "/shadow/zones/forhend_sreda.mp3",
    backForehand: "/shadow/zones/forhend_zadna_linia.mp3",
    frontBackhand: "/shadow/zones/bekhend_mrezha.mp3",
    midBackhand: "/shadow/zones/bekhend_sreda.mp3",
    backBackhand: "/shadow/zones/bekhend_zadna_linia.mp3",
    overhead: "/shadow/zones/overhead_zadna_linia.mp3",
  },
  shots: {
    clearStraight: "/shadow/shots/dulgo_po_prava.mp3",
    clearCross: "/shadow/shots/dulgo_po_diagonal.mp3",
    smashStraight: "/shadow/shots/smach_po_prava.mp3",
    smashCross: "/shadow/shots/smach_po_diagonal.mp3",
    jumpSmashStraight: "/shadow/shots/smach_s_otskok_po_prava.mp3",
    jumpSmashCross: "/shadow/shots/smach_s_otskok_po_diagonal.mp3",
    halfSmashStraight: "/shadow/shots/polusmach_po_prava.mp3",
    halfSmashCross: "/shadow/shots/polusmach_po_diagonal.mp3",
    dropStraight: "/shadow/shots/skasiavane_prava.mp3",
    dropCross: "/shadow/shots/skasiavane_po_diagonal.mp3",
    netKill: "/shadow/shots/dobivane.mp3",
    netStraight: "/shadow/shots/kuso_prava.mp3",
    netCross: "/shadow/shots/kuso_diagonal.mp3",
    liftStraight: "/shadow/shots/iztegliane_po_prava.mp3",
    liftCross: "/shadow/shots/iztegliane_po_diagonal.mp3",
    driveStraight: "/shadow/shots/plosko_po_prava.mp3",
    driveCross: "/shadow/shots/plosko_po_diagonal.mp3",
    defense: "/shadow/shots/zashtita.mp3",
  },
};

export type ZoneId = keyof typeof AUDIO_PATHS.zones;
export type ShotId = keyof typeof AUDIO_PATHS.shots;

export const ZONE_NAMES: Record<ZoneId, string> = {
  frontForehand: "Форхенд Мрежа",
  midForehand: "Форхенд Среда",
  backForehand: "Форхенд Задна Линия",
  frontBackhand: "Бекхенд Мрежа",
  midBackhand: "Бекхенд Среда",
  backBackhand: "Бекхенд Задна Линия",
  overhead: "Оувърхед",
};

export const ZONES_ARRAY = Object.keys(AUDIO_PATHS.zones) as ZoneId[];

export function getRandomZoneForMode(
  modeType:
    | "all"
    | "front_only"
    | "back_only"
    | "forehand_only"
    | "backhand_only"
    | "front_back",
  cornersMode: "2-corners" | "4-corners" | "6-corners" = "6-corners"
): ZoneId {
  let pool = ZONES_ARRAY;

  if (cornersMode === "2-corners") {
    if (modeType === "back_only") {
      pool = ["backForehand", "backBackhand"];
    } else if (modeType === "forehand_only") {
      pool = ["frontForehand", "backForehand"];
    } else if (modeType === "backhand_only") {
      pool = ["frontBackhand", "backBackhand"];
    } else {
      pool = ["frontForehand", "frontBackhand"];
    }
  } else if (cornersMode === "4-corners") {
    pool = ["frontForehand", "frontBackhand", "backForehand", "backBackhand"];
  }

  if (modeType === "front_only") {
    pool = pool.filter((z) => z.startsWith("front"));
  } else if (modeType === "back_only") {
    pool = pool.filter((z) => z.startsWith("back") || z === "overhead");
  } else if (modeType === "forehand_only") {
    pool = pool.filter((z) => z.toLowerCase().includes("forehand"));
  } else if (modeType === "backhand_only") {
    pool = pool.filter(
      (z) => z.toLowerCase().includes("backhand") || z === "overhead"
    );
  } else if (modeType === "front_back") {
    pool = pool.filter((z) => !z.startsWith("mid"));
  }

  if (pool.length === 0) pool = ["frontForehand"];

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

const SILENT_WAV =
  "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";

class AudioManager {
  private voiceAudio: HTMLAudioElement | null = null;
  private overlayAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private targetMusicVolume = 0.7;
  private isDucked = false;
  private beatGenerator: WorkoutBeatGenerator | null = null;

  // Sequence state
  private audioSequence: string[] = [];
  private sequenceIndex = 0;
  private isPlayingSequence = false;
  private isPlayingCenter = false;
  private currentPlayId = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private pendingCenterPaths: string[] = [];
  private currentPaceSec = 3.0;
  private currentCalloutMode = "zones_and_shots";

  constructor() {
    if (typeof window !== "undefined") {
      try {
        this.voiceAudio = new Audio();
        this.voiceAudio.preload = "auto";
        this.overlayAudio = new Audio();
        this.overlayAudio.preload = "auto";
      } catch (e) {
        console.warn("Could not instantiate HTMLAudioElement", e);
      }
    }
  }

  public getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
        } catch (e) {
          console.warn("AudioContext init error:", e);
        }
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public getMusicGainNode(): GainNode | null {
    const ctx = this.getAudioContext();
    if (!ctx) return null;
    if (!this.musicGainNode) {
      try {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.targetMusicVolume, ctx.currentTime);
        gain.connect(ctx.destination);
        this.musicGainNode = gain;
      } catch {
        // ignore
      }
    }
    return this.musicGainNode;
  }

  /**
   * Ducks background music smoothly when coach voice speaks.
   * Dips music down to 20% volume within 60ms.
   */
  public duckBackgroundMusic() {
    const ctx = this.getAudioContext();
    const gain = this.getMusicGainNode();
    if (!ctx || !gain) return;

    this.isDucked = true;
    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.06);
      shadowLogger.audio(
        "Audio Ducking: Music dipped to 20% for voice command"
      );
    } catch {
      // ignore
    }
  }

  /**
   * Restores background music smoothly back to normal volume after voice command ends.
   * Ramps up back to targetVolume within 250ms.
   */
  public restoreBackgroundMusic() {
    const ctx = this.getAudioContext();
    const gain = this.getMusicGainNode();
    if (!ctx || !gain) return;

    this.isDucked = false;
    try {
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(this.targetMusicVolume, now + 0.25);
      shadowLogger.audio("Audio Ducking: Music restored to full target volume");
    } catch {
      // ignore
    }
  }

  public getBeatGenerator(): WorkoutBeatGenerator {
    if (!this.beatGenerator) {
      const ctx = this.getAudioContext();
      const musicGain = this.getMusicGainNode();
      this.beatGenerator = new WorkoutBeatGenerator(
        ctx || undefined,
        musicGain || undefined
      );
    }
    return this.beatGenerator;
  }

  public startWorkoutBeat(preset?: WorkoutBeatPreset) {
    const gen = this.getBeatGenerator();
    const ctx = this.getAudioContext();
    const gain = this.getMusicGainNode();
    if (ctx && gain) {
      gen.setContext(ctx, gain);
    }
    gen.start(preset);
  }

  public stopWorkoutBeat() {
    if (this.beatGenerator) {
      this.beatGenerator.stop();
    }
  }

  public isWorkoutBeatPlaying(): boolean {
    return this.beatGenerator?.getIsPlaying() ?? false;
  }

  public setMusicVolume(vol: number) {
    this.targetMusicVolume = Math.max(0, Math.min(1, vol));
    const ctx = this.getAudioContext();
    const gain = this.getMusicGainNode();
    if (!ctx || !gain || this.isDucked) return;
    try {
      gain.gain.setValueAtTime(this.targetMusicVolume, ctx.currentTime);
    } catch {
      // ignore
    }
  }

  /**
   * Unlock audio playback for iOS/Safari/Android upon user gesture (button click).
   */
  public unlock() {
    // 1. Resume Web Audio API context
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    shadowLogger.audio("Audio engine unlocked by coach gesture", {
      audioCtxState: ctx?.state || "none",
    });

    // 2. Unlock HTML5 Audio elements with a tiny silent WAV
    [this.voiceAudio, this.overlayAudio].forEach((audio) => {
      if (audio) {
        try {
          audio.src = SILENT_WAV;
          audio
            .play()
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
            })
            .catch(() => {});
        } catch {
          // ignore
        }
      }
    });
  }

  private isLongPhrase(path: string): boolean {
    const filename = path.split("/").pop() || "";
    return (
      filename.includes("s_otskok") ||
      filename.includes("polusmach") ||
      filename.includes("skasiavane_po_diagonal") ||
      filename.includes("iztegliane_po_diagonal") ||
      filename.includes("dulgo_po_diagonal") ||
      filename.length > 24
    );
  }

  private sequenceCompleteCallback: (() => void) | null = null;
  private currentVoiceSpeed = 1.0;

  public getPlaybackRateForPath(_path: string): number {
    return this.currentVoiceSpeed;
  }

  public setVoiceSpeed(speed?: number) {
    const rate =
      typeof speed === "number" && Number.isFinite(speed) && speed > 0
        ? Math.max(0.5, Math.min(2.0, speed))
        : 1.0;
    this.currentVoiceSpeed = rate;
    if (!this.voiceAudio) return;
    try {
      this.voiceAudio.defaultPlaybackRate = rate;
      this.voiceAudio.playbackRate = rate;
    } catch {
      // ignore
    }
  }

  private setVoiceSource(path: string) {
    if (!this.voiceAudio) return;
    const rate = this.getPlaybackRateForPath(path);
    this.voiceAudio.src = path;
    try {
      this.voiceAudio.defaultPlaybackRate = rate;
      this.voiceAudio.playbackRate = rate;
    } catch {
      // ignore
    }
  }

  public setSpeed(paceSec: number, calloutMode?: string, voiceSpeed?: number) {
    this.currentPaceSec = paceSec;
    if (calloutMode) this.currentCalloutMode = calloutMode;
    if (voiceSpeed !== undefined) {
      this.setVoiceSpeed(voiceSpeed);
      return;
    }
    // Auto-adjust playback rate if pace is fast (< 1.5s) to prevent audio overlapping
    if (paceSec < 1.5 && paceSec > 0) {
      const calculatedRate = Math.min(
        1.4,
        Math.max(1.15, Math.round((1.6 / paceSec) * 100) / 100)
      );
      this.setVoiceSpeed(calculatedRate);
      return;
    }
    if (!this.voiceAudio) return;
    try {
      this.voiceAudio.playbackRate = this.currentVoiceSpeed;
    } catch {
      // ignore
    }
  }

  public stopVoiceOnly() {
    this.isPlayingSequence = false;
    this.isPlayingCenter = false;
    this.sequenceCompleteCallback = null;
    this.audioSequence = [];
    this.sequenceIndex = 0;
    this.currentPlayId++;
    this.pendingCenterPaths = [];
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.restoreBackgroundMusic();

    if (this.voiceAudio) {
      this.voiceAudio.onended = null;
      this.voiceAudio.pause();
      this.voiceAudio.currentTime = 0;
    }
  }

  public stopAll() {
    this.isPlayingSequence = false;
    this.isPlayingCenter = false;
    this.sequenceCompleteCallback = null;
    this.audioSequence = [];
    this.sequenceIndex = 0;
    this.currentPlayId++;
    this.pendingCenterPaths = [];
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.restoreBackgroundMusic();
    this.stopWorkoutBeat();

    if (this.voiceAudio) {
      this.voiceAudio.onended = null;
      this.voiceAudio.pause();
      this.voiceAudio.currentTime = 0;
    }
    if (this.overlayAudio) {
      this.overlayAudio.pause();
      this.overlayAudio.currentTime = 0;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    shadowLogger.audio("All audio playback stopped");
  }

  public isSequencePlaying(): boolean {
    return this.isPlayingSequence;
  }

  public isCenterPlaying(): boolean {
    if (!this.isPlayingCenter) return false;
    if (this.voiceAudio && (this.voiceAudio.paused || this.voiceAudio.ended)) {
      this.isPlayingCenter = false;
      return false;
    }
    return true;
  }

  public isPlaying(): boolean {
    if (this.voiceAudio && (this.voiceAudio.paused || this.voiceAudio.ended)) {
      this.isPlayingCenter = false;
    }
    if (this.isPlayingSequence) return true;
    if (this.isPlayingCenter) return true;
    if (
      this.voiceAudio &&
      !this.voiceAudio.paused &&
      !this.voiceAudio.ended &&
      this.voiceAudio.currentTime > 0
    )
      return true;
    return false;
  }

  private startSequenceInternal(paths: string[], playId: number) {
    if (!this.voiceAudio || paths.length === 0) {
      if (this.sequenceCompleteCallback && this.currentPlayId === playId) {
        const cb = this.sequenceCompleteCallback;
        this.sequenceCompleteCallback = null;
        cb();
      }
      return;
    }
    this.duckBackgroundMusic();
    this.isPlayingSequence = true;
    this.isPlayingCenter = false;
    this.audioSequence = paths;
    this.sequenceIndex = 0;
    this.attachOnEnded(playId);
    this.setVoiceSource(paths[0]);
    shadowLogger.audio(
      `Starting voice sequence (step 1/${paths.length}): ${paths[0]}`,
      { sequence: paths, playbackRate: this.voiceAudio.playbackRate }
    );
    this.voiceAudio.play().catch((err) => {
      if (err.name === "AbortError") {
        // Interrupted by pause/stop or next voice command - normal browser behavior
        return;
      }
      shadowLogger.warn(
        "Voice playback rejected, falling back to synthetic beep",
        err
      );
      this.isPlayingSequence = false;
      this.playSyntheticBeep(800, 0.1);
      if (this.sequenceCompleteCallback && this.currentPlayId === playId) {
        const cb = this.sequenceCompleteCallback;
        this.sequenceCompleteCallback = null;
        cb();
      }
    });
  }

  private attachOnEnded(playId: number) {
    if (!this.voiceAudio) return;
    this.voiceAudio.onended = () => {
      if (this.currentPlayId !== playId) return;

      this.sequenceIndex++;
      if (
        this.sequenceIndex < this.audioSequence.length &&
        this.isPlayingSequence
      ) {
        // Next word in sequence — play after 30ms for snappy, natural coach delivery
        const pauseMs = 30;
        this.timeoutId = setTimeout(() => {
          if (this.currentPlayId !== playId || !this.isPlayingSequence) return;
          const nextSrc = this.audioSequence[this.sequenceIndex];
          this.setVoiceSource(nextSrc);
          shadowLogger.audio(
            `Voice sequence step ${this.sequenceIndex + 1}/${this.audioSequence.length}: ${nextSrc}`,
            { playbackRate: this.voiceAudio!.playbackRate }
          );
          this.voiceAudio!.play().catch((e) => {
            if (e.name !== "AbortError") {
              shadowLogger.warn("Failed step in sequence, aborted", e);
              this.isPlayingSequence = false;
              if (
                this.sequenceCompleteCallback &&
                this.currentPlayId === playId
              ) {
                const cb = this.sequenceCompleteCallback;
                this.sequenceCompleteCallback = null;
                cb();
              }
            }
          });
        }, pauseMs);
      } else {
        // Sequence finished
        this.isPlayingSequence = false;
        shadowLogger.audio("Voice sequence completed successfully");

        // If recovery commands (e.g. Center, then Леко подскачане) are waiting, play them cleanly
        if (this.pendingCenterPaths.length > 0) {
          const recoveryList = [...this.pendingCenterPaths];
          this.pendingCenterPaths = [];
          this.timeoutId = setTimeout(() => {
            if (this.isPlayingSequence) return;
            this.playVoiceSequence(
              recoveryList,
              this.sequenceCompleteCallback || undefined
            );
          }, 35);
        } else if (
          this.sequenceCompleteCallback &&
          this.currentPlayId === playId
        ) {
          const cb = this.sequenceCompleteCallback;
          this.sequenceCompleteCallback = null;
          this.restoreBackgroundMusic();
          cb();
        } else {
          this.restoreBackgroundMusic();
        }
      }
    };
  }

  /**
   * Starts a voice sequence immediately, interrupting any prior command.
   */
  public playVoiceSequence(paths: string[], onComplete?: () => void) {
    if (!this.voiceAudio || paths.length === 0) {
      onComplete?.();
      return;
    }

    // A new corner/shot command ALWAYS interrupts old commands with 0 latency
    this.currentPlayId++;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.pendingCenterPaths = [];
    this.isPlayingCenter = false;
    this.sequenceCompleteCallback = onComplete || null;
    this.startSequenceInternal(paths, this.currentPlayId);
  }

  public queueAfterSequence(paths: string | string[]) {
    const list = Array.isArray(paths) ? paths : [paths];
    if (!this.isPlaying()) {
      // Nothing playing right now — play immediately
      this.playVoiceSequence(list);
    } else {
      // Queue after the current active sequence finishes
      shadowLogger.audio(
        `Queued recovery cue for after active sequence: ${list.join(" + ")}`
      );
      this.pendingCenterPaths = list;
    }
  }

  public playVoice(path: string) {
    if (!this.voiceAudio) return;
    this.isPlayingSequence = false;
    this.isPlayingCenter = false;
    this.pendingCenterPaths = [];
    this.currentPlayId++;
    if (this.timeoutId) clearTimeout(this.timeoutId);

    this.voiceAudio.onended = () => {
      this.restoreBackgroundMusic();
    };
    this.duckBackgroundMusic();
    this.setVoiceSource(path);
    shadowLogger.audio(`Single voice command: ${path}`, {
      playbackRate: this.voiceAudio.playbackRate,
    });
    this.voiceAudio.play().catch((err) => {
      if (err.name === "AbortError") {
        // Interrupted by pause/stop or next voice command - normal browser behavior
        return;
      }
      shadowLogger.warn(
        "Voice command rejected, fallback to synthetic beep",
        err
      );
      this.playSyntheticBeep(700, 0.12);
    });
  }

  public playOverlay(path: string) {
    if (!this.overlayAudio) {
      shadowLogger.warn("Overlay audio element missing, synthetic beep");
      this.playSyntheticBeep(900, 0.08);
      return;
    }
    this.overlayAudio.src = path;
    shadowLogger.audio(`Overlay sound (split-step/hop): ${path}`);
    this.overlayAudio.play().catch((err) => {
      if (err.name === "AbortError") {
        return;
      }
      shadowLogger.warn("Overlay sound rejected, synthetic beep", err);
      this.playSyntheticBeep(900, 0.08);
    });
  }

  public playSyntheticBeep(
    freq = 800,
    duration = 0.09,
    type: OscillatorType = "sine"
  ) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      shadowLogger.audio(`Synthetic Web Audio Beep: ${freq}Hz (${duration}s)`, {
        type,
      });

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // ignore
    }
  }

  /**
   * Plays a Beep-Test style countdown beep:
   * 3, 2, 1 -> 650Hz pitch (0.12s)
   * 0 (Start) -> 1200Hz pitch (0.40s)
   */
  public playCountdownBeep(secondsRemaining: number) {
    if (secondsRemaining <= 0) {
      // Start of set (high-pitched start blast)
      this.playSyntheticBeep(1200, 0.4, "triangle");
    } else if (secondsRemaining <= 3) {
      // 3-2-1 preparation beep
      this.playSyntheticBeep(650, 0.12, "sine");
    }
  }

  /**
   * Synthesizes a loud, crisp referee whistle or end-of-set gong
   * using dual frequency oscillators (2850Hz + 3120Hz).
   */
  public playWhistle(duration = 0.35) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      shadowLogger.audio(`Referee Whistle sound played (${duration}s)`);

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(2850, now);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(3120, now);

      gainNode.gain.setValueAtTime(0.0, now);
      gainNode.gain.linearRampToValueAtTime(0.45, now + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {
      // ignore
    }
  }
}

// Global singleton registry to prevent duplicate Audio instances during Hot Module Replacement (HMR)
const getAudioManager = (): AudioManager => {
  if (typeof window === "undefined") {
    return {} as any;
  }
  const globalWithAudio = globalThis as any;
  if (!globalWithAudio.__shadowAudioManager__) {
    globalWithAudio.__shadowAudioManager__ = new AudioManager();
  }
  return globalWithAudio.__shadowAudioManager__;
};

export const shadowAudioManager = getAudioManager();

export function playAudio(path: string) {
  if (path === AUDIO_PATHS.common.center) {
    shadowAudioManager.queueAfterSequence(path);
  } else {
    shadowAudioManager.playVoice(path);
  }
}

export const playSingleAudio = playAudio;

export async function playSoundCheck(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    shadowAudioManager.unlock?.();
    if (typeof shadowAudioManager.playVoice === "function") {
      shadowAudioManager.playVoice(AUDIO_PATHS.common.podgotvi_se);
    } else if (typeof (shadowAudioManager as any).play === "function") {
      (shadowAudioManager as any).play(AUDIO_PATHS.common.podgotvi_se);
    } else {
      playAudio(AUDIO_PATHS.common.podgotvi_se);
    }
    return true;
  } catch (err) {
    shadowLogger.warn("Sound check failed", err);
    return false;
  }
}

export function queueRecoveryAudio(paths: string | string[]) {
  shadowAudioManager.queueAfterSequence(paths);
}

export function playAudioSequence(paths: string[], onComplete?: () => void) {
  shadowAudioManager.playVoiceSequence(paths, onComplete);
}

export function stopAudio() {
  shadowAudioManager.stopAll();
}

export function stopVoiceAudio() {
  shadowAudioManager.stopVoiceOnly();
}

export function isAudioPlaying(): boolean {
  return shadowAudioManager.isPlaying();
}

export function isAudioSequencePlaying(): boolean {
  return shadowAudioManager.isSequencePlaying();
}

export function isCenterAudioPlaying(): boolean {
  return shadowAudioManager.isCenterPlaying();
}

export function playCountdownBeep(secondsRemaining: number) {
  shadowAudioManager.playCountdownBeep(secondsRemaining);
}

export function playWhistle(duration?: number) {
  shadowAudioManager.playWhistle(duration);
}

export function setPlaybackPace(
  paceSec: number,
  calloutMode?: string,
  voiceSpeed?: number
) {
  shadowAudioManager.setSpeed(paceSec, calloutMode, voiceSpeed);
}

const SHOTS_BY_ZONE_GROUP = {
  front: [
    "netKill",
    "netStraight",
    "netCross",
    "liftStraight",
    "liftCross",
  ] as ShotId[],
  mid: ["driveStraight", "driveCross", "defense"] as ShotId[],
  back: [
    "clearStraight",
    "clearCross",
    "smashStraight",
    "smashCross",
    "jumpSmashStraight",
    "jumpSmashCross",
    "halfSmashStraight",
    "halfSmashCross",
    "dropStraight",
    "dropCross",
  ] as ShotId[],
};

export function getRandomShotForZone(zone: ZoneId): string {
  let shots: ShotId[] = [];
  if (zone.startsWith("front")) {
    shots = SHOTS_BY_ZONE_GROUP.front;
  } else if (zone.startsWith("mid")) {
    shots = SHOTS_BY_ZONE_GROUP.mid;
  } else {
    shots = SHOTS_BY_ZONE_GROUP.back;
  }
  const randomShotId = shots[Math.floor(Math.random() * shots.length)];
  return AUDIO_PATHS.shots[randomShotId];
}

const preloadedUrlsCache = new Set<string>();

export function clearPreloadedAudioCache() {
  preloadedUrlsCache.clear();
}

export function preloadAudioForSettings(settings: any) {
  if (typeof window === "undefined" || !settings || settings.visualOnly) return;

  const urlsToFetch = new Set<string>();

  // Common sounds
  urlsToFetch.add(AUDIO_PATHS.common.startSet);
  urlsToFetch.add(AUDIO_PATHS.common.beep);
  urlsToFetch.add(AUDIO_PATHS.common.splitStep);
  urlsToFetch.add(AUDIO_PATHS.common.endSet);
  urlsToFetch.add(AUDIO_PATHS.common.rest);
  urlsToFetch.add(AUDIO_PATHS.common.endRest);
  if (settings.centerCommandEnabled) {
    urlsToFetch.add(AUDIO_PATHS.common.center);
  }

  // Zones based on drillMode
  const zonesToLoad = (Object.keys(AUDIO_PATHS.zones) as ZoneId[]).filter(
    (z) => {
      if (settings.drillMode === "all") return true;
      if (settings.drillMode === "front_only" && z.startsWith("front"))
        return true;
      if (
        settings.drillMode === "back_only" &&
        (z.startsWith("back") || z === "overhead")
      )
        return true;
      if (
        settings.drillMode === "forehand_only" &&
        z.toLowerCase().includes("forehand")
      )
        return true;
      if (
        settings.drillMode === "backhand_only" &&
        (z.toLowerCase().includes("backhand") || z === "overhead")
      )
        return true;
      if (settings.drillMode === "front_back" && !z.startsWith("mid"))
        return true;
      return false;
    }
  );

  zonesToLoad.forEach((z) => {
    if (settings.calloutMode !== "shots") {
      urlsToFetch.add(AUDIO_PATHS.zones[z]);
    }
    if (settings.calloutMode !== "zones") {
      let zoneGroup: "front" | "mid" | "back" = "front";
      if (z.startsWith("mid")) zoneGroup = "mid";
      if (z.startsWith("back") || z === "overhead") zoneGroup = "back";

      SHOTS_BY_ZONE_GROUP[zoneGroup].forEach((shot) => {
        urlsToFetch.add(AUDIO_PATHS.shots[shot]);
      });
    }
  });

  const newUrlsToFetch = Array.from(urlsToFetch).filter(
    (url) => !preloadedUrlsCache.has(url)
  );

  if (newUrlsToFetch.length === 0) return;

  shadowLogger.audio(
    `Preloading ${newUrlsToFetch.length} audio files for drill configuration`,
    {
      calloutMode: settings.calloutMode,
      drillMode: settings.drillMode,
      sampleUrls: newUrlsToFetch.slice(0, 5),
    }
  );

  newUrlsToFetch.forEach((url) => {
    preloadedUrlsCache.add(url);
    fetch(url).catch(() => {});
  });
}
