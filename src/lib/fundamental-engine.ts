import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import { BWF_FUNDAMENTAL_BY_ID } from "@/lib/bwf-fundamentals";
import { inferFundamentalId } from "@/lib/exercises/bwf-textbook";
import type {
  AssessmentAgeGroup,
  BadmintonTest,
  MemberAssessment,
} from "@/types/assessment.types";
import type { BeepTestResult } from "@/types/beep-test.types";
import type {
  Exercise,
  FundamentalId,
  PlannerSession,
  ProgressionStage,
  SessionAttendance,
} from "@/types/planner.types";

/** 9-те основни технико-тактически BWF фундамента (без Загрявка/Разтоварване) */
export const SKILL_FUNDAMENTAL_IDS: readonly FundamentalId[] = [
  "grips",
  "split-step",
  "front-forehand",
  "front-backhand",
  "rear-footwork",
  "serve-receive",
  "clear",
  "drop-smash",
  "defense-drive",
] as const;

/** Брой тренировки над слаб фундамент преди автоматично подсещане за контролен тест */
export const RETEST_TRAINING_THRESHOLD = 5;

/**
 * Пълна входна (Baseline) батерия от официални BWF тестове за всяка възрастова група.
 * Всяко ID съответства 1-към-1 на реален тест в `src/lib/badminton-tests.ts`.
 */
export const BASELINE_TESTS_BY_AGE: Record<AssessmentAgeGroup, string[]> = {
  U9: [
    "u9_keep_uppy",
    "u9_racket_pack_balance",
    "u9_catch",
    "u9_agility_run",
    "u9_short_serve_target",
    "u9_hanging_shuttle",
  ],
  U11: [
    "u11_backhand_serve",
    "u11_star_footwork",
    "u11_forehand_clear",
    "u11_wall_drive",
    "u11_scissor_jump",
    "u11_underhand_wall",
  ],
  U13: [
    "u13_high_clear",
    "u13_rear_drop_shot",
    "u13_net_spin",
    "u13_6_point_footwork",
    "u13_smash_speed",
    "u13_serve_receive",
  ],
  U15: [
    "u15_jump_smash",
    "u15_smash_defense",
    "u15_cross_drop",
    "u15_net_kill_spin",
    "u15_t_test_agility",
    "u15_attacking_drive_line",
  ],
  U17: [
    "u17_attacking_clear",
    "u17_defense_counter",
    "u17_deceptive_drop",
    "u17_shadow_1min",
    "u17_defensive_lift_deep",
    "u17_flick_serve",
  ],
  U19: [
    "u19_fatigue_accuracy",
    "u19_smash_defense_series",
    "u19_drive_battle",
    "u19_match_serve",
    "u19_net_kill_reaction",
    "u19_rear_court_speed",
  ],
  "Мъже и Жени": [
    "adult_smash_power_acc",
    "adult_tactical_recovery",
    "adult_decision_making",
    "adult_yoyo_recovery",
    "adult_high_hr_accuracy",
  ],
};

export type FundamentalStatus = "untested" | ProgressionStage;

export interface FundamentalEvaluation {
  fundamentalId: FundamentalId;
  chapterNumber: number;
  title: string;
  shortTitle: string;
  status: FundamentalStatus;
  latestAssessment?: MemberAssessment;
  /** Нормализиран процент 0..100 спрямо maxScore (или null при липса на тест) */
  scorePercent: number | null;
  /** Препоръчан BWF тест за входно ниво, контролен тест или следваща прогресия */
  recommendedTest?: BadmintonTest;
  /** true когато текущият тест е усвоен (>=80%) и препоръчваме по-труден тест от следващо ниво */
  isProgressionTest?: boolean;
  /** Брой тренировки върху този фундамент след последния тест */
  trainingsSinceLastTest: number;
  /** true когато са минали >= 5 тренировки над слаб фундамент */
  readyForRetest: boolean;
}

export type CoachSignalKind =
  | "retest_ready"
  | "missing_baseline"
  | "post_competition"
  | "returning_from_absence"
  | "medical_discomfort"
  | "low_aerobic";

export interface CoachSignal {
  kind: CoachSignalKind;
  label: string;
  detail: string;
  severity: "info" | "warning" | "action";
  testId?: string;
  fundamentalId?: FundamentalId;
}

export interface MemberFundamentalProfile {
  memberId: string;
  ageGroup: AssessmentAgeGroup;
  evaluations: FundamentalEvaluation[];
  /** Най-приоритетният фундамент за работа днес (най-слабият тестван, или първият нетестван) */
  primaryFocusFundamental: FundamentalId;
  /** Липсва ли напълно входно ниво (0 проведени теста) */
  needsBaseline: boolean;
  /** Препоръчан пръв входен тест при липса на базови данни */
  nextBaselineTest?: BadmintonTest;
  signals: CoachSignal[];
  /** Препоръчана намалена интензивност (след турнир / боледуване / травма / нисък VO2) */
  recommendLightLoad: boolean;
}

export function inferAgeGroupFromBirthDate(
  birthDate?: string | null
): AssessmentAgeGroup {
  if (!birthDate) return "U13";
  const d = new Date(birthDate);
  if (Number.isNaN(d.getTime())) return "U13";
  const age = new Date().getFullYear() - d.getFullYear();
  if (age <= 9) return "U9";
  if (age <= 11) return "U11";
  if (age <= 13) return "U13";
  if (age <= 15) return "U15";
  if (age <= 17) return "U17";
  if (age <= 19) return "U19";
  return "Мъже и Жени";
}

const AGE_GROUP_ORDER: readonly AssessmentAgeGroup[] = [
  "U9",
  "U11",
  "U13",
  "U15",
  "U17",
  "U19",
  "Мъже и Жени",
] as const;

function normalizeScoreToPercent(
  assessment: MemberAssessment,
  testDef?: BadmintonTest
): number {
  if (!testDef) {
    return assessment.score <= 0 ? 0 : Math.min(100, assessment.score * 5);
  }
  // За времеви тестове
  if (testDef.scoreType === "time") {
    if (assessment.score <= 0) return 0;
    // По-високо време = по-добре (напр. Планк)
    if (testDef.higherIsBetter) {
      const target = testDef.targetTimeSec || testDef.maxScore || 90;
      return Math.max(
        0,
        Math.min(100, Math.round((assessment.score / target) * 100))
      );
    }
    // По-ниско време = по-добре (спринт / футърк)
    const target = testDef.targetTimeSec || 12;
    if (assessment.score <= target * 0.9) return 100;
    if (assessment.score <= target) return 95;
    const maxTime = target * 1.8;
    if (assessment.score >= maxTime) {
      return Math.max(
        10,
        Math.round(25 - ((assessment.score - maxTime) / target) * 15)
      );
    }
    const ratio = (assessment.score - target) / (maxTime - target);
    return Math.max(0, Math.min(100, Math.round(95 - ratio * 70)));
  }
  if (testDef.scoreType === "percentage") {
    return Math.max(0, Math.min(100, assessment.score));
  }
  if (testDef.maxScore && testDef.maxScore > 0) {
    return Math.max(
      0,
      Math.min(100, Math.round((assessment.score / testDef.maxScore) * 100))
    );
  }
  return assessment.score <= 0 ? 0 : Math.min(100, assessment.score * 4);
}

function pickRecommendedTestForFundamental(
  fundamentalId: FundamentalId,
  ageGroup: AssessmentAgeGroup,
  testsById: Map<string, BadmintonTest>
): BadmintonTest | undefined {
  const chapter = BWF_FUNDAMENTAL_BY_ID[fundamentalId];

  // 1. Търсим директно съвпадение по linkedTestIds (в реда на сложност) за точната възрастова група
  const exactMatchId = chapter.linkedTestIds.find((id) => {
    const t = testsById.get(id);
    return t?.ageGroup === ageGroup;
  });
  if (exactMatchId) return testsById.get(exactMatchId);

  // 2. Търсим който и да е тест от linkedTestIds
  const anyMatchId = chapter.linkedTestIds.find((id) => testsById.has(id));
  if (anyMatchId) return testsById.get(anyMatchId);

  // 3. Fallback към първия базов тест за възрастта
  const baselineId = BASELINE_TESTS_BY_AGE[ageGroup]?.[0];
  return (
    (baselineId ? testsById.get(baselineId) : undefined) ||
    BADMINTON_TESTS.find((t) => t.ageGroup === ageGroup)
  );
}

function pickNextProgressionTest(
  linkedTestIds: string[],
  latestTestId: string,
  ageGroup: AssessmentAgeGroup,
  masteredTestIds: Set<string>,
  testsById: Map<string, BadmintonTest>
): BadmintonTest | undefined {
  const latestIdx = linkedTestIds.indexOf(latestTestId);

  // 1. Търсим следващия неусвоен тест след последния проведен тест в ascending реда
  if (latestIdx >= 0) {
    for (let i = latestIdx + 1; i < linkedTestIds.length; i++) {
      const tid = linkedTestIds[i];
      if (!masteredTestIds.has(tid)) {
        const candidate = testsById.get(tid);
        if (candidate) return candidate;
      }
    }
  }

  // 2. Fallback: търсим неусвоен тест от по-висока възрастова категория спрямо текущата
  const currentAgeIdx = AGE_GROUP_ORDER.indexOf(ageGroup);
  for (const tid of linkedTestIds) {
    if (masteredTestIds.has(tid)) continue;
    const candidate = testsById.get(tid);
    if (
      candidate &&
      AGE_GROUP_ORDER.indexOf(candidate.ageGroup) > currentAgeIdx
    ) {
      return candidate;
    }
  }

  return undefined;
}

/**
 * Изчислява колко тренировки по всеки фундамент е провел състезателят
 * СЛЕД датата на последния му тест за съответния фундамент.
 */
export function countTrainingsPerFundamentalSinceLastTest(
  attendances: SessionAttendance[],
  assessments: MemberAssessment[],
  sessionsById?: Map<string, PlannerSession>
): Partial<Record<FundamentalId, number>> {
  const counts: Partial<Record<FundamentalId, number>> = {};

  for (const fid of SKILL_FUNDAMENTAL_IDS) {
    const chapter = BWF_FUNDAMENTAL_BY_ID[fid];
    const latestAssessmentTime = assessments
      .filter((a) => chapter.linkedTestIds.includes(a.testId))
      .reduce((max, a) => {
        const ts = new Date(a.date).getTime();
        return Number.isNaN(ts) ? max : Math.max(max, ts);
      }, 0);

    const shortLower = chapter.shortTitle.toLowerCase();
    const titleLower = chapter.title.toLowerCase();

    let count = 0;
    for (const att of attendances) {
      const attTs = new Date(att.date).getTime();
      if (Number.isNaN(attTs) || attTs <= latestAssessmentTime) continue;

      let matched = false;

      if (att.fundamentalId) {
        matched = att.fundamentalId === fid;
      } else {
        // Fallback 1: проверка в smartPlan.courts на сесията
        const session = sessionsById?.get(att.sessionId);
        if (session?.smartPlan && typeof session.smartPlan === "object") {
          const smart = session.smartPlan as {
            courts?: Array<{
              fundamentalId?: string;
              memberIds?: string[];
              players?: Array<{ memberId?: string; id?: string }>;
            }>;
          };
          if (Array.isArray(smart.courts)) {
            matched = smart.courts.some((court) => {
              if (court.fundamentalId !== fid) return false;
              const hasMembers =
                (Array.isArray(court.memberIds) &&
                  court.memberIds.length > 0) ||
                (Array.isArray(court.players) && court.players.length > 0);
              if (!hasMembers) return true;
              return (
                court.memberIds?.includes(att.memberId) ||
                court.players?.some(
                  (p) => p.memberId === att.memberId || p.id === att.memberId
                ) ||
                false
              );
            });
          }
        }

        // Fallback 2: проверка по фокус/заглавие на сесията или бележката на присъствието
        if (!matched) {
          const textToCheck = [att.note, session?.focus, session?.title]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (
            textToCheck &&
            (textToCheck.includes(shortLower) ||
              textToCheck.includes(titleLower))
          ) {
            matched = true;
          }
        }
      }

      if (matched) count++;
    }

    counts[fid] = count;
  }

  return counts;
}

export interface EvaluateMemberContext {
  memberId: string;
  birthDate?: string | null;
  assessments: MemberAssessment[];
  beepResults?: BeepTestResult[];
  /** Брой тренировки по даден фундамент след последния тест (по fundamentalId) */
  trainingsPerFundamental?: Partial<Record<FundamentalId, number>>;
  /** Дали състезателят е бил на турнир/командировка в последните 48 ч. */
  hadRecentCompetition?: boolean;
  /** Дали се връща след отсъствие/боледуване в последните 7 дни */
  returningFromAbsence?: boolean;
  /** Отбелязан медицински дискомфорт (напр. "discomfort" / "injured") */
  medicalStatus?: "healthy" | "discomfort" | "injured";
}

/**
 * Изчислява пълната „Карта на фундаментите“ и треньорските сигнали за състезател.
 * 100% детерминистична функция — без мрежови заявки и без AI квоти.
 */
export function evaluateMemberFundamentals(
  ctx: EvaluateMemberContext
): MemberFundamentalProfile {
  const ageGroup = inferAgeGroupFromBirthDate(ctx.birthDate);
  const testsById = new Map(BADMINTON_TESTS.map((t) => [t.id, t]));

  // Подреждаме оценките от най-новата към най-старата
  const sortedAssessments = [...ctx.assessments].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Изчисляваме кои тестове вече са усвоени (>=80% на последния опит за съответния тест)
  const masteredTestIds = new Set<string>();
  const seenTestIds = new Set<string>();
  for (const a of sortedAssessments) {
    if (seenTestIds.has(a.testId)) continue;
    seenTestIds.add(a.testId);
    const pct = normalizeScoreToPercent(a, testsById.get(a.testId));
    if (pct >= 80) {
      masteredTestIds.add(a.testId);
    }
  }

  const evaluations: FundamentalEvaluation[] = SKILL_FUNDAMENTAL_IDS.map(
    (fid) => {
      const chapter = BWF_FUNDAMENTAL_BY_ID[fid];
      const latest = sortedAssessments.find((a) =>
        chapter.linkedTestIds.includes(a.testId)
      );
      const baseRecommendedTest = pickRecommendedTestForFundamental(
        fid,
        ageGroup,
        testsById
      );
      const trainingsSinceLastTest = ctx.trainingsPerFundamental?.[fid] ?? 0;

      if (!latest) {
        return {
          fundamentalId: fid,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          shortTitle: chapter.shortTitle,
          status: "untested",
          scorePercent: null,
          recommendedTest: baseRecommendedTest,
          isProgressionTest: false,
          trainingsSinceLastTest,
          readyForRetest: false,
        };
      }

      const testDef = testsById.get(latest.testId);
      const scorePercent = normalizeScoreToPercent(latest, testDef);

      let status: ProgressionStage;
      if (scorePercent < 50) {
        status = "learn";
      } else if (scorePercent < 80) {
        status = "consolidate";
      } else {
        status = "apply";
      }

      const readyForRetest =
        (status === "learn" || status === "consolidate") &&
        trainingsSinceLastTest >= RETEST_TRAINING_THRESHOLD;

      let recommendedTest = testDef || baseRecommendedTest;
      let isProgressionTest = false;

      if (status === "apply") {
        const nextProgression = pickNextProgressionTest(
          chapter.linkedTestIds,
          latest.testId,
          ageGroup,
          masteredTestIds,
          testsById
        );
        if (nextProgression) {
          recommendedTest = nextProgression;
          isProgressionTest = true;
        }
      }

      return {
        fundamentalId: fid,
        chapterNumber: chapter.chapterNumber,
        title: chapter.title,
        shortTitle: chapter.shortTitle,
        status,
        latestAssessment: latest,
        scorePercent,
        recommendedTest,
        isProgressionTest,
        trainingsSinceLastTest,
        readyForRetest,
      };
    }
  );

  const signals: CoachSignal[] = [];

  // 1. Проверка за 5/5 тренировки -> контролен тест
  for (const ev of evaluations) {
    if (ev.readyForRetest && ev.recommendedTest) {
      signals.push({
        kind: "retest_ready",
        label: `5/5 контролен тест: ${ev.shortTitle}`,
        detail: `Вече има ${ev.trainingsSinceLastTest} тренировки по „${ev.title}“ — време е за контролен тест (${ev.recommendedTest.name}).`,
        severity: "action",
        testId: ev.recommendedTest.id,
        fundamentalId: ev.fundamentalId,
      });
    }
  }

  // 2. Проверка за липсващо входно ниво
  const needsBaseline = sortedAssessments.length === 0;
  const baselineIds = BASELINE_TESTS_BY_AGE[ageGroup] || [];
  const nextBaselineId =
    baselineIds.find((id) => !sortedAssessments.some((a) => a.testId === id)) ||
    baselineIds[0];
  const nextBaselineTest = nextBaselineId
    ? testsById.get(nextBaselineId)
    : undefined;

  if (needsBaseline && nextBaselineTest) {
    signals.push({
      kind: "missing_baseline",
      label: `Липсва входен тест (${ageGroup})`,
      detail: `Проведете „${nextBaselineTest.name}“, за да определите началното ниво.`,
      severity: "warning",
      testId: nextBaselineTest.id,
    });
  }

  // 3. След състезание / турнир
  if (ctx.hadRecentCompetition) {
    signals.push({
      kind: "post_competition",
      label: "След състезание",
      detail:
        "Участвал в турнир/командировка през последните 48 ч. — препоръчано е по-леко техническо възстановяване.",
      severity: "info",
    });
  }

  // 4. Връщане след отсъствие / боледуване
  if (ctx.returningFromAbsence) {
    signals.push({
      kind: "returning_from_absence",
      label: "След отсъствие",
      detail:
        "Връща се след отсъствие/боледуване — намалете интензивността в основната част.",
      severity: "warning",
    });
  }

  // 5. Медицински дискомфорт
  if (ctx.medicalStatus === "discomfort" || ctx.medicalStatus === "injured") {
    signals.push({
      kind: "medical_discomfort",
      label: ctx.medicalStatus === "injured" ? "Травма" : "Дискомфорт",
      detail:
        "Избягвайте тежки скокове и максимални смашове; включете превантивни упражнения.",
      severity: "warning",
    });
  }

  // 6. Аеробен капацитет от Бийп тест
  const latestBeep = (ctx.beepResults || [])[0];
  if (latestBeep && (latestBeep.score === "Лош" || latestBeep.vo2max < 36)) {
    signals.push({
      kind: "low_aerobic",
      label: `Нисък VO2 Max (${latestBeep.vo2max})`,
      detail:
        "Препоръчани са по-кратки работни интервали с по-дълга почивка в Shadow и физическите блокове.",
      severity: "info",
    });
  }

  // Определяне на основен фокус за днешната тренировка:
  // Най-ниският тестван фундамент (<80%), иначе първият нетестван (започвайки от split-step / grips)
  const weakTested = evaluations
    .filter((e) => e.scorePercent !== null && e.scorePercent < 80)
    .sort((a, b) => (a.scorePercent ?? 100) - (b.scorePercent ?? 100));

  const primaryFocusFundamental: FundamentalId =
    weakTested[0]?.fundamentalId ||
    evaluations.find((e) => e.status === "untested")?.fundamentalId ||
    "split-step";

  const recommendLightLoad = Boolean(
    ctx.hadRecentCompetition ||
    ctx.returningFromAbsence ||
    ctx.medicalStatus === "discomfort" ||
    ctx.medicalStatus === "injured"
  );

  return {
    memberId: ctx.memberId,
    ageGroup,
    evaluations,
    primaryFocusFundamental,
    needsBaseline,
    nextBaselineTest,
    signals,
    recommendLightLoad,
  };
}

/**
 * Детерминистичен подбор на упражнение без повторение (Anti-Repetition Engine):
 * Ако детето идва 3 пъти седмично за един и същ слаб фундамент, системата завърта
 * различни упражнения/игри от този фундамент, вместо да дава едно и също.
 */
export function pickNonRepeatingExercise(params: {
  fundamentalId: FundamentalId;
  stage: ProgressionStage;
  exercises: Exercise[];
  recentlyUsedNames: string[];
  availableEquipment?: string[];
  allowCoachFeed: boolean;
  preferGamesOnly?: boolean;
  avoidHighImpact?: boolean;
  rotationSeed?: number;
}): Exercise | null {
  const {
    fundamentalId,
    stage,
    exercises,
    recentlyUsedNames,
    availableEquipment,
    allowCoachFeed,
    preferGamesOnly = false,
    avoidHighImpact = false,
    rotationSeed = 0,
  } = params;

  const recentSet = new Set(recentlyUsedNames);
  const equipmentSet =
    availableEquipment && availableEquipment.length > 0
      ? new Set(availableEquipment.map((e) => e.toLowerCase()))
      : null;

  const matchesEquipment = (ex: Exercise) => {
    if (!equipmentSet) return true;
    const req = (ex.equipment || []).filter(
      (item) => item.toLowerCase() !== "ракета" && item.toLowerCase() !== "пера"
    );
    if (req.length === 0) return true;
    return req.every((item) => equipmentSet.has(item.toLowerCase()));
  };

  let candidates = exercises.filter(
    (ex) => inferFundamentalId(ex) === fundamentalId
  );
  if (candidates.length === 0) return null;

  // Филтър за 1 треньор (ако вече има корт с multifeed, избираме самостоятелни упражнения)
  if (!allowCoachFeed) {
    const independent = candidates.filter((ex) => !ex.coachFeedRequired);
    if (independent.length > 0) candidates = independent;
  }

  // Филтър по инвентар
  const equipMatched = candidates.filter(matchesEquipment);
  if (equipMatched.length > 0) candidates = equipMatched;

  // При дискомфорт/след турнир — избягваме максимална интензивност (5)
  if (avoidHighImpact) {
    const lowImpact = candidates.filter((ex) => (ex.intensity ?? 3) <= 3);
    if (lowImpact.length > 0) candidates = lowImpact;
  }

  // При игрови ден — приоритет на категория "games"
  if (preferGamesOnly) {
    const games = candidates.filter((ex) => ex.category === "games");
    if (games.length > 0) candidates = games;
  } else {
    // Предпочитаме точния етап на прогресия, но позволяваме fallback в рамките на фундамента
    const exactStage = candidates.filter((ex) => ex.progressionStage === stage);
    if (exactStage.length > 0) candidates = exactStage;
  }

  // Анти-повторение: първо търсим упражнения, които НЕ са ползвани в последните тренировки
  const fresh = candidates.filter((ex) => !recentSet.has(ex.name));
  const pool = fresh.length > 0 ? fresh : candidates;

  return pool[Math.abs(rotationSeed) % pool.length] || null;
}
