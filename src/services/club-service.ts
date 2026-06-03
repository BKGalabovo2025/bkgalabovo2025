import { getDocs, getFirestore, collection } from "firebase/firestore";
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

/**
 * Fetches all recovery services from the sessions collection.
 */
export const getAllRecoveryServices = async (): Promise<ClubService[]> => {
  try {
    const db = getFirestore();
    const querySnapshot = await getDocs(collection(db, "sessions"));
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        siteId: "recoveryzone",
        name: data.name || "Неименувана услуга",
        description: data.description || "",
        price: data.price || 0,
        currency: "EUR",
        durationMinutes: data.duration || 0,
        category: data.category || "Други",
        zones: Array.isArray(data.zones)
          ? data.zones
          : typeof data.zones === "string"
            ? data.zones.split(",").filter(Boolean)
            : [],
        athleteCount: data.athleteCount || 1,
        numberOfDays: data.numberOfDays || 1,
        proceduresPerDay: data.proceduresPerDay || 1,
        sessionType: data.sessionType || "Възстановяване",
        requiresBooking: true,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        requiredResources: data.requiredResources || null,
      } as unknown as ClubService;
    });
  } catch (error) {
    console.error("Error fetching recovery services:", error);
    return [];
  }
};
