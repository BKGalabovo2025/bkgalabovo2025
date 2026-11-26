import { describe, expect, it } from "vitest";

import { BADMINTON_TESTS } from "@/lib/badminton-tests";
import { BWF_FUNDAMENTAL_BY_ID } from "@/lib/bwf-fundamentals";
import { BWF_TEXTBOOK_EXERCISES } from "@/lib/exercises/bwf-textbook";
import {
  countTrainingsPerFundamentalSinceLastTest,
  evaluateMemberFundamentals,
  pickNonRepeatingExercise,
  RETEST_TRAINING_THRESHOLD,
  SKILL_FUNDAMENTAL_IDS,
} from "@/lib/fundamental-engine";
import type {
  AssessmentAgeGroup,
  MemberAssessment,
} from "@/types/assessment.types";
import type {
  Exercise,
  PlannerSession,
  SessionAttendance,
} from "@/types/planner.types";

const makeAssessment = (
  overrides: Partial<MemberAssessment>
): MemberAssessment => ({
  id: "a1",
  siteId: "bkgalabovo",
  memberId: "m1",
  memberName: "Вероника",
  date: "2026-11-20T10:00:00.000Z",
  testId: "u13_net_spin",
  testName: "Мрежова игра (Net spin)",
  ageGroupAtTest: "U13",
  score: 0,
  scoreDisplay: "0",
  recordedBy: { userId: "coach", userName: "Треньор" },
  createdAt: "2026-11-20T10:00:00.000Z",
  updatedAt: "2026-11-20T10:00:00.000Z",
  ...overrides,
});

describe("fundamental-engine", () => {
  it("flags missing baseline when member has zero assessments", () => {
    const profile = evaluateMemberFundamentals({
      memberId: "m1",
      birthDate: "2018-05-10",
      assessments: [],
    });

    expect(profile.ageGroup).toBe("U9");
    expect(profile.needsBaseline).toBe(true);
    expect(profile.nextBaselineTest?.id).toBe("u9_keep_uppy");
    expect(profile.signals.some((s) => s.kind === "missing_baseline")).toBe(
      true
    );
  });

  it("classifies 0-point assessment as 'learn' and triggers retest after 5 trainings", () => {
    const profile = evaluateMemberFundamentals({
      memberId: "m1",
      birthDate: "2014-03-15",
      assessments: [makeAssessment({ testId: "u13_net_spin", score: 0 })],
      trainingsPerFundamental: { "front-forehand": RETEST_TRAINING_THRESHOLD },
    });

    const ff = profile.evaluations.find(
      (e) => e.fundamentalId === "front-forehand"
    );
    expect(ff?.status).toBe("learn");
    expect(ff?.readyForRetest).toBe(true);
    expect(profile.primaryFocusFundamental).toBe("front-forehand");
    expect(profile.signals.some((s) => s.kind === "retest_ready")).toBe(true);
  });

  it("emits post_competition, absence, medical, and low VO2 signals", () => {
    const profile = evaluateMemberFundamentals({
      memberId: "m2",
      birthDate: "2012-01-01",
      assessments: [makeAssessment({ score: 18 })],
      hadRecentCompetition: true,
      returningFromAbsence: true,
      medicalStatus: "discomfort",
      beepResults: [
        {
          id: "b1",
          siteId: "bkgalabovo",
          memberId: "m2",
          date: "2026-11-10",
          period: "Предсезонна подготовка (Август-Септември)",
          level: 3,
          shuttle: 2,
          vo2max: 32,
          score: "Лош",
          createdAt: "2026-11-10",
          updatedAt: "2026-11-10",
        },
      ],
    });

    expect(profile.recommendLightLoad).toBe(true);
    const kinds = profile.signals.map((s) => s.kind);
    expect(kinds).toContain("post_competition");
    expect(kinds).toContain("returning_from_absence");
    expect(kinds).toContain("medical_discomfort");
    expect(kinds).toContain("low_aerobic");
  });

  it("rotates exercises without repeating recently used ones for the same fundamental", () => {
    const exercises: Exercise[] = BWF_TEXTBOOK_EXERCISES.map((seed, idx) => ({
      ...seed,
      id: `ex-${idx}`,
      siteId: "bkgalabovo",
      createdAt: "",
      updatedAt: "",
    }));

    const day1 = pickNonRepeatingExercise({
      fundamentalId: "front-forehand",
      stage: "consolidate",
      exercises,
      recentlyUsedNames: [],
      allowCoachFeed: false,
    });
    expect(day1).not.toBeNull();

    const day2 = pickNonRepeatingExercise({
      fundamentalId: "front-forehand",
      stage: "consolidate",
      exercises,
      recentlyUsedNames: [day1!.name],
      allowCoachFeed: false,
    });
    expect(day2).not.toBeNull();
    expect(day2!.name).not.toBe(day1!.name);
  });

  it("covers all 9 fundamentals across all 7 age groups with zero overlap between #3/#4 and #6/#7", () => {
    const testsById = new Map(BADMINTON_TESTS.map((t) => [t.id, t]));
    const allAgeGroups: AssessmentAgeGroup[] = [
      "U9",
      "U11",
      "U13",
      "U15",
      "U17",
      "U19",
      "Мъже и Жени",
    ];

    for (const fid of SKILL_FUNDAMENTAL_IDS) {
      const chapter = BWF_FUNDAMENTAL_BY_ID[fid];
      for (const tid of chapter.linkedTestIds) {
        expect(
          testsById.has(tid),
          `Missing test ${tid} in BADMINTON_TESTS`
        ).toBe(true);
      }
      for (const age of allAgeGroups) {
        const hasAgeTest = chapter.linkedTestIds.some(
          (tid) => testsById.get(tid)?.ageGroup === age
        );
        expect(
          hasAgeTest,
          `Fundamental ${fid} is missing a linked test for ${age}`
        ).toBe(true);
      }
    }

    const fh = new Set(BWF_FUNDAMENTAL_BY_ID["front-forehand"].linkedTestIds);
    const bh = BWF_FUNDAMENTAL_BY_ID["front-backhand"].linkedTestIds;
    expect(bh.filter((id) => fh.has(id))).toEqual([]);

    const serve = new Set(BWF_FUNDAMENTAL_BY_ID["serve-receive"].linkedTestIds);
    const clear = BWF_FUNDAMENTAL_BY_ID["clear"].linkedTestIds;
    expect(clear.filter((id) => serve.has(id))).toEqual([]);
  });

  it("normalizes time-based tests using targetTimeSec and higherIsBetter", () => {
    const profile = evaluateMemberFundamentals({
      memberId: "m3",
      birthDate: "2013-04-01",
      assessments: [
        makeAssessment({
          id: "t1",
          testId: "u13_6_point_footwork",
          testName: "Footwork: 6 ъгъла",
          score: 26,
          scoreDisplay: "26 сек.",
        }),
      ],
    });
    const splitStep = profile.evaluations.find(
      (e) => e.fundamentalId === "split-step"
    );
    expect(splitStep?.scorePercent).toBe(95);
    expect(splitStep?.status).toBe("apply");

    const slowerProfile = evaluateMemberFundamentals({
      memberId: "m3",
      birthDate: "2013-04-01",
      assessments: [
        makeAssessment({
          id: "t2",
          testId: "u13_6_point_footwork",
          testName: "Footwork: 6 ъгъла",
          score: 36,
          scoreDisplay: "36 сек.",
        }),
      ],
    });
    const slowerSplit = slowerProfile.evaluations.find(
      (e) => e.fundamentalId === "split-step"
    );
    expect(slowerSplit?.scorePercent).toBeGreaterThanOrEqual(50);
    expect(slowerSplit?.scorePercent).toBeLessThan(80);
    expect(slowerSplit?.status).toBe("consolidate");
  });

  it("recommends the next unpassed progression test when a fundamental is mastered (>=80%)", () => {
    const profile = evaluateMemberFundamentals({
      memberId: "m4",
      birthDate: "2013-06-10",
      assessments: [
        makeAssessment({
          id: "p1",
          testId: "u13_net_spin",
          score: 9,
          scoreDisplay: "9 т.",
        }),
      ],
    });
    const ff = profile.evaluations.find(
      (e) => e.fundamentalId === "front-forehand"
    );
    expect(ff?.status).toBe("apply");
    expect(ff?.isProgressionTest).toBe(true);
    expect(ff?.recommendedTest?.id).toBe("u15_net_kill_spin");
  });

  it("counts trainings per fundamental since last test via fundamentalId, smartPlan, and note", () => {
    const assessments: MemberAssessment[] = [
      makeAssessment({
        id: "a1",
        testId: "u13_net_spin",
        date: "2026-11-10T10:00:00.000Z",
        score: 3,
      }),
    ];
    const sessionsById = new Map<string, PlannerSession>([
      [
        "s2",
        {
          id: "s2",
          siteId: "bkgalabovo",
          date: "2026-11-14T10:00:00.000Z",
          mode: "season",
          location: "court",
          title: "Тренировка",
          status: "completed",
          smartPlan: {
            courts: [{ fundamentalId: "front-forehand", memberIds: ["m1"] }],
          },
          createdAt: "",
          updatedAt: "",
        },
      ],
    ]);
    const attendances: SessionAttendance[] = [
      {
        id: "att0",
        siteId: "bkgalabovo",
        sessionId: "s0",
        memberId: "m1",
        date: "2026-11-09T10:00:00.000Z", // before last test -> ignored
        rpe: 6,
        effort: 4,
        medicalStatus: "healthy",
        fundamentalId: "front-forehand",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "att1",
        siteId: "bkgalabovo",
        sessionId: "s1",
        memberId: "m1",
        date: "2026-11-12T10:00:00.000Z",
        rpe: 7,
        effort: 5,
        medicalStatus: "healthy",
        fundamentalId: "front-forehand",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "att2",
        siteId: "bkgalabovo",
        sessionId: "s2",
        memberId: "m1",
        date: "2026-11-14T10:00:00.000Z",
        rpe: 7,
        effort: 4,
        medicalStatus: "healthy",
        createdAt: "",
        updatedAt: "",
      },
      {
        id: "att3",
        siteId: "bkgalabovo",
        sessionId: "s3",
        memberId: "m1",
        date: "2026-11-16T10:00:00.000Z",
        rpe: 6,
        effort: 4,
        medicalStatus: "healthy",
        note: "Работа по Напред ФХ",
        createdAt: "",
        updatedAt: "",
      },
    ];

    const counts = countTrainingsPerFundamentalSinceLastTest(
      attendances,
      assessments,
      sessionsById
    );
    expect(counts["front-forehand"]).toBe(3);
  });
});
