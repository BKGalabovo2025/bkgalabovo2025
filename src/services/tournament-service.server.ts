import { getAdminDb } from "@/lib/firebase-admin";
import { Tournament } from "@/types/tournament.types";

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
      return {
        ...data,
        id: doc.id,
        startDate: data.startDate?.toDate
          ? data.startDate.toDate().toISOString()
          : data.startDate,
        endDate: data.endDate?.toDate
          ? data.endDate.toDate().toISOString()
          : data.endDate,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
      } as Tournament;
    });
  } catch (error) {
    console.error("Error fetching tournaments on server:", error);
    throw error;
  }
}
