import {
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  collection,
  where,
  limit,
} from "firebase/firestore";
import { getClubGeneralServicesCollection } from "@/lib/firebase-collections";
import { getDb } from "@/lib/firebase";
import { ClubGeneralService } from "@/types";

const EVENTS_COLLECTION = "generalServiceEvents";

/**
 * Retrieves all general services from the database.
 */
export const getGeneralServices = async (): Promise<ClubGeneralService[]> => {
  const q = query(getClubGeneralServicesCollection(), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id,
  })) as ClubGeneralService[];
};

/**
 * Finds the price for court rental by looking for a service named "Наем на корт".
 * Defaults to 10 EUR if not found.
 */
export const getCourtPrice = async (): Promise<number> => {
  try {
    const q = query(
      getClubGeneralServicesCollection(), 
      where("name", "==", "Наем на корт"),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data().price || 10;
    }
  } catch (error) {
    console.error("Error fetching court price:", error);
  }
  return 10; // Fallback hardcoded price
};

/**
 * Logs an event in the operational history for general services.
 */
const logServiceEvent = async (
  serviceId: string,
  serviceName: string,
  type: "create" | "update" | "delete",
  userId: string,
  userName: string,
  details?: string
) => {
  try {
    const db = getDb();
    await addDoc(collection(db, EVENTS_COLLECTION), {
      serviceId,
      serviceName,
      type,
      userId,
      userName,
      details: details || "",
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log service event:", error);
  }
};

/**
 * Retrieves the operational history for general services.
 */
export const getGeneralServiceEvents = async () => {
  const db = getDb();
  const q = query(collection(db, EVENTS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Adds a new general service to the database.
 */
export const addGeneralService = async (
  service: Omit<ClubGeneralService, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">,
  userId: string,
  userName: string
): Promise<string> => {
  const now = new Date().toISOString();
  const docRef = await addDoc(getClubGeneralServicesCollection(), {
    ...service,
    createdAt: now,
    updatedAt: now,
    createdBy: { userId, userName },
    updatedBy: { userId, userName },
  } as any);
  
  const unitLabel = service.pricingUnit === "per_hour" ? "/час" : service.pricingUnit === "per_unit" ? `/${service.priceUnit || "бр."}` : "";
  await logServiceEvent(docRef.id, service.name, "create", userId, userName, `Цена: ${service.price} EUR${unitLabel}, Изпълнител: ${service.performerName}`);
  
  return docRef.id;
};

/**
 * Updates an existing general service in the database.
 */
export const updateGeneralService = async (
  id: string,
  updates: Partial<Omit<ClubGeneralService, "id" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy">>,
  userId: string,
  userName: string
): Promise<void> => {
  const serviceRef = doc(getClubGeneralServicesCollection(), id);
  const oldDoc = await getDoc(serviceRef);
  let details = "Актуализирани данни за услугата";
  let serviceName = updates.name || "Неизвестна услуга";

  if (oldDoc.exists()) {
    const oldData = oldDoc.data() as ClubGeneralService;
    serviceName = updates.name || oldData.name;
    const changes: string[] = [];
    
    if (updates.price !== undefined && updates.price !== oldData.price) {
      changes.push(`Цена: ${oldData.price} -> ${updates.price} EUR`);
    }
    if (updates.name !== undefined && updates.name !== oldData.name) {
      changes.push(`Име променено`);
    }
    if (updates.performerName !== undefined && updates.performerName !== oldData.performerName) {
      changes.push(`Изпълнител: "${oldData.performerName}" -> "${updates.performerName}"`);
    }
    if (updates.performerType !== undefined && updates.performerType !== oldData.performerType) {
      const tl = (t: string) => t === "internal" ? "Вътрешен" : "Външен";
      changes.push(`Тип изп.: ${tl(oldData.performerType)} -> ${tl(updates.performerType!)}`);
    }
    if (updates.pricingUnit !== undefined && updates.pricingUnit !== (oldData.pricingUnit || "fixed")) {
      const ul = (u: string) => u === "per_hour" ? "на час" : u === "per_unit" ? "на бройка" : "фиксирана";
      changes.push(`Ценообразуване: ${ul(oldData.pricingUnit || "fixed")} -> ${ul(updates.pricingUnit)}`);
    }
    if (updates.durationMinutes !== undefined && updates.durationMinutes !== oldData.durationMinutes) {
      const oldVal = oldData.durationMinutes ? `${oldData.durationMinutes} мин.` : "няма";
      const newVal = updates.durationMinutes ? `${updates.durationMinutes} мин.` : "няма";
      changes.push(`Времетраене: ${oldVal} -> ${newVal}`);
    }
    
    if (changes.length > 0) {
      details = changes.join(", ");
    }
  }

  await updateDoc(serviceRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: { userId, userName },
  } as any);
  
  await logServiceEvent(id, serviceName, "update", userId, userName, details);
};

/**
 * Deletes a general service from the database.
 */
export const deleteGeneralService = async (id: string, userName: string, userId: string, serviceName: string = "Изтрита услуга"): Promise<void> => {
  const serviceRef = doc(getClubGeneralServicesCollection(), id);
  await deleteDoc(serviceRef);
  
  await logServiceEvent(id, serviceName, "delete", userId, userName, "Услугата е изтрита от каталога");
};
