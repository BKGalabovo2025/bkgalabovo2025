import { getAdminDb } from "@/lib/firebase-admin";
import { Member } from "@/types/member.types";

const MEMBERS_COLLECTION = "members";

export async function getAllMembersServer(): Promise<Member[]> {
  try {
    const db = getAdminDb();
    const snapshot = await db
      .collection(MEMBERS_COLLECTION)
      .orderBy("lastName", "asc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        // Convert Admin SDK Timestamps to ISO strings if needed
        registrationDate: data.registrationDate?.toDate
          ? data.registrationDate.toDate().toISOString()
          : data.registrationDate,
        updatedAt: data.updatedAt?.toDate
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
      } as Member;
    });
  } catch (error) {
    console.error("Error fetching members on server:", error);
    throw error;
  }
}
