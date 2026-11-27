"use server";
import "server-only";

import { FieldValue } from "firebase-admin/firestore";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getSiteConfig } from "@/config/sites";
import { ensureAdmin, ensureAdminFromSession } from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import {
  WorkoutDayProgress,
  WorkoutExercise,
  WorkoutProgram,
  WorkoutProgramProgress,
} from "@/services/ai-workout-context-service";
import { TrainingSession } from "@/types/training.types";

const ShadowDetailsSchema = z
  .object({
    setsCompleted: z.number().min(0, "Completed sets cannot be negative"),
    totalSets: z.number().min(1, "Total sets must be at least 1"),
    workTimeSec: z.number().min(0, "Work time cannot be negative"),
    restTimeSec: z.number().min(0, "Rest time cannot be negative"),
    paceSec: z.number().optional(),
    calloutMode: z.string().optional(),
    heatmap: z.record(z.string(), z.number()).optional(),
    agilityActionsDone: z.number().optional(),
    agilityTestTimeSec: z.number().optional(),
    individualRpe: z.record(z.string(), z.number()).optional(),
    leftHanded: z.boolean().optional(),
  })
  .passthrough();

export async function createTrainingSessionAction(
  idToken: string,
  data: Omit<TrainingSession, "id" | "createdAt" | "createdBy"> & {
    rpeScore?: number;
    shadowDetails?: TrainingSession["shadowDetails"] & {
      calloutMode?: string;
      agilityActionsDone?: number;
      individualRpe?: Record<string, number>;
      leftHanded?: boolean;
    };
  }
) {
  try {
    const memberIds = Array.isArray(data.memberIds) ? data.memberIds : [];
    if (memberIds.length > 200) {
      return {
        success: false,
        error: "Невалидни данни: максимум 200 участници.",
      };
    }

    if (data.type === "shadow" && data.shadowDetails) {
      const parsed = ShadowDetailsSchema.safeParse(data.shadowDetails);
      if (!parsed.success) {
        return {
          success: false,
          error:
            "Невалидни данни за тренировката: " +
            parsed.error.issues[0].message,
        };
      }
    }

    const user = await ensureAdmin(idToken);
    const db = getAdminDb();

    const docData = {
      ...data,
      memberIds,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: {
        uid: user.uid,
        email: user.email,
        name: user.name || "Unknown",
      },
    };

    const docRef = await db.collection("trainings").add(docData);

    // Save individual shadow analytics
    if (data.type === "shadow" && data.shadowDetails) {
      const batch = db.batch();

      memberIds.forEach((mId) => {
        const analyticsRef = db.collection("member_shadow_analytics").doc();
        const rpeScore =
          data.shadowDetails?.individualRpe?.[mId] ??
          data.shadowDetails?.rpeScores?.[mId] ??
          data.rpeScore ??
          null;

        batch.set(analyticsRef, {
          memberId: mId,
          siteId: data.siteId,
          trainingId: docRef.id,
          date: data.date,
          mode: data.shadowDetails?.mode || "standard",
          ageGroup: data.shadowDetails?.ageGroup || null,
          cornersMode: data.shadowDetails?.cornersMode || null,
          setsCompleted: data.shadowDetails?.setsCompleted || 0,
          totalSets: data.shadowDetails?.totalSets || 0,
          workTimeSec: data.shadowDetails?.workTimeSec || 0,
          restTimeSec: data.shadowDetails?.restTimeSec || 0,
          paceSec: data.shadowDetails?.paceSec ?? null,
          heatmap: data.shadowDetails?.heatmap ?? null,
          agilityTestTimeSec: data.shadowDetails?.agilityTestTimeSec ?? null,
          rpeScore: rpeScore,
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    }

    revalidatePath("/training", "layout");
    revalidatePath("/members", "layout");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      id: docRef.id,
      message: "Тренировката е запазена успешно.",
    };
  } catch (error: unknown) {
    console.error("Error saving training:", error);
    return {
      success: false,
      message:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при запазване.",
    };
  }
}

export async function getGlobalTrainingSessionsAction(
  limitCount = 100,
  siteId?: string
) {
  try {
    await ensureAdminFromSession();

    const db = getAdminDb();

    const snapshot = await db
      .collection("trainings")
      .orderBy("date", "desc")
      .limit(limitCount)
      .get();

    const trainings = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
        } as Record<string, unknown>;
      })
      .filter((t) => {
        if (t.type && t.type !== "shadow") return false;
        if (siteId && t.siteId && t.siteId !== siteId) return false;
        return true;
      });

    return { success: true, data: trainings };
  } catch (error: unknown) {
    console.error("Error fetching global trainings:", error);
    return { success: false, data: [] };
  }
}

export async function getTrainingSessionsForMemberAction(
  idToken: string,
  memberId: string
) {
  try {
    await ensureAdmin(idToken);
    const db = getAdminDb();

    // memberIds is an array, we can use array-contains
    const snapshot = await db
      .collection("trainings")
      .where("memberIds", "array-contains", memberId)
      .orderBy("date", "desc")
      .get();

    const trainings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        memberIds: Array.isArray(data.memberIds) ? data.memberIds : [],
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      };
    });

    return { success: true, data: trainings };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching member trainings:", msg);
    return { success: false, data: [], error: msg };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateRpeScoresAction(
  idToken: string,
  trainingId: string,
  scores: Record<string, number>
) {
  try {
    await ensureAdmin(idToken);
    const db = getAdminDb();

    await db.collection("trainings").doc(trainingId).set(
      {
        rpeScores: scores,
      },
      { merge: true }
    );

    revalidatePath("/training", "layout");
    revalidatePath("/members", "layout");

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteTrainingSessionAction(
  idToken: string,
  trainingId: string
) {
  try {
    await ensureAdmin(idToken);
    const db = getAdminDb();

    const batch = db.batch();
    batch.delete(db.collection("trainings").doc(trainingId));

    const analyticsSnap = await db
      .collection("member_shadow_analytics")
      .where("trainingId", "==", trainingId)
      .get();

    analyticsSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    revalidatePath("/training", "layout");
    revalidatePath("/members", "layout");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message: "Тренировката е изтрита успешно.",
    };
  } catch (error: unknown) {
    console.error("Error deleting training:", error);
    return {
      success: false,
      message:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Грешка при изтриване.",
    };
  }
}

export async function saveWorkoutProgramAction(
  idToken: string,
  memberId: string,
  program: WorkoutProgram
) {
  try {
    const user = idToken
      ? await ensureAdmin(idToken).catch(() => null)
      : await ensureAdminFromSession().catch(() => null);
    if (!user) throw new Error("Unauthorized");

    const db = getAdminDb();
    const docRef = await db
      .collection("members")
      .doc(memberId)
      .collection("workoutPrograms")
      .add({
        ...program,
        memberId,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: {
          uid: user.uid,
          email: user.email,
        },
      });

    revalidatePath(`/members/${memberId}`);

    // Update activeWorkoutProgram on member doc
    try {
      await db
        .collection("members")
        .doc(memberId)
        .update({
          activeWorkoutProgram: {
            programId: docRef.id,
            title: program.programTitle,
            startDate: program.startDate || "",
            endDate: program.endDate || "",
            targetGoal: program.targetGoal || "",
          },
        });
      revalidatePath("/schedule");
    } catch {
      // Non-blocking
    }

    return {
      success: true,
      programId: docRef.id,
      message: "Тренировъчната програма е запазена успешно в профила!",
    };
  } catch (error: unknown) {
    console.error("Error saving workout program:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при запис на програмата.",
    };
  }
}

export async function getMemberWorkoutProgramsAction(
  memberId: string,
  idToken?: string
) {
  try {
    const user = idToken
      ? await ensureAdmin(idToken).catch(() => null)
      : await ensureAdminFromSession().catch(() => null);
    if (!user) throw new Error("Unauthorized");

    const db = getAdminDb();
    const snapshot = await db
      .collection("members")
      .doc(memberId)
      .collection("workoutPrograms")
      .orderBy("createdAt", "desc")
      .get();

    const programs = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      };
    });

    return { success: true, data: programs };
  } catch (error: unknown) {
    console.error("Error fetching member workout programs:", error);
    return {
      success: false,
      data: [],
      message:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на програмите.",
    };
  }
}

export async function deleteWorkoutProgramAction(
  memberId: string,
  programId: string,
  idToken?: string
) {
  try {
    const user = idToken
      ? await ensureAdmin(idToken).catch(() => null)
      : await ensureAdminFromSession().catch(() => null);
    if (!user) throw new Error("Unauthorized");

    const db = getAdminDb();
    await db
      .collection("members")
      .doc(memberId)
      .collection("workoutPrograms")
      .doc(programId)
      .delete();

    try {
      const memberDoc = await db.collection("members").doc(memberId).get();
      const memberData = memberDoc.data();
      if (memberData?.activeWorkoutProgram?.programId === programId) {
        await db.collection("members").doc(memberId).update({
          activeWorkoutProgram: null,
        });
      }
    } catch {
      // Non-blocking
    }

    revalidatePath(`/members/${memberId}`);
    revalidatePath("/schedule");
    return {
      success: true,
      message: "Тренировъчната програма беше изтрита успешно.",
    };
  } catch (error: unknown) {
    console.error("Error deleting workout program:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на програмата.",
    };
  }
}

export interface ActiveWorkoutScheduleDay {
  programId: string;
  programTitle: string;
  dayNumber: number;
  dayName: string;
  calendarDate?: string;
  isCompetitionDay?: boolean;
  competitionTitle?: string;
  focus: string;
  intensity: "low" | "medium" | "high";
  durationMinutes: number;
  warmup: string[];
  exercises: WorkoutExercise[];
  cooldown: string[];
  safetyAudit: WorkoutProgram["safetyAudit"];
  recoveryRecommendations?: string[];
  theoryAssignment?: string;
  progress?: WorkoutDayProgress;
}

export async function getMemberActiveWorkoutForDateAction(
  memberId: string,
  targetDateStr: string,
  idToken?: string
): Promise<{
  success: boolean;
  data?: ActiveWorkoutScheduleDay | null;
  message?: string;
}> {
  try {
    const user = idToken
      ? await ensureAdmin(idToken).catch(() => null)
      : await ensureAdminFromSession().catch(() => null);
    if (!user && !(await ensureAdminFromSession().catch(() => null))) {
      throw new Error("Невалидна оторизация. Моля, влезте отново.");
    }

    const db = getAdminDb();
    const dateClean = targetDateStr.split("T")[0];

    // 1. Fetch workout programs subcollection without requiring custom index
    const snap = await db
      .collection("members")
      .doc(memberId)
      .collection("workoutPrograms")
      .get();

    if (snap.empty) {
      return { success: true, data: null };
    }

    // Sort descending by createdAt
    const sortedDocs = snap.docs.slice().sort((a, b) => {
      const aData = a.data() as Record<string, unknown>;
      const bData = b.data() as Record<string, unknown>;
      const aTime =
        (aData.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime?.() ||
        (typeof aData.createdAt === "string"
          ? new Date(aData.createdAt).getTime()
          : 0);
      const bTime =
        (bData.createdAt as { toDate?: () => Date })?.toDate?.()?.getTime?.() ||
        (typeof bData.createdAt === "string"
          ? new Date(bData.createdAt).getTime()
          : 0);
      return bTime - aTime;
    });

    // Find first program covering the date
    for (let docIdx = 0; docIdx < sortedDocs.length; docIdx++) {
      const doc = sortedDocs[docIdx];
      const prog = doc.data() as WorkoutProgram;

      // 1. Match exact calendarDate in schedule
      const matchedDay = prog.schedule?.find(
        (d) => d.calendarDate === dateClean
      );
      if (matchedDay) {
        return {
          success: true,
          data: {
            programId: doc.id,
            programTitle: prog.programTitle,
            ...matchedDay,
            safetyAudit: prog.safetyAudit,
            recoveryRecommendations: prog.recoveryRecommendations,
            theoryAssignment: prog.theoryAssignment,
            progress: prog.progress?.completedDays?.[matchedDay.dayNumber],
          },
        };
      }

      // 2. Match within startDate and endDate
      if (
        prog.startDate &&
        prog.endDate &&
        dateClean >= prog.startDate &&
        dateClean <= prog.endDate
      ) {
        const startMs = new Date(prog.startDate).getTime();
        const targetMs = new Date(dateClean).getTime();
        const diffDays = Math.max(
          0,
          Math.floor((targetMs - startMs) / 86400000)
        );
        const scheduleLen = prog.schedule?.length || 1;
        const dayIdx = Math.min(diffDays, scheduleLen - 1);
        const scheduledDay = prog.schedule?.[dayIdx] || prog.schedule?.[0];

        if (scheduledDay) {
          return {
            success: true,
            data: {
              programId: doc.id,
              programTitle: prog.programTitle,
              ...scheduledDay,
              calendarDate: dateClean,
              safetyAudit: prog.safetyAudit,
              recoveryRecommendations: prog.recoveryRecommendations,
              theoryAssignment: prog.theoryAssignment,
              progress: prog.progress?.completedDays?.[scheduledDay.dayNumber],
            },
          };
        }
      }

      // 3. Fallback: match by createdAt and cycleDuration
      const docData = doc.data() as Record<string, unknown>;
      const createdAtRaw = docData.createdAt;
      let createdDateStr = "";
      if (typeof createdAtRaw === "string") {
        createdDateStr = createdAtRaw.split("T")[0];
      } else if (
        createdAtRaw &&
        typeof (createdAtRaw as { toDate?: () => Date }).toDate === "function"
      ) {
        createdDateStr = (createdAtRaw as { toDate: () => Date })
          .toDate()
          .toISOString()
          .split("T")[0];
      }

      if (createdDateStr) {
        const startMs = new Date(createdDateStr).getTime();
        const targetMs = new Date(dateClean).getTime();
        const diffDays = Math.round((targetMs - startMs) / 86400000);
        const cycleDurationDays = prog.cycleDurationDays || 14;

        if (
          diffDays >= -1 &&
          diffDays <= cycleDurationDays &&
          prog.schedule &&
          prog.schedule.length > 0
        ) {
          const dayIdx = Math.max(
            0,
            Math.min(diffDays >= 0 ? diffDays : 0, prog.schedule.length - 1)
          );
          const day = prog.schedule[dayIdx] || prog.schedule[0];

          // Backfill member doc activeWorkoutProgram
          db.collection("members")
            .doc(memberId)
            .update({
              activeWorkoutProgram: {
                programId: doc.id,
                title: prog.programTitle,
                startDate: prog.startDate || createdDateStr,
                endDate: prog.endDate || dateClean,
                targetGoal: prog.targetGoal || "",
              },
            })
            .catch(() => {});

          return {
            success: true,
            data: {
              programId: doc.id,
              programTitle: prog.programTitle,
              ...day,
              calendarDate: dateClean,
              safetyAudit: prog.safetyAudit,
              recoveryRecommendations: prog.recoveryRecommendations,
              theoryAssignment: prog.theoryAssignment,
              progress: prog.progress?.completedDays?.[day.dayNumber],
            },
          };
        }
      }

      // 4. Fallback for latest active program: if within 30 days of creation, match day
      if (docIdx === 0 && prog.schedule && prog.schedule.length > 0) {
        const day = prog.schedule[0];
        return {
          success: true,
          data: {
            programId: doc.id,
            programTitle: prog.programTitle,
            ...day,
            calendarDate: dateClean,
            safetyAudit: prog.safetyAudit,
            recoveryRecommendations: prog.recoveryRecommendations,
            theoryAssignment: prog.theoryAssignment,
            progress: prog.progress?.completedDays?.[day.dayNumber],
          },
        };
      }
    }

    return { success: true, data: null };
  } catch (error: unknown) {
    console.error("Error fetching active workout for date:", error);
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при зареждане на тренировката.",
    };
  }
}

export async function getActiveWorkoutsMapForScheduleAction(
  targetDateStr: string,
  memberIds: string[],
  idToken?: string
): Promise<{
  success: boolean;
  data: Record<string, ActiveWorkoutScheduleDay>;
}> {
  try {
    const result: Record<string, ActiveWorkoutScheduleDay> = {};
    if (!memberIds || memberIds.length === 0) {
      return { success: true, data: result };
    }

    const idsToFetch = memberIds.slice(0, 50);
    await Promise.all(
      idsToFetch.map(async (mId) => {
        try {
          const res = await getMemberActiveWorkoutForDateAction(
            mId,
            targetDateStr,
            idToken
          );
          if (res.success && res.data) {
            result[mId] = res.data;
          }
        } catch {
          // Non-blocking
        }
      })
    );

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("Error in getActiveWorkoutsMapForScheduleAction:", error);
    return { success: false, data: {} };
  }
}

/**
 * Updates the progress of a specific day or exercise in a member's AI workout program.
 */
export async function updateWorkoutProgramProgressAction(
  memberId: string,
  programId: string,
  dayNumber: number,
  progressData: {
    completed: boolean;
    rpeRating?: number;
    notes?: string;
    completedExercises?: number[];
  },
  idToken?: string
): Promise<{
  success: boolean;
  message: string;
  overallProgressPercent?: number;
}> {
  try {
    const user = idToken
      ? await ensureAdmin(idToken).catch(() => null)
      : await ensureAdminFromSession().catch(() => null);
    if (!user && !(await ensureAdminFromSession().catch(() => null))) {
      throw new Error("Невалидна оторизация. Моля, влезте отново.");
    }

    const db = getAdminDb();
    const docRef = db
      .collection("members")
      .doc(memberId)
      .collection("workoutPrograms")
      .doc(programId);

    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return { success: false, message: "Програмата не е намерена." };
    }

    const progData = docSnap.data() as WorkoutProgram;
    const existingProgress = progData.progress || { completedDays: {} };
    const completedDays = { ...(existingProgress.completedDays || {}) };

    completedDays[dayNumber] = {
      ...(completedDays[dayNumber] || {}),
      ...progressData,
      completedAt: progressData.completed
        ? completedDays[dayNumber]?.completedAt || new Date().toISOString()
        : undefined,
    };

    const totalDays = progData.schedule?.length || 1;
    const completedCount = Object.values(completedDays).filter(
      (d) => d.completed
    ).length;
    const overallProgressPercent = Math.min(
      100,
      Math.round((completedCount / totalDays) * 100)
    );

    const updatedProgress: WorkoutProgramProgress = {
      completedDays,
      overallProgressPercent,
      lastUpdated: new Date().toISOString(),
    };

    await docRef.update({
      progress: updatedProgress,
    });

    return {
      success: true,
      message: "Прогресът на тренировката е обновен успешно.",
      overallProgressPercent,
    };
  } catch (error: unknown) {
    console.error("Error updating workout progress:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Грешка при обновяване на прогреса.",
    };
  }
}

/**
 * Записва резултат от Shadow Agility Test като официален контролен тест в досието на състезателя.
 */
export async function recordShadowAgilityAssessmentAction(
  idToken: string | undefined,
  params: {
    memberId: string;
    memberName: string;
    timeSec: number;
    actionsCount?: number;
    date?: string;
    notes?: string;
    ageGroup?: string;
    recordedBy?: string;
  }
) {
  try {
    const user = await ensureAdmin(idToken || "");
    const db = getAdminDb();
    const siteConfig = getSiteConfig();

    const score = Math.round(params.timeSec * 10) / 10;
    const docData = {
      siteId: siteConfig.id,
      memberId: params.memberId,
      memberName: params.memberName,
      date: params.date || new Date().toISOString(),
      testId: "u17_shadow_1min",
      testName: "Shadow Agility Норматив (20 движения)",
      ageGroupAtTest: params.ageGroup || "U17",
      score,
      scoreDisplay: `${score.toFixed(1)} сек`,
      notes:
        params.notes ||
        `Shadow Agility тест: ${params.actionsCount || 20} движения за ${score.toFixed(1)} сек.`,
      coachAnalysis:
        score <= 17.5
          ? "Елитно състезателно време за реакция и придвижване по корта."
          : score <= 20.0
            ? "Много добър резултат. Стабилно поддържане на темпото."
            : "Препоръчва се работа върху експлозивността на първата крачка и сплит-степа.",
      recordedBy: {
        userId: user.uid,
        userName: params.recordedBy || user.email || "Треньор",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await db.collection("member_assessments").add(docData);
    revalidatePath("/training/assessments");
    revalidatePath(`/members/${params.memberId}`);
    return {
      success: true,
      id: docRef.id,
      message: `Тестът на ${params.memberName} (${score}s) е записан като официален контролен тест!`,
    };
  } catch (err: unknown) {
    console.error("recordShadowAgilityAssessmentAction Error:", err);
    return {
      success: false,
      message: "Грешка при запис на контролен тест в досието.",
    };
  }
}
