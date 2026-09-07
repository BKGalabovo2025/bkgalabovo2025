/* eslint-disable @typescript-eslint/no-explicit-any */
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { MemberAssessment } from "@/types/assessment.types";
import { BeepTestResult } from "@/types/beep-test.types";
import { FeedbackSubmission } from "@/types/feedback.types";
import { InventoryItem } from "@/types/inventory.types";
import { Member } from "@/types/member.types";
import { AnnualPlan, Exercise } from "@/types/planner.types";
import { TheoryResult } from "@/types/quiz.types";
import { Reservation } from "@/types/reservation";
import { Tournament } from "@/types/tournament.types";
import { TrainingSession } from "@/types/training.types";

export type WorkoutTargetGoal =
  | "explosive_power"
  | "aerobic_endurance"
  | "agility_footwork"
  | "injury_rehab"
  | "pre_tournament_taper"
  | "general_conditioning";

export interface WorkoutTargetOptions {
  targetGoal?: WorkoutTargetGoal;
  startDate?: string;
  cycleDurationDays?: number;
  sessionsPerWeek?: number;
  courtAccess?: boolean;
  notes?: string;
  customEquipment?: string[];
}

export interface AthleteGeminiContext {
  profile: {
    id: string;
    fullName: string;
    age: number;
    gender: "male" | "female" | "unspecified";
    ageGroup: string;
    skillLevel: "beginner" | "intermediate" | "advanced" | "professional";
    dominantHand?: "left" | "right" | null;
    heightCm?: number | null;
    weightKg?: number | null;
  };
  safetyAndMedical: {
    activeInjuries: Array<
      "knee" | "shoulder" | "lower-back" | "achilles" | "ankle" | "wrist"
    >;
    healthConditionNotes?: string | null;
    hasValidMedicalCertificate: boolean;
    medicalCertificateDate?: string | null;
  };
  conditioning: {
    beepTest?: {
      lastVo2max: number;
      level: number;
      shuttle: number;
      qualitativeScore: string;
      date: string;
    } | null;
    recentAssessments: Array<{
      testId: string;
      testName: string;
      scoreDisplay: string;
      coachAnalysis?: string;
      recommendedExercises?: string;
    }>;
    shadowFootwork?: {
      averageReactionSec?: number;
      weakestCorners: string[];
      recentSessionsCount: number;
    } | null;
  };
  workloadAndFatigue: {
    sessionsCountLast14Days: number;
    totalTrainingMinutesLast14Days: number;
    averageRpeLast7Days: number;
    recentFatigueTrend: "low" | "optimal" | "high" | "overreaching";
    lastRecoveryTreatment?: {
      serviceName: string;
      date: string;
      daysAgo: number;
    } | null;
  };
  // 1. Годишни планове и спортни лагери
  macrocycle?: {
    currentPhase:
      | "Подготвителен"
      | "Предсъстезателен"
      | "Състезателен"
      | "Преходен"
      | "Няма активен годишен план";
    upcomingCamp?: {
      title: string;
      startDate: string;
      daysUntil: number;
    } | null;
  };
  // 2. Турнири и ранглиста (Tapering логика)
  tournamentContext?: {
    daysUntilNextTournament: number | null;
    nextTournamentTitle?: string | null;
    nextTournamentDate?: string | null;
    isTaperingActive: boolean;
    rankingPosition?: number | null;
    rankingPoints?: number | null;
  };
  // 3. Теоретични дефицити от куизове
  quizDeficits?: Array<{
    quizTitle: string;
    scorePercent: number;
    deficitSummary: string;
  }>;
  // 4. Отзиви, анкети и уелнес статус
  wellnessSurvey?: {
    overallRating?: number;
    recentFeedbackText?: string;
    stressOrFatigueNote?: string;
  } | null;
  // 5. Наличен инвентар и оборудване
  availableEquipment: string[];
  // 6. Подбрани референтни BWF упражнения от каталога
  catalogExercisesSample?: Array<{
    name: string;
    category: string;
    equipment: string[];
    coachingPoints?: string[];
    injuryPreventionFocus?: string;
  }>;
  targetOptions: {
    targetGoal: WorkoutTargetGoal;
    startDate?: string;
    cycleDurationDays: number;
    sessionsPerWeek: number;
    courtAccess: boolean;
    notes?: string;
  };
  scheduleEventsInPeriod?: Array<{
    date: string;
    title: string;
    type: string;
    isMemberAttending: boolean;
    isCompetition: boolean;
  }>;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  repsOrDuration: string;
  restSec: number;
  techniqueTip: string;
  targetWeakness?: string;
}

export interface WorkoutDay {
  dayNumber: number;
  calendarDate?: string;
  dayName: string;
  focus: string;
  intensity: "low" | "medium" | "high";
  durationMinutes: number;
  isCompetitionDay?: boolean;
  competitionTitle?: string;
  warmup: string[];
  exercises: WorkoutExercise[];
  cooldown: string[];
}

export interface WorkoutProgram {
  id?: string;
  programTitle: string;
  targetGoal?: WorkoutTargetGoal;
  startDate?: string;
  endDate?: string;
  cycleDurationDays?: number;
  sessionsPerWeek?: number;
  targetAthlete: {
    id: string;
    name: string;
    age: number;
    ageGroup: string;
    skillLevel: string;
  };
  safetyAudit: {
    activeRestrictions: string[];
    fatigueDeloadActive: boolean;
    taperingActive?: boolean;
    coachSafetyNotes: string;
  };
  schedule: WorkoutDay[];
  recoveryRecommendations: string[];
  theoryAssignment?: string;
  generatedAt: string;
}

/**
 * Calculates athlete age from dateOfBirth (ISO or YYYY-MM-DD string).
 */
export function calculateAge(dateOfBirth?: string | null): number {
  if (!dateOfBirth) return 18;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return 18;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(age, 5);
}

function computeShadowStats(shadowSessions: TrainingSession[]) {
  if (shadowSessions.length === 0) return null;

  let reactionSum = 0;
  let reactionCount = 0;
  const cornerFrequency: Record<string, number> = {};

  for (const s of shadowSessions) {
    if (s.shadowDetails?.paceSec) {
      reactionSum += s.shadowDetails.paceSec;
      reactionCount++;
    }
    if (s.shadowDetails?.heatmap) {
      const heatmap = s.shadowDetails.heatmap as unknown;
      if (Array.isArray(heatmap)) {
        heatmap.forEach((count, idx) => {
          const cornerLabel = `Corner ${idx + 1}`;
          cornerFrequency[cornerLabel] =
            (cornerFrequency[cornerLabel] || 0) + (count || 0);
        });
      } else if (typeof heatmap === "object" && heatmap !== null) {
        Object.entries(heatmap as Record<string, number>).forEach(
          ([key, count]) => {
            const cornerLabel = key.startsWith("Corner")
              ? key
              : `Corner ${key}`;
            cornerFrequency[cornerLabel] =
              (cornerFrequency[cornerLabel] || 0) + (Number(count) || 0);
          }
        );
      }
    }
  }

  const weakestCorners = Object.entries(cornerFrequency)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([corner]) => corner);

  return {
    averageReactionSec:
      reactionCount > 0
        ? Number((reactionSum / reactionCount).toFixed(2))
        : undefined,
    weakestCorners,
    recentSessionsCount: shadowSessions.length,
  };
}

function computeWorkloadStats(
  trainings: TrainingSession[],
  memberId: string,
  now: Date
) {
  const totalMinutes = trainings.reduce((acc, t) => {
    const durMin = t.durationMs ? Math.round(t.durationMs / 60000) : 60;
    return acc + durMin;
  }, 0);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const trainingsLast7Days = trainings.filter((t) => {
    const tDate = new Date(t.date);
    return !isNaN(tDate.getTime()) && tDate >= sevenDaysAgo;
  });

  let rpeSum = 0;
  let rpeCount = 0;
  for (const t of trainingsLast7Days) {
    if (t.rpeScores && typeof t.rpeScores[memberId] === "number") {
      rpeSum += t.rpeScores[memberId];
      rpeCount++;
    }
  }

  const averageRpeLast7Days =
    rpeCount > 0 ? Number((rpeSum / rpeCount).toFixed(1)) : 5.0;

  let recentFatigueTrend: "low" | "optimal" | "high" | "overreaching" =
    "optimal";
  if (averageRpeLast7Days >= 8.0) {
    recentFatigueTrend = "overreaching";
  } else if (averageRpeLast7Days >= 6.5) {
    recentFatigueTrend = "high";
  } else if (averageRpeLast7Days <= 3.5) {
    recentFatigueTrend = "low";
  }

  return {
    sessionsCountLast14Days: trainings.length,
    totalTrainingMinutesLast14Days: totalMinutes,
    averageRpeLast7Days,
    recentFatigueTrend,
  };
}

function computeRecoveryStats(reservations: Reservation[], now: Date) {
  if (reservations.length === 0) return null;

  const sorted = [...reservations].sort((a, b) => {
    const timeA = a.startTime?.toMillis ? a.startTime.toMillis() : 0;
    const timeB = b.startTime?.toMillis ? b.startTime.toMillis() : 0;
    return timeB - timeA;
  });

  const latest = sorted[0];
  const latestMillis = latest.startTime?.toMillis
    ? latest.startTime.toMillis()
    : now.getTime();
  const daysAgo = Math.max(
    0,
    Math.floor((now.getTime() - latestMillis) / (24 * 60 * 60 * 1000))
  );

  return {
    serviceName: latest.serviceName || "Recovery Zone процедура",
    date: new Date(latestMillis).toISOString().split("T")[0],
    daysAgo,
  };
}

function computeMacrocycleContext(
  annualPlan?: AnnualPlan | null,
  upcomingCamps: Array<{ title: string; startDate: string }> = [],
  now: Date = new Date()
) {
  let currentPhase:
    | "Подготвителен"
    | "Предсъстезателен"
    | "Състезателен"
    | "Преходен"
    | "Няма активен годишен план" = "Няма активен годишен план";

  if (annualPlan?.phases && annualPlan.phases.length > 0) {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor(
      (now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)
    );
    const currentWeekNumber = Math.min(
      52,
      Math.max(1, Math.ceil((dayOfYear + startOfYear.getDay() + 1) / 7))
    );

    const matchingPhase = annualPlan.phases.find(
      (p) => currentWeekNumber >= p.startWeek && currentWeekNumber <= p.endWeek
    );
    if (matchingPhase) {
      currentPhase = matchingPhase.name;
    } else {
      currentPhase = annualPlan.phases[0].name;
    }
  }

  let upcomingCamp: {
    title: string;
    startDate: string;
    daysUntil: number;
  } | null = null;
  if (upcomingCamps.length > 0) {
    const validCamps = upcomingCamps
      .map((c) => {
        const campDate = new Date(c.startDate);
        const daysUntil = Math.ceil(
          (campDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        );
        return { title: c.title, startDate: c.startDate, daysUntil };
      })
      .filter((c) => c.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    if (validCamps.length > 0) {
      upcomingCamp = validCamps[0];
    }
  }

  return { currentPhase, upcomingCamp };
}

function computeTournamentContext(
  upcomingTournaments: Tournament[] = [],
  member: Member,
  now: Date = new Date()
) {
  let daysUntilNextTournament: number | null = null;
  let nextTournamentTitle: string | null = null;
  let nextTournamentDate: string | null = null;

  const validTournaments = upcomingTournaments
    .map((t) => {
      const tDate = new Date(t.startDate);
      const daysUntil = Math.ceil(
        (tDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );
      return { title: t.title, startDate: t.startDate, daysUntil };
    })
    .filter((t) => t.daysUntil >= 0)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  if (validTournaments.length > 0) {
    daysUntilNextTournament = validTournaments[0].daysUntil;
    nextTournamentTitle = validTournaments[0].title;
    nextTournamentDate = validTournaments[0].startDate;
  }

  const isTaperingActive =
    daysUntilNextTournament !== null && daysUntilNextTournament <= 14;

  return {
    daysUntilNextTournament,
    nextTournamentTitle,
    nextTournamentDate,
    isTaperingActive,
    rankingPosition: member.rankingPosition ?? null,
    rankingPoints: member.rankingPoints ?? null,
  };
}

function computeQuizDeficits(theoryResults: TheoryResult[] = []) {
  return theoryResults
    .filter((tr) => {
      if (typeof tr.totalScore === "number" && tr.totalScore < 18) return true;
      if (typeof tr.autoScore === "number" && tr.autoScore < 14) return true;
      return false;
    })
    .slice(0, 3)
    .map((tr) => ({
      quizTitle: tr.quizTitle,
      scorePercent: Math.round(
        ((tr.totalScore || tr.autoScore || 10) / 28) * 100
      ),
      deficitSummary:
        tr.aiFeedback ||
        tr.coachFeedback ||
        "Препоръчва се преговор на основните тактически правила.",
    }));
}

function computeWellnessContext(
  wellnessSubmissions: FeedbackSubmission[] = []
) {
  if (wellnessSubmissions.length === 0) return null;
  const latest = wellnessSubmissions[0];
  return {
    overallRating: latest.overallRating,
    recentFeedbackText: latest.reviewText || latest.highlightQuote,
    stressOrFatigueNote: latest.adminNotes,
  };
}

function computeEquipmentList(
  clubInventory: InventoryItem[] = [],
  customEquipment?: string[]
): string[] {
  if (customEquipment && customEquipment.length > 0) {
    return customEquipment;
  }
  if (clubInventory.length > 0) {
    return Array.from(new Set(clubInventory.map((i) => i.name))).slice(0, 15);
  }
  return [
    "Ракети за бадминтон",
    "Пера",
    "Корт за бадминтон",
    "Тренировъчни ластици (Resistance Bands)",
    "Координационна стълбичка (Agility Ladder)",
    "Конуси за маркиране",
    "Медицинска топка (2-3 кг)",
  ];
}

function sampleCatalogExercises(
  catalog: Omit<Exercise, "id" | "siteId" | "createdAt" | "updatedAt">[] = [],
  ageGroup: string = "U15",
  skillLevel: string = "intermediate",
  courtAccess: boolean = true,
  activeInjuries: string[] = []
) {
  if (catalog.length === 0) return undefined;

  const isAdvanced = skillLevel === "advanced" || skillLevel === "professional";
  const nurseryGameNames = [
    "Топка на тигана (BWF Racket Control)",
    "Обръщане на палачинката (BWF Grip Change)",
    "Хвани с ръка, хвърли с ръка (BWF Throwing Base)",
    "Рисуване на осмици (BWF Figure of 8 Grip)",
  ];

  const filtered = catalog.filter((ex) => {
    // For advanced athletes, do not prescribe toddlers' kindergarten games as primary exercises
    if (isAdvanced && nurseryGameNames.includes(ex.name)) {
      return false;
    }
    // Age filtering: Advanced athletes can handle drills from U11, U13, U15
    if (ex.ageGroups && ex.ageGroups.length > 0) {
      const allowedGroups = isAdvanced
        ? [ageGroup, "U11", "U13", "U15", "U17+"]
        : [ageGroup, "U17+"];
      const hasMatch = ex.ageGroups.some((g) => allowedGroups.includes(g));
      if (!hasMatch) return false;
    }
    // Court filtering
    if (
      courtAccess &&
      ex.location &&
      ex.location.length > 0 &&
      !ex.location.includes("court")
    ) {
      return false;
    }
    // Injury protection
    if (
      ex.injuryPreventionFocus &&
      activeInjuries.includes(ex.injuryPreventionFocus)
    ) {
      return true;
    }
    return true;
  });

  // Pick up to 15 diverse exercises
  return filtered.slice(0, 15).map((ex) => ({
    name: ex.name,
    category: ex.category,
    equipment: ex.equipment || [],
    coachingPoints: ex.coachingPoints,
    injuryPreventionFocus: ex.injuryPreventionFocus,
  }));
}

/**
 * Pure function to build the structured AthleteGeminiContext from raw entity inputs.
 */
export function buildAthleteContext(params: {
  member: Member;
  beepTestResult?: BeepTestResult | null;
  assessments?: MemberAssessment[];
  trainingsLast14Days?: TrainingSession[];
  recentRecoveryReservations?: Reservation[];
  annualPlan?: AnnualPlan | null;
  upcomingCamps?: Array<{ title: string; startDate: string }>;
  upcomingTournaments?: Tournament[];
  theoryResults?: TheoryResult[];
  wellnessSubmissions?: FeedbackSubmission[];
  clubInventory?: InventoryItem[];
  catalogExercises?: Omit<
    Exercise,
    "id" | "siteId" | "createdAt" | "updatedAt"
  >[];
  options?: WorkoutTargetOptions;
  scheduleEventsInPeriod?: Array<{
    date: string;
    title: string;
    type: string;
    isMemberAttending: boolean;
    isCompetition: boolean;
  }>;
  now?: Date;
}): AthleteGeminiContext {
  const {
    member,
    beepTestResult,
    assessments = [],
    trainingsLast14Days = [],
    recentRecoveryReservations = [],
    annualPlan,
    upcomingCamps = [],
    upcomingTournaments = [],
    theoryResults = [],
    wellnessSubmissions = [],
    clubInventory = [],
    catalogExercises = INITIAL_BWF_EXERCISES,
    options = {},
    scheduleEventsInPeriod,
    now = new Date(),
  } = params;

  const age = calculateAge(member.dateOfBirth);
  const activeInjuries = member.injuries || [];

  const formattedAssessments = assessments.slice(0, 5).map((a) => ({
    testId: a.testId,
    testName: a.testName || a.testId,
    scoreDisplay: a.scoreDisplay || `${a.score ?? ""}`,
    coachAnalysis: a.coachAnalysis,
    recommendedExercises: a.recommendedExercises,
  }));

  const shadowSessions = trainingsLast14Days.filter(
    (t) => t.type === "shadow" && t.shadowDetails
  );
  const shadowFootwork = computeShadowStats(shadowSessions);
  const workload = computeWorkloadStats(trainingsLast14Days, member.id, now);
  const lastRecoveryTreatment = computeRecoveryStats(
    recentRecoveryReservations,
    now
  );

  const macrocycle = computeMacrocycleContext(annualPlan, upcomingCamps, now);
  const tournamentContext = computeTournamentContext(
    upcomingTournaments,
    member,
    now
  );
  const quizDeficits = computeQuizDeficits(theoryResults);
  const wellnessSurvey = computeWellnessContext(wellnessSubmissions);
  const availableEquipment = computeEquipmentList(clubInventory);
  const catalogExercisesSample = sampleCatalogExercises(
    catalogExercises,
    member.ageGroup || "U15",
    member.skillLevel || "intermediate",
    options.courtAccess !== false,
    activeInjuries
  );

  return {
    profile: {
      id: member.id,
      fullName: member.name || `${member.firstName} ${member.lastName}`.trim(),
      age,
      gender: (member.gender as "male" | "female") || "unspecified",
      ageGroup: member.ageGroup || "U15",
      skillLevel: member.skillLevel || "intermediate",
      dominantHand: member.dominantHand ?? null,
      heightCm: member.heightCm ?? null,
      weightKg: member.weightKg ?? null,
    },
    safetyAndMedical: {
      activeInjuries,
      healthConditionNotes: member.healthConditionNotes || null,
      hasValidMedicalCertificate: !!member.hasMedicalCertificate,
      medicalCertificateDate: member.medicalCertificateDate || null,
    },
    conditioning: {
      beepTest: beepTestResult
        ? {
            lastVo2max: beepTestResult.vo2max,
            level: beepTestResult.level,
            shuttle: beepTestResult.shuttle,
            qualitativeScore: beepTestResult.score,
            date: beepTestResult.date,
          }
        : null,
      recentAssessments: formattedAssessments,
      shadowFootwork,
    },
    workloadAndFatigue: {
      ...workload,
      lastRecoveryTreatment,
    },
    macrocycle,
    tournamentContext,
    quizDeficits,
    wellnessSurvey,
    availableEquipment,
    catalogExercisesSample,
    targetOptions: {
      targetGoal: options.targetGoal || "general_conditioning",
      startDate: options.startDate,
      cycleDurationDays: options.cycleDurationDays || 7,
      sessionsPerWeek: options.sessionsPerWeek || 4,
      courtAccess: options.courtAccess !== false,
      notes: options.notes,
    },
    scheduleEventsInPeriod,
  };
}

/**
 * Server-side aggregator to fetch all necessary context from Firestore for a given athlete.
 */
export async function getAthleteGeminiContext(
  memberId: string,
  options?: WorkoutTargetOptions
): Promise<AthleteGeminiContext> {
  const { getAdminDb } = await import("@/lib/firebase-admin");
  const db = getAdminDb();

  const memberDoc = await db.collection("members").doc(memberId).get();
  if (!memberDoc.exists) {
    throw new Error(`Member with ID "${memberId}" not found`);
  }
  const member = { id: memberDoc.id, ...memberDoc.data() } as Member;
  const siteId = member.siteId || "bkgalabovo";
  const now = new Date();

  let beepTestResult: BeepTestResult | null = null;
  try {
    const beepSnap = await db
      .collection("beep_test_results")
      .where("memberId", "==", memberId)
      .get();
    if (!beepSnap.empty) {
      const sorted = beepSnap.docs
        .map((d) => d.data() as BeepTestResult)
        .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      beepTestResult = sorted[0] || null;
    }
  } catch (err) {
    console.warn("Could not fetch beep test results:", err);
  }

  let assessments: MemberAssessment[] = [];
  try {
    const assessSnap = await db
      .collection("member_assessments")
      .where("memberId", "==", memberId)
      .get();
    assessments = assessSnap.docs
      .map((doc) => doc.data() as MemberAssessment)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .slice(0, 5);
  } catch (err) {
    console.warn("Could not fetch member assessments:", err);
  }

  let trainingsLast14Days: TrainingSession[] = [];
  try {
    const fourteenDaysAgoStr = new Date(
      Date.now() - 14 * 24 * 60 * 60 * 1000
    ).toISOString();
    const trainingsSnap = await db
      .collection("trainings")
      .where("memberIds", "array-contains", memberId)
      .get();
    trainingsLast14Days = trainingsSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as TrainingSession)
      .filter((t) => t.date && t.date >= fourteenDaysAgoStr)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  } catch (err) {
    console.warn("Could not fetch member trainings:", err);
  }

  let recentRecoveryReservations: Reservation[] = [];
  try {
    const recoverySnap = await db
      .collection("reservations")
      .where("memberId", "==", memberId)
      .limit(5)
      .get();
    recentRecoveryReservations = recoverySnap.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as Reservation
    );
  } catch (err) {
    console.warn("Could not fetch recovery reservations:", err);
  }

  // 1. Annual Plan & Camps
  let annualPlan: AnnualPlan | null = null;
  const upcomingCamps: Array<{ title: string; startDate: string }> = [];
  try {
    const planSnap = await db
      .collection("annual_plans")
      .where("siteId", "==", siteId)
      .limit(1)
      .get();
    if (!planSnap.empty) {
      annualPlan = planSnap.docs[0].data() as AnnualPlan;
    }
    const campSnap = await db
      .collection("schedule")
      .where("siteId", "==", siteId)
      .where("type", "==", "camp")
      .limit(3)
      .get();
    campSnap.docs.forEach((d) => {
      const c = d.data();
      if (c.title && (c.date || c.startDate)) {
        upcomingCamps.push({
          title: c.title,
          startDate: c.startDate || c.date,
        });
      }
    });
  } catch (err) {
    console.warn("Could not fetch annual plan or camps:", err);
  }

  // 2. Upcoming Tournaments, Competitions & Schedule Events
  const nowIso = now.toISOString().split("T")[0];
  const effectiveStartDate = options?.startDate || nowIso;
  const cycleDays = options?.cycleDurationDays || 7;
  const effectiveEndDate = new Date(
    new Date(effectiveStartDate).getTime() +
      (cycleDays - 1) * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  let upcomingTournaments: Tournament[] = [];
  let scheduleEventsInPeriod: Array<{
    date: string;
    title: string;
    type: string;
    isMemberAttending: boolean;
    isCompetition: boolean;
  }> = [];

  try {
    // A. Tournaments collection
    const tourSnap = await db.collection("tournaments").get();
    const allTournaments = tourSnap.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Tournament
    );

    // B. Check if member is registered specifically in tournament_entries
    let registeredTournamentIds = new Set<string>();
    try {
      const entriesSnap = await db
        .collection("tournament_entries")
        .where("memberId", "==", memberId)
        .get();
      registeredTournamentIds = new Set(
        entriesSnap.docs.map((d) => String(d.data().tournamentId || ""))
      );
    } catch {
      // Non-blocking
    }

    // C. Check calendar events for competition/tournament type & extract events in period
    let calendarCompetitions: Tournament[] = [];
    try {
      const eventsSnap = await db.collection("events").get();
      const rawEventsList = eventsSnap.docs.map((d) => {
        const e = (d.data() || {}) as Record<string, any>;
        return { id: d.id, ...e };
      });

      // 1. Competitions
      calendarCompetitions = rawEventsList
        .filter((e: Record<string, any>) => {
          const typeLower = String(e.type || "").toLowerCase();
          const titleLower = String(e.title || "").toLowerCase();
          const isComp =
            typeLower === "competition" ||
            typeLower === "tournament" ||
            titleLower.includes("състезание") ||
            titleLower.includes("турнир") ||
            titleLower.includes("държавно") ||
            titleLower.includes("първенство");

          const attendeesList = Array.isArray(e.attendees) ? e.attendees : [];
          const attendeeIdsList: string[] = Array.isArray(e.attendeeMemberIds)
            ? (e.attendeeMemberIds as string[])
            : (attendeesList
                .map((a: any) => a?.memberId)
                .filter(Boolean) as string[]);

          const hasMember =
            attendeeIdsList.length === 0 || attendeeIdsList.includes(memberId);
          return isComp && hasMember;
        })
        .map((e: Record<string, any>) => {
          let rawStartDate: any = e.startDate || e.date;
          if (rawStartDate && typeof rawStartDate.toDate === "function") {
            rawStartDate = rawStartDate.toDate().toISOString();
          } else if (
            rawStartDate &&
            typeof rawStartDate.toMillis === "function"
          ) {
            rawStartDate = new Date(rawStartDate.toMillis()).toISOString();
          }
          const startStr =
            typeof rawStartDate === "string" ? rawStartDate : nowIso;

          return {
            id: e.id,
            siteId: String(e.siteId || siteId),
            title: `🏆 ${String(e.title || "Състезание")} (от клубния график)`,
            startDate: startStr,
            endDate: startStr,
            location: String(e.location || "Зала"),
            status: "upcoming",
            format: "knockout",
            matchFormatId: "standard",
            pointsMultiplier: 1,
            countsForRanking: false,
            categories: [],
            entryFee: 0,
          } as unknown as Tournament;
        });

      // 2. Schedule events in the requested period [effectiveStartDate, effectiveEndDate]
      scheduleEventsInPeriod = rawEventsList
        .map((e: Record<string, any>) => {
          let rawDate: any = e.startDate || e.date;
          if (rawDate && typeof rawDate.toDate === "function") {
            rawDate = rawDate.toDate().toISOString();
          } else if (rawDate && typeof rawDate.toMillis === "function") {
            rawDate = new Date(rawDate.toMillis()).toISOString();
          }
          const dateStr =
            typeof rawDate === "string" ? rawDate.split("T")[0] : "";

          const attendeesList = Array.isArray(e.attendees) ? e.attendees : [];
          const attendeeIdsList: string[] = Array.isArray(e.attendeeMemberIds)
            ? (e.attendeeMemberIds as string[])
            : (attendeesList
                .map((a: any) => a?.memberId)
                .filter(Boolean) as string[]);

          const isMemberAttending =
            attendeeIdsList.length === 0 || attendeeIdsList.includes(memberId);

          const typeLower = String(e.type || "").toLowerCase();
          const titleLower = String(e.title || "").toLowerCase();
          const isCompetition =
            typeLower === "competition" ||
            typeLower === "tournament" ||
            titleLower.includes("състезание") ||
            titleLower.includes("турнир") ||
            titleLower.includes("държавно") ||
            titleLower.includes("първенство");

          return {
            date: dateStr,
            title: String(e.title || "Събитие"),
            type: String(e.type || "training"),
            isMemberAttending,
            isCompetition,
          };
        })
        .filter(
          (ev) => ev.date >= effectiveStartDate && ev.date <= effectiveEndDate
        )
        .sort((a, b) => a.date.localeCompare(b.date));
    } catch {
      // Non-blocking
    }

    // Combine all future tournaments/competitions
    const candidateTournaments = [
      ...calendarCompetitions.filter((c) => (c.startDate || "") >= nowIso),
      ...allTournaments.filter((t) => {
        const isFuture = (t.startDate || "") >= nowIso;
        const isRegistered = !!t.id && registeredTournamentIds.has(t.id);
        const isOpen =
          t.status === "upcoming" || t.status === "registration_open";
        return isFuture && (isRegistered || isOpen);
      }),
    ];

    upcomingTournaments = candidateTournaments
      .sort((a, b) =>
        String(a.startDate || "").localeCompare(String(b.startDate || ""))
      )
      .slice(0, 5);
  } catch (err) {
    console.warn("Could not fetch upcoming tournaments:", err);
  }

  // 3. Theory & Quizzes
  let theoryResults: TheoryResult[] = [];
  try {
    const quizSnap = await db
      .collection("theory_results")
      .where("playerId", "==", memberId)
      .get();
    theoryResults = quizSnap.docs
      .map((d) => d.data() as TheoryResult)
      .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""))
      .slice(0, 5);
  } catch (err) {
    console.warn("Could not fetch theory results:", err);
  }

  // 4. Feedback & Wellness
  let wellnessSubmissions: FeedbackSubmission[] = [];
  try {
    const feedbackSnap = await db
      .collection("feedback_submissions")
      .where("siteId", "==", siteId)
      .limit(3)
      .get();
    wellnessSubmissions = feedbackSnap.docs.map(
      (d) => d.data() as FeedbackSubmission
    );
  } catch (err) {
    console.warn("Could not fetch feedback submissions:", err);
  }

  // 5. Inventory
  let clubInventory: InventoryItem[] = [];
  try {
    const invSnap = await db
      .collection("inventory")
      .where("siteId", "==", siteId)
      .limit(20)
      .get();
    clubInventory = invSnap.docs.map((d) => d.data() as InventoryItem);
  } catch (err) {
    console.warn("Could not fetch club inventory:", err);
  }

  return buildAthleteContext({
    member,
    beepTestResult,
    assessments,
    trainingsLast14Days,
    recentRecoveryReservations,
    annualPlan,
    upcomingCamps,
    upcomingTournaments,
    theoryResults,
    wellnessSubmissions,
    clubInventory,
    scheduleEventsInPeriod,
    options,
  });
}
