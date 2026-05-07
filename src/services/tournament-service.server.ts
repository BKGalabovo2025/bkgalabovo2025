import { getAdminDb } from "@/lib/firebase-admin";
import { Tournament } from "@/types/tournament.types";
import { serializeFirestoreData } from "@/lib/serialize-utils";

const TOURNAMENTS_COLLECTION = "tournaments";

export async function getTournamentsServer(): Promise<Tournament[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(TOURNAMENTS_COLLECTION)
      .orderBy("startDate", "desc")
      .get();

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
