export type TrainingType = "shadow" | "physical" | "court";
export type ShadowMode = "standard" | "ghost_match" | "agility_test";
export type ShadowPace = "slow" | "medium" | "fast";
export type ShadowPreset = "beginner" | "advanced" | "custom";

export interface TrainingSession {
  id?: string;
  siteId: string;
  type: TrainingType;
  date: string; // ISO string
  memberIds: string[];
  durationMs: number;
  
  // Specific to Shadow Training
  shadowDetails?: {
    mode: ShadowMode;
    preset?: ShadowPreset;
    setsCompleted: number;
    totalSets: number;
    workTimeSec: number;
    restTimeSec: number;
    pace?: ShadowPace;
    deceptionEnabled: boolean;
    agilityTestTimeSec?: number; // If it was an agility test
    heatmap?: Record<string, number>; // zone -> count
  };

  rpeScores?: Record<string, number>; // memberId -> 1-10

  createdAt?: any;
  createdBy?: { uid: string; email: string; name?: string };
}
