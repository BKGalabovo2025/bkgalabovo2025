"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser, getAuthUserFromSessionCookie } from "@/lib/auth-utils";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { TrainingSession } from "@/types/training.types";
import { serverCache } from "@/lib/server-cache";

export async function createTrainingSessionAction(
  idToken: string,
  data: Omit<TrainingSession, "id" | "createdAt" | "createdBy">
) {
  try {
    const user = await getAuthUser(idToken);
    const db = getAdminDb();

    const docData = {
      ...data,
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

      data.memberIds.forEach((memberId) => {
        const analyticsRef = db.collection("member_shadow_analytics").doc();
        const rpeScore = data.shadowDetails?.rpeScores?.[memberId] || null;

        batch.set(analyticsRef, {
          memberId,
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
          paceSec: data.shadowDetails?.paceSec || null,
          rpeScore: rpeScore,
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    }

    revalidatePath("/members");
    revalidatePath("/training");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      id: docRef.id,
      message: "РўСЂРµРЅРёСЂРѕРІРєР°С‚Р° Рµ Р·Р°РїР°Р·РµРЅР° СѓСЃРїРµС€РЅРѕ.",
    };
  } catch (error: unknown) {
    console.error("Error saving training:", error);
    return {
      success: false,
      message:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Р“СЂРµС€РєР° РїСЂРё Р·Р°РїР°Р·РІР°РЅРµ.",
    };
  }
}

export async function getGlobalTrainingSessionsAction(limitCount = 50) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Unauthorized");

    const db = getAdminDb();

    const snapshot = await db
      .collection("trainings")
      .orderBy("date", "desc")
      .limit(limitCount)
      .get();

    const trainings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
      };
    });

    return { success: true, data: trainings };
  } catch (error: unknown) {
    console.error("Error fetching global trainings:", error);
    return { success: false, data: [] };
  }
}

export async function getTrainingSessionsForMemberAction(
  _idToken: string,
  memberId: string
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Unauthorized");
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

async function updateRpeScoresAction(
  _idToken: string,
  trainingId: string,
  scores: Record<string, number>
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Unauthorized");
    const db = getAdminDb();

    await db.collection("trainings").doc(trainingId).set(
      {
        rpeScores: scores,
      },
      { merge: true }
    );

    revalidatePath("/members");
    revalidatePath("/training");

    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function deleteTrainingSessionAction(
  _idToken: string,
  trainingId: string
) {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) throw new Error("Unauthorized");
    const db = getAdminDb();

    await db.collection("trainings").doc(trainingId).delete();

    revalidatePath("/members");
    revalidatePath("/training");
    serverCache.invalidatePattern("dashboard:");

    return {
      success: true,
      message: "РўСЂРµРЅРёСЂРѕРІРєР°С‚Р° Рµ РёР·С‚СЂРёС‚Р° СѓСЃРїРµС€РЅРѕ.",
    };
  } catch (error: unknown) {
    console.error("Error deleting training:", error);
    return {
      success: false,
      message:
        (error instanceof Error ? error.message : "Unknown error") ||
        "Р“СЂРµС€РєР° РїСЂРё РёР·С‚СЂРёРІР°РЅРµ.",
    };
  }
}
