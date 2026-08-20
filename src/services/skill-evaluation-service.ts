import { collection, getDocs, query, where } from "firebase/firestore";

import { getSiteConfig } from "@/config/sites";
import { getDb } from "@/lib/firebase";
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

// ─── Overload 2: Fetch data directly using raw queries to avoid importing sibling services ──

export async function evaluateMemberSkillLevel(
  memberId: string
): Promise<void> {
  const siteId = getSiteConfig().id;
  const db = getDb();

  const [attSnap, beepSnap, assessSnap] = await Promise.all([
    getDocs(
      query(
        collection(db, "training_attendance"),
        where("siteId", "==", siteId),
        where("memberId", "==", memberId)
      )
    ),
    getDocs(
      query(
        collection(db, "beep_test_results"),
        where("siteId", "==", siteId),
        where("memberId", "==", memberId)
      )
    ),
    getDocs(
      query(
        collection(db, "member_assessments"),
        where("siteId", "==", siteId),
        where("memberId", "==", memberId)
      )
    ),
  ]);

  const attendances = attSnap.docs.map((d) => d.data() as SessionAttendance);
  const beepTests = beepSnap.docs.map((d) => d.data() as BeepTestResult);
  const assessments = assessSnap.docs.map((d) => d.data() as MemberAssessment);

  await evaluateMemberSkillLevelFromData(
    memberId,
    attendances,
    beepTests,
    assessments
  );
}
