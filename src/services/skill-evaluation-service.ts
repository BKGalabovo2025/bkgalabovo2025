import { getSiteConfig } from "@/config/sites";
import { MemberAssessment } from "@/types/assessment.types";
import { BeepTestResult } from "@/types/beep-test.types";
import { SessionAttendance } from "@/types/planner.types";

import { getMemberById, updateMember } from "./member-service";

// ─── Pure calculation helpers (no Firestore deps) ─────────────────────────────

function calculatePoints(
  attendancesCount: number,
  beepTests: BeepTestResult[],
  assessments: MemberAssessment[]
): number {
  let score = attendancesCount;
  if (beepTests.length > 0) {
    const highestLevel = Math.max(...beepTests.map((t) => t.level || 0));
    score += highestLevel * 10;
  }
  score += assessments.length * 5;
  return score;
}

function determineSkillLevel(
  score: number
): "beginner" | "intermediate" | "advanced" | "professional" {
  if (score < 20) return "beginner";
  if (score < 80) return "intermediate";
  if (score < 150) return "advanced";
  return "professional";
}

// ─── Overload 1: Supply pre-fetched data directly (avoids any circular dep) ──

export async function evaluateMemberSkillLevelFromData(
  memberId: string,
  attendances: SessionAttendance[],
  beepTests: BeepTestResult[],
  assessments: MemberAssessment[]
): Promise<void> {
  const member = await getMemberById(memberId);
  if (!member) return;

  if (
    attendances.length === 0 &&
    beepTests.length === 0 &&
    assessments.length === 0
  ) {
    if (!member.skillLevel) {
      await updateMember(memberId, {
        skillLevel: "beginner",
        isSkillLevelAutoCalculated: false,
      });
    }
    return;
  }

  const points = calculatePoints(attendances.length, beepTests, assessments);
  const newSkillLevel = determineSkillLevel(points);

  if (
    member.skillLevel !== newSkillLevel ||
    !member.isSkillLevelAutoCalculated ||
    member.skillLevelPoints !== points
  ) {
    await updateMember(memberId, {
      skillLevel: newSkillLevel,
      skillLevelPoints: points,
      isSkillLevelAutoCalculated: true,
    });
    console.log(
      `Evaluated member ${memberId}: Score ${points}, Level ${newSkillLevel}`
    );
  }
}

// ─── Overload 2: Fetch data lazily (safe only when NOT called from those services) ──

export async function evaluateMemberSkillLevel(
  memberId: string
): Promise<void> {
  const siteId = getSiteConfig().id;

  // Lazy-load each service module at call-time to avoid static circular refs
  const [plannerMod, beepMod, assessMod] = await Promise.all([
    import("./planner-service"),
    import("./beep-test-service"),
    import("./assessment-service"),
  ]);

  const [attendances, beepTests, assessments] = await Promise.all([
    plannerMod.plannerService.getMemberAttendance(siteId, memberId),
    beepMod.beepTestService.getMemberResults(siteId, memberId),
    assessMod.getAssessmentsByMemberId(memberId),
  ]);

  await evaluateMemberSkillLevelFromData(
    memberId,
    attendances,
    beepTests,
    assessments
  );
}
