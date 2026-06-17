"use server";

import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
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

    revalidatePath("/members");
    revalidatePath("/training");
    serverCache.invalidatePattern("dashboard:");

    return { success: true, id: docRef.id, message: "Тренировката е запазена успешно." };
  } catch (error: any) {
    console.error("Error saving training:", error);
    return { success: false, message: error.message || "Грешка при запазване." };
  }
}

export async function getGlobalTrainingSessionsAction(
  idToken: string,
  limitCount = 50
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();

    const snapshot = await db
      .collection("trainings")
      .orderBy("date", "desc")
      .limit(limitCount)
      .get();

    const trainings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: trainings };
  } catch (error: any) {
    console.error("Error fetching global trainings:", error);
    return { success: false, data: [] };
  }
}

export async function getTrainingSessionsForMemberAction(
  idToken: string,
  memberId: string
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();

    // memberIds is an array, we can use array-contains
    const snapshot = await db
      .collection("trainings")
      .where("memberIds", "array-contains", memberId)
      .orderBy("date", "desc")
      .get();

    const trainings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { success: true, data: trainings };
  } catch (error: any) {
    console.error("Error fetching member trainings:", error);
    return { success: false, data: [] };
  }
}

export async function updateRpeScoresAction(
  idToken: string,
  trainingId: string,
  scores: Record<string, number>
) {
  try {
    await getAuthUser(idToken);
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
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteTrainingSessionAction(
  idToken: string,
  trainingId: string
) {
  try {
    await getAuthUser(idToken);
    const db = getAdminDb();

    await db.collection("trainings").doc(trainingId).delete();

    revalidatePath("/members");
    revalidatePath("/training");
    serverCache.invalidatePattern("dashboard:");

    return { success: true, message: "Тренировката е изтрита успешно." };
  } catch (error: any) {
    console.error("Error deleting training:", error);
    return { success: false, message: error.message || "Грешка при изтриване." };
  }
}
