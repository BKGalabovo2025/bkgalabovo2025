export type ExerciseCategory = "physical" | "technical" | "tactical" | "mental";
export type LocationType = "indoor" | "outdoor" | "both";
export type TrainingMode = "season" | "camp";
export type MedicalStatus = "healthy" | "discomfort" | "injured";

export interface Exercise {
  id: string;
  siteId: string;
  name: string;
  description: string;
  category: ExerciseCategory;
  source: string;
  location: LocationType[];
  ageGroups: string[];
  durationMinutes: number;
  equipment: string;
  videoUrl?: string; // YouTube/Instagram link or local path
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlannerSession {
  id: string;
  siteId: string;
  date: string; // ISO string
  mode: TrainingMode;
  location: LocationType;
  ageGroup: string;
  title: string;
  coachNotes?: string;
  exercises: Exercise[];
  eventId?: string; // Link to public schedule
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
  medicalStatus: MedicalStatus;
  note?: string; // Specific note for this child
  createdAt: string;
  updatedAt: string;
}
