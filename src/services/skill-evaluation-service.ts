import { getSiteConfig } from "@/config/sites";
import { MemberAssessment } from "@/types/assessment.types";
import { BeepTestResult } from "@/types/beep-test.types";

import { getMemberById, updateMember } from "./member-service";

function calculatePoints(
  attendancesCount: number,
  beepTests: BeepTestResult[],
  assessments: MemberAssessment[]
): number {
  let score = 0;
  score += attendancesCount;
  if (beepTests.length > 0) {
    const highestLevel = Math.max(...beepTests.map((t) => t.level || 0));
    score += highestLevel * 10;
  }
  if (assessments.length > 0) {
    score += assessments.length * 5;
  }
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
    const [
      { plannerService },
      { beepTestService },
      { getAssessmentsByMemberId },
    ] = await Promise.all([
      import("./planner-service"),
      import("./beep-test-service"),
      import("./assessment-service"),
    ]);

    const [attendances, beepTests, assessments] = await Promise.all([
      plannerService.getMemberAttendance(siteId, memberId),
      beepTestService.getMemberResults(siteId, memberId),
      getAssessmentsByMemberId(memberId),
    ]);

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
  } catch (err) {
    console.error("Failed to evaluate member skill level:", err);
  }
}
