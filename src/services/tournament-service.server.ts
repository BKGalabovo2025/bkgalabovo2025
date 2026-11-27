import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { Tournament } from "@/types/tournament.types";

const TOURNAMENTS_COLLECTION = "tournaments";

export async function getTournamentsServer(
  siteId?: string
): Promise<Tournament[]> {
  try {
    const db = getAdminDb();
    let q: FirebaseFirestore.Query = db.collection(TOURNAMENTS_COLLECTION);
    if (siteId) {
      q = q.where("siteId", "==", siteId);
    }
    const snapshot = await q.orderBy("startDate", "desc").limit(500).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return serializeFirestoreData({
        ...data,
        id: doc.id,
      }) as Tournament;
    });
  } catch (error) {
    console.error("Error fetching tournaments on server:", error);
    throw error;
  }
}
