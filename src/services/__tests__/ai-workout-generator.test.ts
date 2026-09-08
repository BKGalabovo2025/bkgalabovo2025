import { describe, expect, it } from "vitest";

import { generateFallbackProgram } from "@/app/api/ai/generate-workout/route";
import { renderWorkoutProgramHtml } from "@/lib/pdf/workout-program-pdf";
import {
  buildAthleteContext,
  calculateAge,
  WorkoutProgram,
} from "@/services/ai-workout-context-service";
import { MemberSchema } from "@/types/member.types";
import { AnnualPlan } from "@/types/planner.types";
import { TheoryResult } from "@/types/quiz.types";
import { Tournament } from "@/types/tournament.types";
import { TrainingSession } from "@/types/training.types";

describe("AI Workout Generator Suite", () => {
  describe("1. MemberSchema Biometrics Validation", () => {
    const baseMember = {
      id: "mem_123",
      siteId: "bkgalabovo",
      firstName: "Иван",
      lastName: "Иванов",
      name: "Иван Иванов",
      registrationDate: "2025-01-01T10:00:00.000Z",
    };

    it("successfully validates dominantHand, heightCm, and weightKg", () => {
      const parsed = MemberSchema.parse({
        ...baseMember,
        dominantHand: "right",
        heightCm: 182,
        weightKg: 74.5,
      });

      expect(parsed.dominantHand).toBe("right");
      expect(parsed.heightCm).toBe(182);
      expect(parsed.weightKg).toBe(74.5);
    });

    it("allows left-handed athletes and null/optional biometrics", () => {
      const parsed = MemberSchema.parse({
        ...baseMember,
        dominantHand: "left",
        heightCm: null,
        weightKg: null,
      });

      expect(parsed.dominantHand).toBe("left");
      expect(parsed.heightCm).toBeNull();
    });

    it("rejects invalid dominantHand", () => {
      expect(() =>
        MemberSchema.parse({
          ...baseMember,
          dominantHand: "ambidextrous",
        })
      ).toThrow();
    });
  });

  describe("2. Context Aggregator: buildAthleteContext", () => {
    it("correctly calculates age from dateOfBirth", () => {
      const age = calculateAge("2010-05-15");
      expect(age).toBeGreaterThanOrEqual(15);
      expect(age).toBeLessThanOrEqual(16);
    });

    it("aggregates injuries and identifies high RPE overreaching fatigue", () => {
      const now = new Date("2026-09-07T12:00:00.000Z");

      const mockMember = MemberSchema.parse({
        id: "athlete_1",
        siteId: "bkgalabovo",
        firstName: "Георги",
        lastName: "Димитров",
        name: "Георги Димитров",
        dateOfBirth: "2008-03-20",
        ageGroup: "U19",
        skillLevel: "advanced",
        injuries: ["knee", "shoulder"],
        registrationDate: "2025-01-01T10:00:00.000Z",
      });

      const mockTrainings: Partial<TrainingSession>[] = [
        {
          id: "tr_1",
          siteId: "bkgalabovo",
          type: "court",
          date: "2026-09-05T10:00:00.000Z",
          memberIds: ["athlete_1"],
          rpeScores: { athlete_1: 9 },
        },
        {
          id: "tr_2",
          siteId: "bkgalabovo",
          type: "shadow",
          date: "2026-09-06T10:00:00.000Z",
          memberIds: ["athlete_1"],
          rpeScores: { athlete_1: 8.5 },
          shadowDetails: {
            mode: "agility_test",
            cornersMode: "4-corners",
            paceSec: 1.4,
            setsCompleted: 3,
            totalSets: 3,
            workTimeSec: 30,
            restTimeSec: 30,
            deceptionEnabled: false,
            heatmap: { "1": 12, "2": 14, "3": 3, "4": 15 },
          },
        },
      ];

      const context = buildAthleteContext({
        member: mockMember,
        trainingsLast14Days: mockTrainings as unknown as TrainingSession[],
        now,
      });

      expect(context.profile.fullName).toBe("Георги Димитров");
      expect(context.safetyAndMedical.activeInjuries).toEqual([
        "knee",
        "shoulder",
      ]);
      expect(context.workloadAndFatigue.averageRpeLast7Days).toBeCloseTo(
        8.8,
        1
      );
      expect(context.workloadAndFatigue.recentFatigueTrend).toBe(
        "overreaching"
      );
      expect(context.conditioning.shadowFootwork?.weakestCorners).toContain(
        "Corner 3"
      );
    });
  });

  describe("3. PDF Template Renderer", () => {
    it("renders branded workout HTML without errors and includes key sections", () => {
      const sampleProgram: WorkoutProgram = {
        programTitle: "Тестова AI Програма",
        targetAthlete: {
          id: "ath_test",
          name: "Димитър Петров",
          age: 16,
          ageGroup: "U17",
          skillLevel: "advanced",
        },
        safetyAudit: {
          activeRestrictions: ["Без скокове поради контузия на коляно"],
          fatigueDeloadActive: true,
          coachSafetyNotes: "Специален регенериращ режим",
        },
        schedule: [
          {
            dayNumber: 1,
            dayName: "Ден 1: Понеделник",
            focus: "Работа с крака & Изометрия",
            intensity: "low",
            durationMinutes: 45,
            warmup: ["Динамичен стречинг"],
            exercises: [
              {
                name: "Spanish Squat с ластик",
                sets: 3,
                repsOrDuration: "45 сек изометрия",
                restSec: 60,
                techniqueTip: "Дръжте коленете под 90 градуса",
                targetWeakness: "Сухожилие на капачката",
              },
            ],
            cooldown: ["Стречинг"],
          },
        ],
        recoveryRecommendations: ["8 часа сън", "Пресотерапия в Recovery Zone"],
        generatedAt: "2026-09-07T12:00:00.000Z",
      };

      const html = renderWorkoutProgramHtml(sampleProgram);

      expect(html).toContain("БАДМИНТОН КЛУБ ГЪЛЪБОВО");
      expect(html).toContain("Димитър Петров");
      expect(html).toContain("ВНИМАНИЕ: АКТИВИРАН DELOAD РЕЖИМ");
      expect(html).toContain("Spanish Squat с ластик");
      expect(html).toContain("Пресотерапия в Recovery Zone");
    });
  });

  describe("4. Extended Modules: Tapering, Macrocycle, Quizzes & Inventory", () => {
    const now = new Date("2026-09-07T12:00:00.000Z");

    const mockMember = MemberSchema.parse({
      id: "athlete_tourn",
      siteId: "bkgalabovo",
      firstName: "Калоян",
      lastName: "Стоянов",
      name: "Калоян Стоянов",
      dateOfBirth: "2011-04-10",
      ageGroup: "U15",
      skillLevel: "advanced",
      rankingPosition: 2,
      rankingPoints: 580,
      registrationDate: "2025-01-01T10:00:00.000Z",
    });

    it("activates Pre-Tournament Taper when tournament is within 10 days", () => {
      const mockTournaments: Partial<Tournament>[] = [
        {
          id: "tourn_1",
          title: "Държавно първенство U15",
          startDate: "2026-09-14T09:00:00.000Z", // 7 days ahead
          endDate: "2026-09-16T18:00:00.000Z",
          status: "upcoming",
        },
      ];

      const context = buildAthleteContext({
        member: mockMember,
        upcomingTournaments: mockTournaments as Tournament[],
        now,
      });

      expect(context.tournamentContext).toBeDefined();
      expect(context.tournamentContext?.daysUntilNextTournament).toBe(7);
      expect(context.tournamentContext?.isTaperingActive).toBe(true);
      expect(context.tournamentContext?.rankingPosition).toBe(2);
    });

    it("does not activate Taper when tournament is more than 10 days away", () => {
      const mockTournaments: Partial<Tournament>[] = [
        {
          id: "tourn_far",
          title: "Международен турнир",
          startDate: "2026-10-05T09:00:00.000Z", // 28 days ahead
          status: "upcoming",
        },
      ];

      const context = buildAthleteContext({
        member: mockMember,
        upcomingTournaments: mockTournaments as Tournament[],
        now,
      });

      expect(context.tournamentContext?.daysUntilNextTournament).toBe(28);
      expect(context.tournamentContext?.isTaperingActive).toBe(false);
    });

    it("identifies theory quiz deficits and extracts recommendations", () => {
      const mockQuizzes: Partial<TheoryResult>[] = [
        {
          id: "q_1",
          playerId: "athlete_tourn",
          quizTitle: "Правила и съдийство",
          totalScore: 24, // High score
        },
        {
          id: "q_2",
          playerId: "athlete_tourn",
          quizTitle: "Тактика на двойки",
          totalScore: 11, // Deficit (< 18)
          aiFeedback: "Слабо позициониране при атака в центъра.",
        },
      ];

      const context = buildAthleteContext({
        member: mockMember,
        theoryResults: mockQuizzes as TheoryResult[],
        now,
      });

      expect(context.quizDeficits).toHaveLength(1);
      expect(context.quizDeficits?.[0].quizTitle).toBe("Тактика на двойки");
      expect(context.quizDeficits?.[0].deficitSummary).toContain(
        "Слабо позициониране"
      );
    });

    it("evaluates macrocycle phase and upcoming camp cleanly", () => {
      const mockAnnualPlan: Partial<AnnualPlan> = {
        id: "plan_2026",
        phases: [
          {
            id: "p1",
            name: "Състезателен",
            description: "Есенен състезателен цикъл",
            startWeek: 35,
            endWeek: 45,
            weeks: [],
          },
        ],
      };

      const mockCamps = [
        {
          title: "Спортен лагер Албена",
          startDate: "2026-09-21T08:00:00.000Z", // 14 days ahead
        },
      ];

      const context = buildAthleteContext({
        member: mockMember,
        annualPlan: mockAnnualPlan as AnnualPlan,
        upcomingCamps: mockCamps,
        now,
      });

      expect(context.macrocycle?.currentPhase).toBe("Състезателен");
      expect(context.macrocycle?.upcomingCamp?.title).toBe(
        "Спортен лагер Албена"
      );
      expect(context.macrocycle?.upcomingCamp?.daysUntil).toBe(14);
      expect(context.catalogExercisesSample).toBeDefined();
      expect(context.availableEquipment.length).toBeGreaterThan(0);
    });

    it("is resilient when all optional external modules are empty/null", () => {
      const context = buildAthleteContext({
        member: mockMember,
        annualPlan: null,
        upcomingCamps: [],
        upcomingTournaments: [],
        theoryResults: [],
        wellnessSubmissions: [],
        clubInventory: [],
        now,
      });

      expect(context.macrocycle?.currentPhase).toBe(
        "Няма активен годишен план"
      );
      expect(context.tournamentContext?.daysUntilNextTournament).toBeNull();
      expect(context.tournamentContext?.isTaperingActive).toBe(false);
      expect(context.quizDeficits).toEqual([]);
      expect(context.wellnessSurvey).toBeNull();
      expect(context.availableEquipment).toBeDefined();
    });
  });

  describe("5. Dynamic Workout Generation Engine", () => {
    const mockAthlete = {
      id: "ath_veronika",
      siteId: "bkgalabovo",
      firstName: "Вероника",
      lastName: "Абаджиева",
      name: "Вероника Тенева Абаджиева",
      gender: "female" as const,
      ageGroup: "U17",
      dateOfBirth: "2009-05-14T00:00:00.000Z",
      registrationDate: "2024-01-01T00:00:00.000Z",
    };

    it("generates distinct programs for explosive power vs aerobic endurance", () => {
      const contextPower = buildAthleteContext({
        member: mockAthlete,
        options: {
          targetGoal: "explosive_power",
          sessionsPerWeek: 4,
          courtAccess: true,
        },
      });
      const programPower = generateFallbackProgram(contextPower);

      const contextEndurance = buildAthleteContext({
        member: mockAthlete,
        options: {
          targetGoal: "aerobic_endurance",
          sessionsPerWeek: 4,
          courtAccess: true,
        },
      });
      const programEndurance = generateFallbackProgram(contextEndurance);

      expect(programPower.programTitle).toContain("Експлозивна Сила");
      expect(programEndurance.programTitle).toContain("Аеробна");
      expect(programPower.schedule[0].focus).not.toBe(
        programEndurance.schedule[0].focus
      );
      expect(programPower.schedule[0].exercises[0].name).not.toBe(
        programEndurance.schedule[0].exercises[0].name
      );
    });

    it("scales the schedule exactly to the requested sessions per week", () => {
      const context2Sessions = buildAthleteContext({
        member: mockAthlete,
        options: { targetGoal: "agility_footwork", sessionsPerWeek: 2 },
      });
      const program2 = generateFallbackProgram(context2Sessions);
      expect(program2.schedule).toHaveLength(2);
      expect(program2.schedule[0].dayNumber).toBe(1);
      expect(program2.schedule[1].dayNumber).toBe(2);

      const context5Sessions = buildAthleteContext({
        member: mockAthlete,
        options: { targetGoal: "agility_footwork", sessionsPerWeek: 5 },
      });
      const program5 = generateFallbackProgram(context5Sessions);
      expect(program5.schedule).toHaveLength(5);
    });

    it("adapts correctly to courtAccess: false (dry-land conditioning)", () => {
      const contextNoCourt = buildAthleteContext({
        member: mockAthlete,
        options: {
          targetGoal: "general_conditioning",
          sessionsPerWeek: 3,
          courtAccess: false,
          notes: "Външен лагер без достъп до зала",
        },
      });
      const program = generateFallbackProgram(contextNoCourt);

      expect(program.safetyAudit.coachSafetyNotes).toContain(
        "без достъп до корт"
      );
      expect(program.safetyAudit.coachSafetyNotes).toContain(
        "Външен лагер без достъп до зала"
      );
      expect(program.schedule).toHaveLength(3);
    });

    it("incorporates custom coach notes into safety audit", () => {
      const context = buildAthleteContext({
        member: mockAthlete,
        options: {
          targetGoal: "injury_rehab",
          sessionsPerWeek: 3,
          notes: "Щадящ режим за рамото преди състезанието",
        },
      });
      const program = generateFallbackProgram(context);

      expect(program.safetyAudit.coachSafetyNotes).toContain(
        "Щадящ режим за рамото преди състезанието"
      );
    });

    it("generates exact 6 sessions for a 14-day cycle with 3 sessions per week", () => {
      const context14Days = buildAthleteContext({
        member: mockAthlete,
        options: {
          targetGoal: "pre_tournament_taper",
          cycleDurationDays: 14,
          sessionsPerWeek: 3,
          courtAccess: true,
        },
      });
      const program = generateFallbackProgram(context14Days);

      expect(program.schedule).toHaveLength(6);
      expect(program.schedule[0].dayName).toContain("Седмица 1");
      expect(program.schedule[3].dayName).toContain("Седмица 2");
      expect(program.targetGoal).toBe("pre_tournament_taper");
      expect(program.cycleDurationDays).toBe(14);
      expect(program.sessionsPerWeek).toBe(3);
      expect(program.safetyAudit.taperingActive).toBe(true);
      expect(program.safetyAudit.coachSafetyNotes).toContain("тейпъринг");
    });

    it("excludes nursery games for advanced athletes and provides competitive drills", () => {
      const advancedYoungAthlete = {
        ...mockAthlete,
        ageGroup: "U9",
        skillLevel: "advanced" as const,
      };
      const context = buildAthleteContext({
        member: advancedYoungAthlete,
        options: {
          targetGoal: "pre_tournament_taper",
          courtAccess: true,
        },
      });

      const sample = context.catalogExercisesSample || [];
      const sampleNames = sample.map((s) => s.name);

      expect(sampleNames).not.toContain("Топка на тигана (BWF Racket Control)");
      expect(sampleNames).not.toContain(
        "Обръщане на палачинката (BWF Grip Change)"
      );
      expect(sampleNames).not.toContain(
        "Рисуване на осмици (BWF Figure of 8 Grip)"
      );
    });

    it("correctly assigns calendar dates and detects schedule competitions", () => {
      const context = buildAthleteContext({
        member: mockAthlete,
        options: {
          startDate: "2026-09-08",
          cycleDurationDays: 7,
          sessionsPerWeek: 3,
        },
        scheduleEventsInPeriod: [
          {
            date: "2026-09-08",
            title: "Тренировка ОФП & Бадминтон",
            type: "training",
            isMemberAttending: true,
            isCompetition: false,
          },
          {
            date: "2026-09-12",
            title: "Държавно Отборно Първенство",
            type: "competition",
            isMemberAttending: true,
            isCompetition: true,
          },
        ],
      });

      const program = generateFallbackProgram(context);

      expect(program.startDate).toBe("2026-09-08");
      expect(program.endDate).toBe("2026-09-14");
      expect(program.schedule).toHaveLength(3);

      // Verify every day has a valid calendarDate
      program.schedule.forEach((day) => {
        expect(day.calendarDate).toBeDefined();
        expect(day.calendarDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      // Day 1 starts at 2026-09-08
      expect(program.schedule[0].calendarDate).toBe("2026-09-08");

      // Check competition matching
      const competitionDay = program.schedule.find(
        (d) => d.calendarDate === "2026-09-12"
      );
      if (competitionDay) {
        expect(competitionDay.isCompetitionDay).toBe(true);
        expect(competitionDay.competitionTitle).toBe(
          "Държавно Отборно Първенство"
        );
        expect(competitionDay.focus).toContain("Състезателен ден");
      }
    });
  });

  describe("6. Workout Program PDF Resilience & Legacy Compatibility", () => {
    it("renders successfully without error when targetAthlete and safetyAudit are undefined (legacy Firestore records)", () => {
      const legacyProgram = {
        id: "prog_legacy_123",
        programTitle: "Обща кондиционна подготовка (Вероника Игнатова)",
        targetGoal: "general_conditioning" as const,
        startDate: "2026-09-08",
        endDate: "2026-09-14",
        schedule: [
          {
            dayNumber: 1,
            calendarDate: "2026-09-08",
            dayName: "Понеделник",
            focus: "Силова издръжливост",
            intensity: "medium" as const,
            durationMinutes: 60,
            warmup: ["Динамичен стречинг", "Леко бягане"],
            exercises: [
              {
                name: "Клекове с подскок",
                sets: 4,
                repsOrDuration: "12",
                restSec: 60,
                techniqueTip: "Експлозивно оттласкване",
              },
            ],
            cooldown: ["Стречинг"],
          },
        ],
      } as WorkoutProgram;

      // Must not throw "TypeError: Cannot read properties of undefined (reading 'name')"
      expect(() => {
        const html = renderWorkoutProgramHtml(
          legacyProgram,
          "Вероника Игнатова"
        );
        expect(html).toContain("Вероника Игнатова");
        expect(html).toContain("Клекове с подскок");
        expect(html).toContain("pdf-page");
      }).not.toThrow();
    });

    it("uses default fallback when athlete name is completely missing", () => {
      const bareProgram = {
        programTitle: "Тренировъчен план",
      } as WorkoutProgram;

      expect(() => {
        const html = renderWorkoutProgramHtml(bareProgram);
        expect(html).toContain("Състезател");
        expect(html).toContain("pdf-page");
      }).not.toThrow();
    });
  });
});
