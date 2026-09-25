export interface ShadowPlayer {
  id: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  ageGroup?: string;
  [key: string]: unknown;
}

export type VisualPhase = "idle" | "split_step" | "shot" | "center";

export type TrainerState =
  "idle" | "countdown" | "working" | "resting" | "finished" | "paused";

export type CourtAllocationStrategy = "two_per_court" | "one_per_court";

export interface CourtSlot {
  courtNumber: number; // 1-indexed (1 to 6)
  isFullCourt: boolean;
  halfA: ShadowPlayer | null; // Bottom half / Поле 1 (facing net)
  halfB: ShadowPlayer | null; // Top half / Поле 2 (facing net)
}

export interface ShadowSettings {
  mode: "standard" | "ghost_match" | "agility_test";
  preset: string;
  drillMode:
    | "all"
    | "front_only"
    | "back_only"
    | "forehand_only"
    | "backhand_only"
    | "front_back";
  cornersMode: "2-corners" | "4-corners" | "6-corners";
  ageGroup: "U9-U11" | "U11-U13" | "U13-U15" | "U15-U17" | "U17+";
  drillPattern:
    | "random"
    | "fixed-triangle"
    | "fixed-net-back"
    | "forehand-only"
    | "backhand-only"
    | "mixed";
  sets: number;
  workSec: number;
  restSec: number;
  paceSec: number;
  deceptionEnabled: boolean;
  motivationEnabled: boolean;
  visualOnly: boolean;
  calloutMode: "zones" | "shots" | "zones_and_shots";
  centerCommandEnabled: boolean;
  activePlayers: ShadowPlayer[];
  courtsAvailable: number;
  courtAllocationStrategy?: CourtAllocationStrategy;
}

export interface WakeLockSentinel {
  release(): Promise<void>;
}
