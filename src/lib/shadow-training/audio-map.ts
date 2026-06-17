// Defines the available audio files and helper functions for Shadow Training

export const AUDIO_PATHS = {
  common: {
    startSet: "/shadow/common/podgotvi_se.mp3", // Could be used for 10s countdown
    beep: "/shadow/common/lek_podskok.mp3", // Could be used as tick or beep
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
    clearStraight: "/shadow/shots/iztegliane_po_prava.mp3",
    clearCross: "/shadow/shots/iztegliane_po_diagonal.mp3",
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
    liftStraight: "/shadow/shots/dulgo_po_prava.mp3", // Only 1 .mp3 extension here
    liftCross: "/shadow/shots/dulgo_po_diagonal.mp3",
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
  backForehand: "Форхенд Задна",
  frontBackhand: "Бекхенд Мрежа",
  midBackhand: "Бекхенд Среда",
  backBackhand: "Бекхенд Задна",
  overhead: "Оувърхед",
};

export const ZONES_ARRAY = Object.keys(AUDIO_PATHS.zones) as ZoneId[];

export function getRandomZone(): ZoneId {
  const index = Math.floor(Math.random() * ZONES_ARRAY.length);
  return ZONES_ARRAY[index];
}

export function getRandomZoneForMode(
  modeType: "all" | "front_only" | "back_only" | "front_back"
): ZoneId {
  let pool = ZONES_ARRAY;
  if (modeType === "front_only") {
    pool = ["frontForehand", "frontBackhand"];
  } else if (modeType === "back_only") {
    pool = ["backForehand", "backBackhand", "overhead"];
  } else if (modeType === "front_back") {
    pool = [
      "frontForehand",
      "frontBackhand",
      "backForehand",
      "backBackhand",
      "overhead",
    ];
  }
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

class AudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private audioSequence: string[] = [];
  private sequenceIndex = 0;
  private isPlaying = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.currentAudio = new Audio();
      this.currentAudio.preload = "auto";

      this.currentAudio.onended = () => {
        this.sequenceIndex++;
        if (this.sequenceIndex < this.audioSequence.length && this.isPlaying) {
          this.currentAudio!.src = this.audioSequence[this.sequenceIndex];
          this.currentAudio!.play().catch((e) =>
            console.log("Sequence play error", e)
          );
        } else {
          this.isPlaying = false;
        }
      };
    }
  }

  public unlock() {
    if (this.currentAudio) {
      this.currentAudio.volume = 0;
      this.currentAudio
        .play()
        .then(() => {
          this.currentAudio!.pause();
          this.currentAudio!.currentTime = 0;
          this.currentAudio!.volume = 1;
        })
        .catch(() => {});
    }
  }

  public stopAll() {
    this.isPlaying = false;
    this.audioSequence = [];
    this.sequenceIndex = 0;
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }
  }

  public play(path: string) {
    if (!this.currentAudio) return;
    this.stopAll();

    this.isPlaying = true;
    this.audioSequence = [path];
    this.sequenceIndex = 0;

    this.currentAudio.src = path;
    this.currentAudio.volume = 1;
    this.currentAudio.play().catch((e) => console.log("Audio play error", e));
  }

  public playSequence(paths: string[]) {
    if (!this.currentAudio || paths.length === 0) return;
    this.stopAll();

    this.isPlaying = true;
    this.audioSequence = paths;
    this.sequenceIndex = 0;

    this.currentAudio.src = paths[0];
    this.currentAudio.volume = 1;
    this.currentAudio
      .play()
      .catch((e) => console.log("Sequence start error", e));
  }
}

export const shadowAudioManager = new AudioManager();

export function playAudio(path: string) {
  shadowAudioManager.play(path);
}

export function playAudioSequence(paths: string[]) {
  shadowAudioManager.playSequence(paths);
}

export function stopAudio() {
  shadowAudioManager.stopAll();
}

export const SHOTS_BY_ZONE_GROUP = {
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
