import { describe, expect, it } from "vitest";

import { BWF_TEXTBOOK_EXERCISES } from "@/lib/exercises/bwf-textbook";
import { evaluateMemberFundamentals } from "@/lib/fundamental-engine";
import {
  computeWeeklyBalance,
  generateSmartTrainingPlan,
  type SmartAttendee,
} from "@/lib/smart-session-generator";
import type { MemberAssessment } from "@/types/assessment.types";
import type { Member } from "@/types/member.types";
import type { Exercise, PlannerSession } from "@/types/planner.types";

const EXERCISES: Exercise[] = BWF_TEXTBOOK_EXERCISES.map((seed, idx) => ({
  ...seed,
  id: `ex-${idx}`,
  siteId: "bkgalabovo",
  createdAt: "",
  updatedAt: "",
}));

function makeAttendee(
  id: string,
  firstName: string,
  birthDate: string,
  assessments: MemberAssessment[] = []
): SmartAttendee {
  const member = {
    id,
    firstName,
    lastName: "Тест",
    dateOfBirth: birthDate,
  } as unknown as Member;
  return {
    member,
    profile: evaluateMemberFundamentals({
      memberId: id,
      birthDate,
      assessments,
    }),
    recentlyUsedExerciseNames: [],
  };
}

describe("smart-session-generator", () => {
  it("pairs mixed-age athletes (U9 + U15) with the same weak fundamental onto one court", () => {
    const weakNetTest = (memberId: string): MemberAssessment => ({
      id: `a-${memberId}`,
      siteId: "bkgalabovo",
      memberId,
      memberName: memberId,
      date: "2026-11-20T10:00:00.000Z",
      testId: "u13_net_spin",
      testName: "Мрежова игра",
      ageGroupAtTest: "U13",
      score: 0,
      scoreDisplay: "0",
      recordedBy: { userId: "c", userName: "Треньор" },
      createdAt: "2026-11-20T10:00:00.000Z",
      updatedAt: "2026-11-20T10:00:00.000Z",
    });

    const u9 = makeAttendee("m1", "Вероника", "2018-05-01", [
      weakNetTest("m1"),
    ]);
    const u15 = makeAttendee("m2", "Георги", "2012-05-01", [weakNetTest("m2")]);

    const plan = generateSmartTrainingPlan({
      attendees: [u9, u15],
      exercises: EXERCISES,
      courtsCount: 5,
      totalMinutes: 90,
      warmupMinutes: 15,
      mainMinutes: 60,
      cooldownMinutes: 15,
      selectedEquipment: ["Конуси"],
      dayMode: "standard",
      mainStructure: "blocks",
      includeShadow: true,
      includeMatches: true,
    });

    expect(plan.courts).toHaveLength(1);
    expect(plan.courts[0].fundamentalId).toBe("front-forehand");
    expect(plan.courts[0].players.map((p) => p.memberId)).toEqual(["m1", "m2"]);
    expect(plan.shadowBlock?.corners).toEqual([2]);
    expect(plan.matchesBlock?.handicapPairings[0].handicapSuggestion).toContain(
      "Вероника"
    );
  });

  it("enforces the 1-coach rule: at most one court requires coach multifeed", () => {
    const attendees = Array.from({ length: 10 }, (_, i) =>
      makeAttendee(`m${i}`, `Дете${i}`, "2013-01-01")
    );

    const plan = generateSmartTrainingPlan({
      attendees,
      exercises: EXERCISES,
      courtsCount: 5,
      totalMinutes: 90,
      warmupMinutes: 15,
      mainMinutes: 60,
      cooldownMinutes: 15,
      selectedEquipment: ["Конуси", "Кош с пера"],
      dayMode: "standard",
      mainStructure: "stations",
      includeShadow: false,
      includeMatches: false,
    });

    const coachCourts = plan.courts.filter((c) => c.isCoachCourt);
    expect(coachCourts.length).toBeLessThanOrEqual(1);
    expect(plan.courts).toHaveLength(5);
  });

  it("computes weekly balance and flags neglected fundamentals", () => {
    const netEx = EXERCISES.find((e) => e.fundamentalId === "front-forehand")!;
    const sessions: PlannerSession[] = [
      {
        id: "s1",
        siteId: "bkgalabovo",
        date: new Date().toISOString(),
        mode: "season",
        location: "court",
        title: "Тест",
        status: "completed",
        blocks: [
          {
            id: "b1",
            phase: "main",
            targetDuration: 60,
            items: [
              {
                id: "i1",
                type: "exercise",
                durationMinutes: 15,
                exercise: netEx,
              },
            ],
          },
        ],
        createdAt: "",
        updatedAt: "",
      },
    ];

    const balance = computeWeeklyBalance(sessions);
    expect(balance.totalSessionsAnalyzed).toBe(1);
    expect(balance.distribution[0].fundamentalId).toBe("front-forehand");
    expect(balance.distribution[0].percent).toBe(100);
    expect(balance.neglected.length).toBeGreaterThan(0);
  });
});
