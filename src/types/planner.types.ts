export type ExerciseCategory =
  "warmup" | "technique" | "tactics" | "physical" | "games" | "cooldown";
export type LocationType = "court" | "stadium" | "beach";
export type TrainingMode = "season" | "camp";
type MedicalStatus = "healthy" | "discomfort" | "injured";

export interface Exercise {
  id: string;
  siteId: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  source?: string;
  location: LocationType[];
  ageGroups: string[];
  durationMinutes: number;
  equipment: string[];
  prerequisites?: string[];
  videoUrl?: string; // YouTube/Instagram link or local path
  imageUrl?: string;

  // Pedagogical structure
  phase?: "warmup" | "main-tech" | "main-tact" | "cooldown";
  focusTags?: string[];
  coachingPoints?: string[];
  targetKineticChain?: string[];
  biomechanicsType?: "push" | "pull" | "hinge" | "squat" | "rotation" | "jump";
  minPlayers?: number;
  maxPlayers?: number;
  isHomeFriendly?: boolean;
  injuryPreventionFocus?: "knee" | "shoulder" | "achilles" | "lower-back";
  intensity?: 1 | 2 | 3 | 4 | 5;
  complexityLevel?: 1 | 2 | 3 | 4 | 5;
  defaultSets?: number;
  defaultWorkSec?: number;
  defaultRestSec?: number;

  createdAt: string;
  updatedAt: string;
}
export interface SessionBlockItem {
  id: string;
  type: "exercise" | "station";
  durationMinutes: number;

  // If type === "exercise"
  exercise?: Exercise;
  targetGroupId?: string; // Optional: To assign a specific group (e.g. Group A) to this exercise

  // If type === "station" (Rotation)
  rotations?: {
    groupId: string;
    exercise: Exercise;
  }[];

  // Advanced Station Tracking
  stationTimer?: {
    workSeconds: number;
    transitionSeconds: number;
    rounds: number;
  };
  assignedCoach?: string;
  isHydrationBreak?: boolean;
}

export interface SessionBlock {
  id: string;
  phase: "warmup" | "main" | "cooldown";
  targetDuration: number;
  items: SessionBlockItem[];
}

export interface PlannerSession {
  id: string;
  siteId: string;
  date: string; // ISO string
  mode: TrainingMode;
  location: LocationType;
  title: string;
  coachNotes?: string;

  // Legacy single-group support
  ageGroup?: string;
  exercises?: Exercise[];

  // Advanced tracking
  totalKids?: number;
  inventoryOverrides?: Record<string, number>;

  // Multi-group calendar support
  targetGroups?: string[];
  sessionGroups?: {
    id: string;
    name: string;
    memberIds: string[];
  }[];
  structuredTargetGroups?: {
    ageGroup: string;
    skillLevel: string;
  }[];
  groupedExercises?: {
    ageGroup: string;
    skillLevel?: string;
    exercises: Exercise[];
  }[];
  blocks?: SessionBlock[]; // The new Time-Budget / Station structure
  eventId?: string; // Link to public schedule
  campId?: string; // Link to the camp this session belongs to

  // Methodological tracking
  focus?: string;
  period?: "preparation" | "competition" | "transition";
  pedagogicalAction?: "consolidation" | "progression" | "new";
  targetIntensity?: number;
  calculatedIntensity?: number;

  status: "planned" | "completed";
  weatherIcon?: string; // e.g., 'sun', 'rain', 'cloud'
  createdAt: string;
  updatedAt: string;
}

export interface SessionAttendance {
  id: string;
  siteId: string;
  sessionId: string;
  memberId: string;
  date: string;
  rpe: number; // Rate of Perceived Exertion (1-10)
  effort: number; // Coach's grade for effort (1-5)
  playerLoad?: number; // RPE * Session Duration
  medicalStatus: MedicalStatus;
  note?: string; // Specific note for this child
  createdAt: string;
  updatedAt: string;
}

interface TrainingTemplateBlockItem {
  exerciseId: string;
  exerciseName: string;
  durationMinutes: number;
  customInstructions?: string;
}

interface TrainingTemplateBlock {
  id: string;
  phase: "warmup" | "main" | "cooldown";
  title: string;
  durationMinutes: number;
  description: string;
  exercises: TrainingTemplateBlockItem[];
}

export interface TrainingTemplate {
  id: string;
  siteId: string;
  name: string;
  description: string;
  targetAgeGroups: string[];
  totalDurationMinutes: number;
  blocks: TrainingTemplateBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface AnnualPlanSession {
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  templateId?: string; // Reference to TrainingTemplate
  templateReference?: TrainingTemplate; // Used for UI preview if populated
  focus: string; // e.g. "Footwork & Скорост"
  isCampSession?: boolean; // Flag if suitable for camps
}

export interface AnnualPlanWeek {
  weekNumber: number; // 1-52
  focus: string;
  isMatchWeek?: boolean; // Flag if there is a competition
  sessions: AnnualPlanSession[];
}

export interface AnnualPlanPhase {
  id: string;
  name: "Подготвителен" | "Предсъстезателен" | "Състезателен" | "Преходен";
  description: string;
  startWeek: number;
  endWeek: number;
  weeks: AnnualPlanWeek[];
}

export interface AnnualPlan {
  id: string;
  siteId: string;
  name: string; // e.g. "Едногодишна програма за U13/U15"
  description: string;
  targetAgeGroups: string[];
  seasonStartDate?: string; // Optional dynamic start date ISO
  phases: AnnualPlanPhase[];
  createdAt: string;
  updatedAt: string;
}
