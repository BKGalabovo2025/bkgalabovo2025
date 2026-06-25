import { NextResponse } from "next/server";
import { plannerService } from "@/services/planner-service";
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const siteId = "bkgalabovo";
    // 1. Get existing
    const existing = await plannerService.getExercises(siteId);

    // 2. Delete existing
    const batch = writeBatch(db);
    existing.forEach((ex) => {
      const docRef = doc(db, "exercises", ex.id);
      batch.delete(docRef);
    });
    await batch.commit();

    // 3. Insert new
    const batch2 = writeBatch(db);
    let addedCount = 0;
    INITIAL_BWF_EXERCISES.forEach((ex) => {
      const docRef = doc(collection(db, "exercises"));
      batch2.set(docRef, {
        ...ex,
        siteId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      addedCount++;
    });
    await batch2.commit();

    return NextResponse.json({
      success: true,
      deleted: existing.length,
      added: addedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
