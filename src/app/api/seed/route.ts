import { collection, doc, writeBatch } from "firebase/firestore";
import { NextResponse } from "next/server";

import { ensureAdmin } from "@/lib/auth-utils";
import { INITIAL_BWF_EXERCISES } from "@/lib/badminton-exercises";
import { db } from "@/lib/firebase";
import { plannerService } from "@/services/planner-service";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.substring(7);
    try {
      await ensureAdmin(token);
    } catch {
      return NextResponse.json(
        { error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
