import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { Member } from "@/types/member.types";

const MEMBERS_COLLECTION = "members";

export async function getAllMembersServer(siteId?: string): Promise<Member[]> {
  try {
    const db = getAdminDb();
    let query: FirebaseFirestore.Query = db.collection(MEMBERS_COLLECTION);

    if (siteId) {
      query = query.where("siteId", "==", siteId);
    }

    const snapshot = await query.get();

    const members = snapshot.docs.map((doc) => {
      const data = doc.data();
      return serializeFirestoreData({
        ...data,
        id: doc.id,
      }) as Member;
    });

    return members.sort((a, b) =>
      (a.lastName || "").localeCompare(b.lastName || "", "bg")
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const isQuota =
      msg.includes("RESOURCE_EXHAUSTED") || msg.includes("Quota exceeded");
    if (isQuota) {
      // Quota изчерпана — връщаме [] мълчаливо (MembersPage показва fallback UI)
      console.warn(
        "[member-service] Firestore quota exhausted — returning empty members list"
      );
      return [];
    }
    console.error("Error fetching members on server:", error);
    throw error;
  }
}
