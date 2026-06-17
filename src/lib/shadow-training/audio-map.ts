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

class AudioPool {
  private pool: HTMLAudioElement[] = [];
  private index = 0;

  constructor(size = 3) {
    if (typeof window !== "undefined") {
      for (let i = 0; i < size; i++) {
        const audio = new Audio();
        audio.preload = "auto";
        this.pool.push(audio);
      }
    }
  }

  // Call this inside a user interaction (e.g. onClick) to unlock on iOS/Safari
  public unlock() {
    this.pool.forEach((a) => {
      a.volume = 0;
      a.play()
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.volume = 1;
        })
        .catch(() => {});
    });
  }

  public play(path: string) {
    if (this.pool.length === 0) return;
    const audio = this.pool[this.index];
    this.index = (this.index + 1) % this.pool.length;

    audio.src = path;
    audio.currentTime = 0;
    audio.volume = 1;
    audio.play().catch((e) => console.log("Audio play error", e));
  }
}

export const shadowAudioPool = new AudioPool(3);

export function playAudio(path: string) {
  shadowAudioPool.play(path);
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
