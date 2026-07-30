import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
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
