import { getDocs } from "firebase/firestore";
import { getClubServicesCollection } from "@/lib/firebase-collections";
import { ClubService } from "@/types";

/**
 * Fetches all available club services (for subscriptions, single training sessions, packages, etc.)
 */
export const getAllClubServices = async (): Promise<ClubService[]> => {
  try {
    const querySnapshot = await getDocs(getClubServicesCollection());
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as ClubService[];
  } catch (error) {
    console.error("Error fetching club services:", error);
    return [];
  }
};
