export interface ShadowPlayer {
  id: string;
  displayName?: string;
  [key: string]: unknown;
}

export type VisualPhase = "idle" | "split_step" | "shot" | "center";

export type TrainerState =
  | "idle"
  | "countdown"
  | "working"
  | "resting"
  | "finished"
  | "paused";

export interface ShadowSettings {
  mode: "standard" | "ghost_match" | "agility_test";
  preset: string;
  drillMode: "all" | "front_only" | "back_only" | "front_back";
  cornersMode: "4-corners" | "6-corners";
  ageGroup: "U9-U11" | "U13-U15" | "U17+";
  drillPattern: "random" | "fixed-triangle" | "fixed-net-back" | "mixed";
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
}

export interface WakeLockSentinel {
  release(): Promise<void>;
}
