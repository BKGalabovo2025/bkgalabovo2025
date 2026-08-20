import { getSiteConfig } from "@/config/sites";
import { MemberAssessment } from "@/types/assessment.types";
import { BeepTestResult } from "@/types/beep-test.types";

import { getAssessmentsByMemberId } from "./assessment-service";
import { beepTestService } from "./beep-test-service";
import { getMemberById, updateMember } from "./member-service";
import { plannerService } from "./planner-service";

/**
 * Calculates a point-based skill score for a member based on:
 * 1. Attendances (1 pt each)
 * 2. Beep Tests (highest level * 10)
 * 3. Assessments (Score > 0 ? +5 pts)
 */
function calculatePoints(
  attendancesCount: number,
  beepTests: BeepTestResult[],
  assessments: MemberAssessment[]
): number {
  let score = 0;

  // 1. Attendance points
  score += attendancesCount;

  // 2. Beep Test points
  if (beepTests.length > 0) {
    const highestLevel = Math.max(...beepTests.map((t) => t.level || 0));
    score += highestLevel * 10;
  }

  // 3. Assessment points
  if (assessments.length > 0) {
    score += assessments.length * 5;
  }

  return score;
}

/**
 * Determines the skill level from a calculated score.
 */
function determineSkillLevel(
  score: number
): "beginner" | "intermediate" | "advanced" | "professional" {
  if (score < 20) return "beginner";
  if (score < 80) return "intermediate";
  if (score < 150) return "advanced";
  return "professional";
}

/**
 * Evaluates and automatically updates a member's skill level.
 * @param memberId The ID of the member to evaluate.
 */
export async function evaluateMemberSkillLevel(
  memberId: string
): Promise<void> {
  const siteId = getSiteConfig().id;
  const member = await getMemberById(memberId);

  if (!member) {
    console.warn(`evaluateMemberSkillLevel: Member ${memberId} not found.`);
    return;
  }

  try {
    const [attendances, beepTests, assessments] = await Promise.all([
      plannerService.getMemberAttendance(siteId, memberId),
      beepTestService.getMemberResults(siteId, memberId),
      getAssessmentsByMemberId(memberId),
    ]);

    // If there is strictly NO data, we don't overwrite manual setting
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

    // Only update if it changed or it wasn't auto-calculated before
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
  } catch (err) {
    console.error("Failed to evaluate member skill level:", err);
  }
}
