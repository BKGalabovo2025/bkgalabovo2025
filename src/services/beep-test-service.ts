import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { getDb } from "@/lib/firebase";
import { BeepTestResult } from "@/types/beep-test.types";

const COLLECTION_NAME = "beep_test_results";

export const beepTestService = {
  async saveResult(
    siteId: string,
    result: Omit<BeepTestResult, "id" | "createdAt" | "updatedAt">
  ) {
    const db = await getDb();
    const resultRef = doc(collection(db, COLLECTION_NAME));

    const data = {
      ...result,
      id: resultRef.id,
      siteId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(resultRef, data);

    // Auto-evaluate skill level
    const { evaluateMemberSkillLevel } =
      await import("./skill-evaluation-service");
    await evaluateMemberSkillLevel(result.memberId).catch(console.error);

    return resultRef.id;
  },

  async getMemberResults(
    siteId: string,
    memberId: string
  ): Promise<BeepTestResult[]> {
    const db = await getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("siteId", "==", siteId),
      where("memberId", "==", memberId)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || "",
        updatedAt: data.updatedAt?.toDate().toISOString() || "",
      } as BeepTestResult;
    });

    // Sort chronologically
    return results.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  async getAllResults(siteId: string): Promise<BeepTestResult[]> {
    const db = await getDb();
    const q = query(
      collection(db, COLLECTION_NAME),
      where("siteId", "==", siteId)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate().toISOString() || "",
        updatedAt: data.updatedAt?.toDate().toISOString() || "",
      } as BeepTestResult;
    });

    return results.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ); // Descending by date
  },

  async deleteResult(resultId: string) {
    const db = await getDb();
    await deleteDoc(doc(db, COLLECTION_NAME, resultId));
  },
};
