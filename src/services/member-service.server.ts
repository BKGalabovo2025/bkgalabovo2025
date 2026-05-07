import { getAdminDb } from "@/lib/firebase-admin";
import { Member } from "@/types/member.types";
import { serializeFirestoreData } from "@/lib/serialize-utils";

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
      return serializeFirestoreData({
        ...data,
        id: doc.id,
      }) as Member;
    });
  } catch (error) {
    console.error("Error fetching members on server:", error);
    throw error;
  }
}
