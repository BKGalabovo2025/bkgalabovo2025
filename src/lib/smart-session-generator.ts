import { BWF_FUNDAMENTAL_BY_ID } from "@/lib/bwf-fundamentals";
import {
  BWF_TEXTBOOK_EXERCISES,
  inferFundamentalId,
} from "@/lib/exercises/bwf-textbook";
import {
  type MemberFundamentalProfile,
  pickNonRepeatingExercise,
  SKILL_FUNDAMENTAL_IDS,
} from "@/lib/fundamental-engine";
import type { Member } from "@/types/member.types";
import type {
  Exercise,
  FundamentalId,
  PlannerSession,
  ProgressionStage,
  SessionBlock,
} from "@/types/planner.types";

export type DayMode =
  "standard" | "testing" | "pre_competition" | "games_recovery";

export type MainStructureMode = "blocks" | "stations";
export type OverflowMode = "triples" | "off_court_station";
export type MatchPairingMode = "balanced" | "handicap";

export interface DayModeMeta {
  id: DayMode;
  label: string;
  shortLabel: string;
  whenToUse: string;
}

export const DAY_MODE_META: Record<DayMode, DayModeMeta> = {
  standard: {
    id: "standard",
    label: "🎯 Стандартен тренировъчен ден",
    shortLabel: "Стандартен",
    whenToUse:
      "Основният режим за 80% от тренировките. Системата чете досието на всяко дете, групира ги по кортове според сходните слаби фундаменти (дори при смесени възрасти) и завърта нови вариации без повторение.",
  },
  testing: {
    id: "testing",
    label: "🧪 Тестов ден (Диагностика по станции)",
    shortLabel: "Тестов ден",
    whenToUse:
      "Използвайте в началото на сезона, при нови деца без входно ниво или когато няколко състезатели са стигнали 5/5 тренировки. Основната част се превръща в 5–6 тестови станции по кортовете за бързо масово тестване.",
  },
  pre_competition: {
    id: "pre_competition",
    label: "⚡ Предсъстезателен ден (Активация без умора)",
    shortLabel: "Предсъстезателен",
    whenToUse:
      "Използвайте 1–2 дни преди официален турнир. Намалява обема и физическата умора, като фокусира върху точност на сервиса, първи 3 удара, къси остри разигравания и увереност.",
  },
  games_recovery: {
    id: "games_recovery",
    label: "🎮 Игрови / Възстановителен ден",
    shortLabel: "Игрови / Възст.",
    whenToUse:
      "Използвайте в ден след тежък турнир, в края на натоварена седмица (напр. петък) или при уморена група. Затвърждава слабите фундаменти изцяло чрез BWF игри и забавни вариации с нисък стрес.",
  },
};

export interface SmartAttendee {
  member: Member;
  profile: MemberFundamentalProfile;
  recentlyUsedExerciseNames: string[];
}

export interface SmartCourtDiagnosticAlert {
  memberId: string;
  memberName: string;
  kind: "missing_baseline" | "retest_ready";
  testId: string;
  testName: string;
}

export interface SmartCourtAssignment {
  id: string;
  courtNumber: number; // 1..N (0 за станция извън корта)
  isOffCourt: boolean;
  label: string;
  players: {
    memberId: string;
    name: string;
    ageGroup: string;
    recommendLightLoad: boolean;
  }[];
  fundamentalId: FundamentalId;
  stage: ProgressionStage;
  exercise: Exercise;
  isCoachCourt: boolean;
  diagnosticAlerts: SmartCourtDiagnosticAlert[];
  rotationSeed: number;
}

export interface SmartMatchPairing {
  playerA: { memberId: string; name: string; ageGroup: string };
  playerB: { memberId: string; name: string; ageGroup: string };
  handicapSuggestion?: string;
}

export interface WeeklyBalanceReport {
  totalSessionsAnalyzed: number;
  distribution: {
    fundamentalId: FundamentalId;
    shortTitle: string;
    percent: number;
    count: number;
  }[];
  neglected: {
    fundamentalId: FundamentalId;
    shortTitle: string;
  }[];
}

export interface SmartTrainingPlan {
  dayMode: DayMode;
  mainStructure: MainStructureMode;
  overflowMode: OverflowMode;
  overflowRecommendation: {
    recommended: OverflowMode;
    reason: string;
  };
  totalMinutes: number;
  warmupMinutes: number;
  mainMinutes: number;
  cooldownMinutes: number;
  courtsCount: number;
  selectedEquipment: string[];
  warmupCore: Exercise[];
  warmupVariantKids: Exercise | null;
  warmupVariantOlder: Exercise | null;
  selectedWarmupVariant: "both" | "kids" | "older";
  courts: SmartCourtAssignment[];
  shadowBlock?: {
    durationMinutes: number;
    corners: number[];
    reason: string;
  };
  matchesBlock?: {
    durationMinutes: number;
    countsForRanking: boolean;
    pairingMode: MatchPairingMode;
    balancedPairings: SmartMatchPairing[];
    handicapPairings: SmartMatchPairing[];
  };
  cooldownItems: Exercise[];
  weeklyBalance?: WeeklyBalanceReport;
}

export interface SmartGeneratorInput {
  attendees: SmartAttendee[];
  exercises: Exercise[];
  courtsCount: number;
  totalMinutes: number;
  warmupMinutes: number;
  mainMinutes: number;
  cooldownMinutes: number;
  selectedEquipment: string[];
  dayMode: DayMode;
  mainStructure: MainStructureMode;
  overflowMode?: OverflowMode;
  includeShadow: boolean;
  shadowMinutes?: number;
  includeMatches: boolean;
  matchesMinutes?: number;
  matchesCountForRanking?: boolean;
  matchPairingMode?: MatchPairingMode;
  recentSessions?: PlannerSession[];
  rotationOffset?: number;
}

export function recommendOverflowMode(params: {
  attendeesCount: number;
  courtsCount: number;
  dayMode: DayMode;
  includeShadow: boolean;
}): { recommended: OverflowMode; reason: string } {
  const capacity = params.courtsCount * 2;
  if (params.attendeesCount <= capacity) {
    return {
      recommended: "triples",
      reason:
        "Всички присъстващи се побират по двойки на избраните кортове (при нечетен брой: 1 тройка 2v1).",
    };
  }
  if (params.includeShadow || params.dayMode === "testing") {
    return {
      recommended: "off_court_station",
      reason: `Има ${params.attendeesCount} деца за ${params.courtsCount} корта — препоръчваме станция извън корта (Shadow / физическа / тестова), за да играят останалите чисто 1v1 с ротация.`,
    };
  }
  return {
    recommended: "triples",
    reason: `Има ${params.attendeesCount} деца за ${params.courtsCount} корта — при технически и защитни упражнения тройките (2v1 с ротация) дават повече докосвания на перото.`,
  };
}

export function computeWeeklyBalance(
  recentSessions: PlannerSession[],
  daysBack = 14
): WeeklyBalanceReport {
  const cutoff = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  const relevant = recentSessions.filter((s) => {
    const t = new Date(s.date).getTime();
    return !Number.isNaN(t) && t >= cutoff && !s.isCancelled;
  });

  const counts = new Map<FundamentalId, number>();
  for (const fid of SKILL_FUNDAMENTAL_IDS) counts.set(fid, 0);

  let totalHits = 0;
  for (const session of relevant) {
    const sessionExercises: Exercise[] = [];
    for (const block of session.blocks || []) {
      if (block.phase !== "main") continue;
      for (const item of block.items || []) {
        if (item.exercise) sessionExercises.push(item.exercise);
        for (const rot of item.rotations || []) {
          if (rot.exercise) sessionExercises.push(rot.exercise);
        }
      }
    }
    for (const ex of session.exercises || []) {
      sessionExercises.push(ex);
    }

    for (const ex of sessionExercises) {
      const fid = inferFundamentalId(ex);
      if (counts.has(fid)) {
        counts.set(fid, (counts.get(fid) || 0) + 1);
        totalHits++;
      }
    }
  }

  const distribution = SKILL_FUNDAMENTAL_IDS.map((fid) => {
    const count = counts.get(fid) || 0;
    const percent = totalHits > 0 ? Math.round((count / totalHits) * 100) : 0;
    return {
      fundamentalId: fid,
      shortTitle: BWF_FUNDAMENTAL_BY_ID[fid].shortTitle,
      percent,
      count,
    };
  }).sort((a, b) => b.count - a.count);

  const neglected = distribution
    .filter((d) => d.count === 0)
    .slice(0, 3)
    .map((d) => ({
      fundamentalId: d.fundamentalId,
      shortTitle: d.shortTitle,
    }));

  return {
    totalSessionsAnalyzed: relevant.length,
    distribution,
    neglected,
  };
}

function ageGroupRank(ageGroup: string): number {
  const order: Record<string, number> = {
    U9: 1,
    U11: 2,
    U13: 3,
    U15: 4,
    U17: 5,
    U19: 6,
    "Мъже и Жени": 7,
  };
  return order[ageGroup] ?? 3;
}

function buildMatchPairings(attendees: SmartAttendee[]): {
  balancedPairings: SmartMatchPairing[];
  handicapPairings: SmartMatchPairing[];
} {
  const sorted = [...attendees].sort((a, b) => {
    const scoreA =
      (a.member.rankingPoints || 0) + ageGroupRank(a.profile.ageGroup) * 100;
    const scoreB =
      (b.member.rankingPoints || 0) + ageGroupRank(b.profile.ageGroup) * 100;
    return scoreB - scoreA;
  });

  const balancedPairings: SmartMatchPairing[] = [];
  for (let i = 0; i + 1 < sorted.length; i += 2) {
    balancedPairings.push({
      playerA: {
        memberId: sorted[i].member.id,
        name: `${sorted[i].member.firstName} ${sorted[i].member.lastName}`.trim(),
        ageGroup: sorted[i].profile.ageGroup,
      },
      playerB: {
        memberId: sorted[i + 1].member.id,
        name: `${sorted[i + 1].member.firstName} ${sorted[i + 1].member.lastName}`.trim(),
        ageGroup: sorted[i + 1].profile.ageGroup,
      },
    });
  }

  // Мотивационен хендикап: най-силният срещу най-младия с преднина
  const handicapPairings: SmartMatchPairing[] = [];
  let left = 0;
  let right = sorted.length - 1;
  while (left < right) {
    const strong = sorted[left];
    const young = sorted[right];
    const rankDiff = Math.max(
      1,
      ageGroupRank(strong.profile.ageGroup) -
        ageGroupRank(young.profile.ageGroup)
    );
    const lead = Math.min(7, 2 + rankDiff);
    handicapPairings.push({
      playerA: {
        memberId: strong.member.id,
        name: `${strong.member.firstName} ${strong.member.lastName}`.trim(),
        ageGroup: strong.profile.ageGroup,
      },
      playerB: {
        memberId: young.member.id,
        name: `${young.member.firstName} ${young.member.lastName}`.trim(),
        ageGroup: young.profile.ageGroup,
      },
      handicapSuggestion: `${young.member.firstName} започва от ${lead}:0 (гейм до 11)`,
    });
    left++;
    right--;
  }

  return { balancedPairings, handicapPairings };
}

function buildFallbackExercises(): Exercise[] {
  return BWF_TEXTBOOK_EXERCISES.map((seed, idx) => ({
    ...seed,
    id: `textbook-${idx}`,
    siteId: "bkgalabovo",
    createdAt: "",
    updatedAt: "",
  }));
}

/**
 * Детерминистичен Умен Генератор на Дневна Тренировка (без AI квоти).
 */
export function generateSmartTrainingPlan(
  input: SmartGeneratorInput
): SmartTrainingPlan {
  const pool =
    input.exercises.length > 0 ? input.exercises : buildFallbackExercises();
  const safeCourts = Math.max(1, Math.min(6, input.courtsCount));
  const rotationOffset = input.rotationOffset ?? 0;

  // 1. Загрявка (точни серии × повторения + 2 паралелни варианта при смесени възрасти)
  const warmupExercises = pool.filter(
    (e) => e.category === "warmup" || e.phase === "warmup"
  );
  const warmupVariantKids =
    warmupExercises.find((e) => e.name.includes("4А")) || null;
  const warmupVariantOlder =
    warmupExercises.find((e) => e.name.includes("4Б")) || null;

  const coreCandidates = warmupExercises.filter(
    (e) => e !== warmupVariantKids && e !== warmupVariantOlder
  );
  const warmupCore: Exercise[] = [];
  let warmupAcc = 0;
  const activationBudget = warmupVariantKids || warmupVariantOlder ? 4 : 0;
  for (const ex of coreCandidates) {
    if (
      warmupAcc + ex.durationMinutes <=
      Math.max(4, input.warmupMinutes - activationBudget)
    ) {
      warmupCore.push(ex);
      warmupAcc += ex.durationMinutes;
    }
  }
  if (warmupCore.length === 0 && coreCandidates[0]) {
    warmupCore.push(coreCandidates[0]);
  }

  // 2. Препоръка за нечетен брой / повече деца от кортовете
  const overflowRecommendation = recommendOverflowMode({
    attendeesCount: input.attendees.length,
    courtsCount: safeCourts,
    dayMode: input.dayMode,
    includeShadow: input.includeShadow,
  });
  const overflowMode = input.overflowMode ?? overflowRecommendation.recommended;

  // 3. Групиране на присъстващите по сходен слаб фундамент (дори U9 + U15 заедно!)
  const groupedByFocus = new Map<FundamentalId, SmartAttendee[]>();
  for (const att of input.attendees) {
    const focus =
      input.dayMode === "pre_competition"
        ? "serve-receive"
        : att.profile.primaryFocusFundamental;
    const list = groupedByFocus.get(focus) || [];
    list.push(att);
    groupedByFocus.set(focus, list);
  }

  // Разпределяне в корт-групи (по 2 души; остатъкът в тройка или станция извън корта)
  const rawCourtBuckets: {
    fundamentalId: FundamentalId;
    attendees: SmartAttendee[];
    isOffCourt: boolean;
  }[] = [];
  const leftovers: { fundamentalId: FundamentalId; attendee: SmartAttendee }[] =
    [];

  for (const [fid, list] of groupedByFocus.entries()) {
    for (let i = 0; i < list.length; i += 2) {
      if (i + 1 < list.length && rawCourtBuckets.length < safeCourts) {
        rawCourtBuckets.push({
          fundamentalId: fid,
          attendees: [list[i], list[i + 1]],
          isOffCourt: false,
        });
      } else {
        for (let j = i; j < Math.min(i + 2, list.length); j++) {
          leftovers.push({ fundamentalId: fid, attendee: list[j] });
        }
      }
    }
  }

  // Сдвояваме остатъците на свободни кортове
  while (leftovers.length >= 2 && rawCourtBuckets.length < safeCourts) {
    const first = leftovers.shift()!;
    const second = leftovers.shift()!;
    rawCourtBuckets.push({
      fundamentalId: first.fundamentalId,
      attendees: [first.attendee, second.attendee],
      isOffCourt: false,
    });
  }

  // Последни остатъци (нечетен брой или повече деца от 2 × кортове)
  if (leftovers.length > 0) {
    if (overflowMode === "off_court_station" || rawCourtBuckets.length === 0) {
      rawCourtBuckets.push({
        fundamentalId: leftovers[0].fundamentalId,
        attendees: leftovers.map((l) => l.attendee),
        isOffCourt: rawCourtBuckets.length >= safeCourts,
      });
    } else {
      // Разпределяме ги като тройки (2v1) по съществуващите кортове
      leftovers.forEach((l, idx) => {
        const target = rawCourtBuckets[idx % rawCourtBuckets.length];
        target.attendees.push(l.attendee);
      });
    }
  }

  // 4. Избор на конкретно упражнение за всеки корт (Правило: макс. 1 треньорски корт!)
  let coachCourtUsed = false;
  let courtNum = 0;

  const courts: SmartCourtAssignment[] = rawCourtBuckets.map((bucket, idx) => {
    const isOffCourt = bucket.isOffCourt;
    const assignedCourtNum = isOffCourt ? 0 : ++courtNum;

    const recentNames = Array.from(
      new Set(bucket.attendees.flatMap((a) => a.recentlyUsedExerciseNames))
    );

    const avoidHighImpact = bucket.attendees.some(
      (a) => a.profile.recommendLightLoad
    );

    // Определяме етапа според най-ниския статус в групата
    const statuses = bucket.attendees.map((a) => {
      const ev = a.profile.evaluations.find(
        (e) => e.fundamentalId === bucket.fundamentalId
      );
      return ev?.status || "learn";
    });
    const stage: ProgressionStage =
      statuses.includes("learn") || statuses.includes("untested")
        ? "learn"
        : statuses.includes("consolidate")
          ? "consolidate"
          : "apply";

    const allowCoachFeed = !coachCourtUsed && !isOffCourt;

    const chosen =
      pickNonRepeatingExercise({
        fundamentalId: bucket.fundamentalId,
        stage,
        exercises: pool,
        recentlyUsedNames: recentNames,
        availableEquipment: input.selectedEquipment,
        allowCoachFeed,
        preferGamesOnly: input.dayMode === "games_recovery",
        avoidHighImpact: avoidHighImpact || input.dayMode === "pre_competition",
        rotationSeed: rotationOffset + idx,
      }) ||
      pool.find((e) => e.category !== "warmup" && e.category !== "cooldown") ||
      pool[0];

    const isCoachCourt = Boolean(chosen.coachFeedRequired && allowCoachFeed);
    if (isCoachCourt) coachCourtUsed = true;

    // Събираме диагностичните сигнали (липсващ входен тест или 5/5 контролен тест)
    const diagnosticAlerts: SmartCourtDiagnosticAlert[] = [];
    for (const att of bucket.attendees) {
      const name = `${att.member.firstName} ${att.member.lastName}`.trim();
      if (att.profile.needsBaseline && att.profile.nextBaselineTest) {
        diagnosticAlerts.push({
          memberId: att.member.id,
          memberName: name,
          kind: "missing_baseline",
          testId: att.profile.nextBaselineTest.id,
          testName: att.profile.nextBaselineTest.name,
        });
      } else {
        const retestSig = att.profile.signals.find(
          (s) => s.kind === "retest_ready" && s.testId
        );
        if (retestSig && retestSig.testId) {
          diagnosticAlerts.push({
            memberId: att.member.id,
            memberName: name,
            kind: "retest_ready",
            testId: retestSig.testId,
            testName: retestSig.label,
          });
        }
      }
    }

    const label = isOffCourt
      ? "Извън корта (Станция)"
      : input.dayMode === "testing"
        ? `Корт ${assignedCourtNum} — Тестова станция`
        : `Корт ${assignedCourtNum}`;

    return {
      id: `court-${idx + 1}`,
      courtNumber: assignedCourtNum,
      isOffCourt,
      label,
      players: bucket.attendees.map((a) => ({
        memberId: a.member.id,
        name: `${a.member.firstName} ${a.member.lastName}`.trim(),
        ageGroup: a.profile.ageGroup,
        recommendLightLoad: a.profile.recommendLightLoad,
      })),
      fundamentalId: bucket.fundamentalId,
      stage,
      exercise: chosen,
      isCoachCourt,
      diagnosticAlerts,
      rotationSeed: rotationOffset + idx,
    };
  });

  // 5. Shadow Training блок (ако е избран)
  let shadowBlock: SmartTrainingPlan["shadowBlock"];
  if (input.includeShadow) {
    const cornerSet = new Set<number>();
    for (const c of courts) {
      for (const corner of BWF_FUNDAMENTAL_BY_ID[c.fundamentalId]
        .shadowCorners) {
        cornerSet.add(corner);
      }
    }
    const corners =
      cornerSet.size > 0
        ? Array.from(cornerSet).sort((a, b) => a - b)
        : [1, 2, 5, 6];
    shadowBlock = {
      durationMinutes: input.shadowMinutes ?? 10,
      corners,
      reason: `Ъгли ${corners.join(", ")} — подбрани автоматично спрямо днешните фундаменти.`,
    };
  }

  // 6. Финални срещи / Мини-турнир (ако са избрани)
  let matchesBlock: SmartTrainingPlan["matchesBlock"];
  if (input.includeMatches && input.attendees.length >= 2) {
    const { balancedPairings, handicapPairings } = buildMatchPairings(
      input.attendees
    );
    matchesBlock = {
      durationMinutes: input.matchesMinutes ?? 10,
      countsForRanking: input.matchesCountForRanking ?? false,
      pairingMode: input.matchPairingMode ?? "balanced",
      balancedPairings,
      handicapPairings,
    };
  }

  // 7. Заключителна част (Cool-down)
  const cooldownItems = pool
    .filter((e) => e.category === "cooldown" || e.phase === "cooldown")
    .slice(0, 2);

  // 8. Седмичен баланс (опционален индикатор)
  const weeklyBalance =
    input.recentSessions && input.recentSessions.length > 0
      ? computeWeeklyBalance(input.recentSessions)
      : undefined;

  return {
    dayMode: input.dayMode,
    mainStructure: input.mainStructure,
    overflowMode,
    overflowRecommendation,
    totalMinutes: input.totalMinutes,
    warmupMinutes: input.warmupMinutes,
    mainMinutes: input.mainMinutes,
    cooldownMinutes: input.cooldownMinutes,
    courtsCount: safeCourts,
    selectedEquipment: input.selectedEquipment,
    warmupCore,
    warmupVariantKids,
    warmupVariantOlder,
    selectedWarmupVariant: "both",
    courts,
    shadowBlock,
    matchesBlock,
    cooldownItems,
    weeklyBalance,
  };
}

/**
 * Превръща генерирания SmartTrainingPlan в стандартен PlannerSession за запис във Firestore.
 */
export function smartPlanToPlannerSessionPayload(
  plan: SmartTrainingPlan,
  meta: {
    siteId: string;
    date: string;
    title: string;
    eventId?: string;
    startTime?: string;
    endTime?: string;
  }
): Omit<PlannerSession, "id" | "createdAt" | "updatedAt"> {
  const warmupItems = [
    ...plan.warmupCore,
    ...(plan.selectedWarmupVariant === "kids" && plan.warmupVariantKids
      ? [plan.warmupVariantKids]
      : plan.selectedWarmupVariant === "older" && plan.warmupVariantOlder
        ? [plan.warmupVariantOlder]
        : [plan.warmupVariantKids, plan.warmupVariantOlder].filter(
            (x): x is Exercise => Boolean(x)
          )),
  ];

  const blocks: SessionBlock[] = [
    {
      id: "block-warmup",
      phase: "warmup",
      targetDuration: plan.warmupMinutes,
      items: warmupItems.map((ex, i) => ({
        id: `wu-${i}`,
        type: "exercise",
        durationMinutes: ex.durationMinutes,
        exercise: ex,
      })),
    },
    {
      id: "block-main",
      phase: "main",
      targetDuration: plan.mainMinutes,
      items: plan.courts.map((c, i) => ({
        id: `main-${i}`,
        type: "exercise",
        durationMinutes: c.exercise.durationMinutes,
        exercise: c.exercise,
        targetGroupId: c.id,
      })),
    },
    {
      id: "block-cooldown",
      phase: "cooldown",
      targetDuration: plan.cooldownMinutes,
      items: plan.cooldownItems.map((ex, i) => ({
        id: `cd-${i}`,
        type: "exercise",
        durationMinutes: ex.durationMinutes,
        exercise: ex,
      })),
    },
  ];

  return {
    siteId: meta.siteId,
    date: meta.date,
    mode: "season",
    location: "court",
    title: meta.title,
    startTime: meta.startTime,
    endTime: meta.endTime,
    eventId: meta.eventId,
    totalKids: plan.courts.reduce((sum, c) => sum + c.players.length, 0),
    sessionGroups: plan.courts.map((c) => ({
      id: c.id,
      name: c.label,
      memberIds: c.players.map((p) => p.memberId),
    })),
    blocks,
    focus: DAY_MODE_META[plan.dayMode].shortLabel,
    status: "planned",
    smartPlan: plan as unknown as Record<string, unknown>,
  };
}
