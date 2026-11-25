import { describe, expect, it } from "vitest";

import { BWF_TEXTBOOK_EXERCISES } from "@/lib/exercises/bwf-textbook";
import {
  evaluateMemberFundamentals,
  pickNonRepeatingExercise,
  RETEST_TRAINING_THRESHOLD,
} from "@/lib/fundamental-engine";
import type { MemberAssessment } from "@/types/assessment.types";
import type { Exercise } from "@/types/planner.types";

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
});
