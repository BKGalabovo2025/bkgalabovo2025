/* eslint-disable @typescript-eslint/no-explicit-any */
// Defines the available audio files and helper functions for Shadow Training

export const AUDIO_PATHS = {
  common: {
    startSet: "/shadow/common/podgotvi_se.mp3",
    beep: "/shadow/common/lek_podskok.mp3", // Synthentic or light beep
    splitStep: "/shadow/common/split_step.mp3", // NEW: Split step command ("Хоп")
    endSet: "/shadow/common/krai.mp3",
    rest: "/shadow/common/pochivka.mp3",
    endRest: "/shadow/common/krai_pochivka.mp3",
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
type ShotId = keyof typeof AUDIO_PATHS.shots;

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getRandomZone(): ZoneId {
  const index = Math.floor(Math.random() * ZONES_ARRAY.length);
  return ZONES_ARRAY[index];
}

export function getRandomZoneForMode(
  modeType: "all" | "front_only" | "back_only" | "front_back",
  cornersMode: "4-corners" | "6-corners" = "6-corners"
): ZoneId {
  let pool = ZONES_ARRAY;

  if (cornersMode === "4-corners") {
    // 4 corners strictly excludes midcourt
    pool = ["frontForehand", "frontBackhand", "backForehand", "backBackhand"];
  }

  if (modeType === "front_only") {
    pool = pool.filter((z) => z.startsWith("front"));
  } else if (modeType === "back_only") {
    pool = pool.filter((z) => z.startsWith("back") || z === "overhead");
  } else if (modeType === "front_back") {
    pool = pool.filter((z) => !z.startsWith("mid"));
  }

  if (pool.length === 0) pool = ["frontForehand"];

  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

class AudioManager {
  private voiceAudio: HTMLAudioElement | null = null;
  private overlayAudio: HTMLAudioElement | null = null;

  private audioSequence: string[] = [];
  private sequenceIndex = 0;
  private isPlayingSequence = false;
  private currentPlayId = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private pendingCenterPath: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.voiceAudio = new Audio();
      this.voiceAudio.preload = "auto";
      this.overlayAudio = new Audio();
      this.overlayAudio.preload = "auto";
    }
  }

  public unlock() {
    [this.voiceAudio, this.overlayAudio].forEach((audio) => {
      if (audio) {
        audio.volume = 0;
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
          })
          .catch(() => {})
          .finally(() => {
            audio.volume = 1;
          });
      }
    });
  }

  public stopAll() {
    this.isPlayingSequence = false;
    this.audioSequence = [];
    this.sequenceIndex = 0;
    this.currentPlayId++;
    this.pendingCenterPath = null;
    if (this.timeoutId) clearTimeout(this.timeoutId);

    if (this.voiceAudio) {
      this.voiceAudio.onended = null;
      this.voiceAudio.pause();
      this.voiceAudio.currentTime = 0;
    }
    if (this.overlayAudio) {
      this.overlayAudio.pause();
      this.overlayAudio.currentTime = 0;
    }
  }

  public isPlaying(): boolean {
    if (this.isPlayingSequence) return true;
    if (
      this.voiceAudio &&
      !this.voiceAudio.paused &&
      this.voiceAudio.currentTime > 0
    )
      return true;
    return false;
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
        this.timeoutId = setTimeout(() => {
          if (this.currentPlayId !== playId || !this.isPlayingSequence) return;
          this.voiceAudio!.src = this.audioSequence[this.sequenceIndex];
          this.voiceAudio!.play().catch((e) => {
            if (e.name !== "AbortError") {
              console.log("Sequence play error", e);
              this.isPlayingSequence = false;
            }
          });
        }, 200);
      } else {
        this.isPlayingSequence = false;
        // Play any queued center command that was waiting for the sequence to finish
        if (this.pendingCenterPath && this.currentPlayId === playId) {
          const centerPath = this.pendingCenterPath;
          this.pendingCenterPath = null;
          setTimeout(() => {
            if (!this.voiceAudio || this.isPlayingSequence) return;
            this.currentPlayId++;
            this.voiceAudio.onended = null;
            this.voiceAudio.src = centerPath;
            this.voiceAudio.play().catch(() => {});
          }, 150);
        }
      }
    };
  }

  public queueAfterSequence(path: string) {
    // If nothing is playing right now, play immediately
    if (!this.isPlayingSequence && (this.voiceAudio?.paused ?? true)) {
      this.currentPlayId++;
      if (this.voiceAudio) {
        this.voiceAudio.onended = null;
        this.voiceAudio.src = path;
        this.voiceAudio.play().catch(() => {});
      }
    } else {
      // Queue it — will be triggered in onended above
      this.pendingCenterPath = path;
    }
  }

  public playVoice(path: string) {
    if (!this.voiceAudio) return;
    this.isPlayingSequence = false;
    this.currentPlayId++;
    if (this.timeoutId) clearTimeout(this.timeoutId);

    this.voiceAudio.onended = null;
    this.voiceAudio.src = path;
    this.voiceAudio.play().catch(() => {});
  }

  public playVoiceSequence(paths: string[]) {
    if (!this.voiceAudio || paths.length === 0) return;
    this.currentPlayId++;
    if (this.timeoutId) clearTimeout(this.timeoutId);

    this.isPlayingSequence = true;
    this.audioSequence = paths;
    this.sequenceIndex = 0;

    this.attachOnEnded(this.currentPlayId);
    this.voiceAudio.src = paths[0];
    this.voiceAudio.play().catch(() => {
      this.isPlayingSequence = false;
    });
  }

  public playOverlay(path: string) {
    if (!this.overlayAudio) return;
    this.overlayAudio.src = path;
    this.overlayAudio.play().catch(() => {});
  }

  public playSyntheticBeep() {
    if (typeof window === "undefined" || !window.AudioContext) return;
    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // 800Hz beep

      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioCtx.currentTime + 0.1
      );

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e: unknown) {
      console.log("Failed to play synthetic beep", e);
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
    // Queue the center command to play AFTER the current voice sequence finishes,
    // so it never interrupts or overlaps with zone/shot callouts.
    shadowAudioManager.queueAfterSequence(path);
  } else if (
    path === AUDIO_PATHS.common.beep ||
    path === AUDIO_PATHS.common.splitStep
  ) {
    shadowAudioManager.playSyntheticBeep(); // Can be changed to play real splitStep file if provided
  } else {
    shadowAudioManager.playVoice(path);
  }
}

export function playAudioSequence(paths: string[]) {
  shadowAudioManager.playVoiceSequence(paths);
}

export function stopAudio() {
  shadowAudioManager.stopAll();
}

export function isAudioPlaying(): boolean {
  return shadowAudioManager.isPlaying();
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
    // backRight, backLeft, overhead
    shots = SHOTS_BY_ZONE_GROUP.back;
  }
  const randomShotId = shots[Math.floor(Math.random() * shots.length)];
  return AUDIO_PATHS.shots[randomShotId];
}

export function preloadAudioForSettings(settings: any) {
  if (typeof window === "undefined" || settings.visualOnly) return;

  const urlsToFetch = new Set<string>();

  // Common sounds
  urlsToFetch.add(AUDIO_PATHS.common.startSet);
  urlsToFetch.add(AUDIO_PATHS.common.beep);
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
      if (settings.drillMode === "back_only" && z.startsWith("back"))
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
      if (z.startsWith("back")) zoneGroup = "back";

      SHOTS_BY_ZONE_GROUP[zoneGroup].forEach((shot) => {
        urlsToFetch.add(AUDIO_PATHS.shots[shot]);
      });
    }
  });

  urlsToFetch.forEach((url) => {
    fetch(url).catch(() => {});
  });
}
