type TrainingType = "shadow" | "physical" | "court";
type ShadowMode = "standard" | "ghost_match" | "agility_test";
type ShadowPreset = "beginner" | "advanced" | "custom";
type ShadowCornersMode = "4-corners" | "6-corners";
type ShadowAgeGroup = "U9-U11" | "U13-U15" | "U17+";
type ShadowDrillPattern =
  | "random"
  | "fixed-triangle"
  | "fixed-net-back"
  | "mixed";

export interface TrainingSession {
  id?: string;
  siteId: string;
  type: TrainingType;
  date: string; // ISO string
  memberIds: string[];
  durationMs: number;
  notes?: string;

  // Specific to Shadow Training
  shadowDetails?: {
    mode: ShadowMode;
    preset?: ShadowPreset;
    cornersMode?: ShadowCornersMode;
    ageGroup?: ShadowAgeGroup;
    drillPattern?: ShadowDrillPattern;
    setsCompleted: number;
    totalSets: number;
    workTimeSec: number;
    restTimeSec: number;
    paceSec?: number; // Real pace in seconds instead of 'slow'/'fast' string
    deceptionEnabled: boolean;
    agilityTestTimeSec?: number; // If it was an agility test
    heatmap?: Record<string, number>; // zone -> count
    rpeScores?: Record<string, number>; // memberId -> 1-10
  };

  rpeScores?: Record<string, number>; // memberId -> 1-10

  createdAt?: string | Date | { toDate: () => Date };
  createdBy?: { uid: string; email: string; name?: string };
}
