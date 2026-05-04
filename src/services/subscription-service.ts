import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  runTransaction,
  updateDoc,
  orderBy,
  DocumentSnapshot,
  Timestamp,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Subscription, ClubService } from "@/types/index";

const SUBSCRIPTIONS_COLLECTION = "memberSubscriptions";
const SERVICES_COLLECTION = "clubServices";
const MEMBERS_COLLECTION = "members"; // Added for fetching member data

// --- Converters ---
export const docToClubService = (doc: DocumentSnapshot): ClubService | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    name: typeof data.name === "string" ? data.name : "Неименувана услуга",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : 0,
    currency: "EUR", // Force EUR
    type: ["Абонамент", "Еднократно плащане"].includes(data.type)
      ? data.type
      : "Еднократно плащане",
    billingPeriod: ["Месечен", "Годишен", null].includes(data.billingPeriod)
      ? data.billingPeriod
      : null,
    targetGroups: Array.isArray(data.targetGroups) ? data.targetGroups : [],
    isCoachLed: typeof data.isCoachLed === "boolean" ? data.isCoachLed : false,
    durationMinutes:
      typeof data.durationMinutes === "number" ? data.durationMinutes : 0,
    requiresBooking:
      typeof data.requiresBooking === "boolean" ? data.requiresBooking : false,
    minMembers: typeof data.minMembers === "number" ? data.minMembers : 0,
    maxMembers: typeof data.maxMembers === "number" ? data.maxMembers : 0,
    paymentRules:
      typeof data.paymentRules === "object" ? data.paymentRules : undefined,
    specialRights: Array.isArray(data.specialRights) ? data.specialRights : [],
    cancellationPolicy:
      typeof data.cancellationPolicy === "object"
        ? data.cancellationPolicy
        : {
            isAllowed: false,
            noticePeriodDays: 0,
            feeType: "none",
            feeValue: 0,
            description: "",
            longTermSicknessDiscount: 0,
          },
    createdAt:
      typeof data.createdAt === "string"
        ? data.createdAt
        : new Date().toISOString(),
    updatedAt:
      typeof data.updatedAt === "string"
        ? data.updatedAt
        : new Date().toISOString(),
    createdBy:
      data.createdBy && typeof data.createdBy === "object"
        ? data.createdBy
        : { userId: "", userName: "" },
    updatedBy:
      data.updatedBy && typeof data.updatedBy === "object"
        ? data.updatedBy
        : { userId: "", userName: "" },
  };
};

export const docToMemberSubscription = (
  doc: DocumentSnapshot
): Subscription | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    memberId: typeof data.memberId === "string" ? data.memberId : "",
    serviceId: typeof data.serviceId === "string" ? data.serviceId : "",
    serviceName: typeof data.serviceName === "string" ? data.serviceName : "",
    startDate:
      typeof data.startDate === "string"
        ? data.startDate
        : new Date().toISOString(),
    endDate:
      typeof data.endDate === "string"
        ? data.endDate
        : new Date().toISOString(),
    status: ["active", "inactive", "cancelled", "pending_payment"].includes(
      data.status
    )
      ? data.status
      : "inactive",
    price: typeof data.price === "number" ? data.price : 0,
    pricePaid: typeof data.pricePaid === "number" ? data.pricePaid : 0,
    currency: "EUR", // Force EUR
    paymentHistory: Array.isArray(data.paymentHistory)
      ? data.paymentHistory
      : [],
    paymentsMadeCount:
      typeof data.paymentsMadeCount === "number" ? data.paymentsMadeCount : 0,
    totalPaymentsCount:
      typeof data.totalPaymentsCount === "number" ? data.totalPaymentsCount : 0,
    licenseGranted:
      typeof data.licenseGranted === "boolean" ? data.licenseGranted : false,
    apparelGranted:
      typeof data.apparelGranted === "boolean" ? data.apparelGranted : false,
    linkedSubscriptionId:
      typeof data.linkedSubscriptionId === "string"
        ? data.linkedSubscriptionId
        : null,
  };
};

// --- Service Functions ---

const CLUB_SERVICES_EVENTS_COLLECTION = "clubServiceEvents";

/**
 * Logs an event in the operational history for club services (subscriptions).
 */
const logClubServiceEvent = async (
  serviceId: string,
  serviceName: string,
  type: "create" | "update" | "delete",
  userId: string,
  userName: string,
  details?: string
) => {
  try {
    const db = getDb();
    await addDoc(collection(db, CLUB_SERVICES_EVENTS_COLLECTION), {
      serviceId,
      serviceName,
      type,
      userId,
      userName,
      details: details || "",
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Failed to log club service event:", error);
  }
};

/**
 * Retrieves the operational history for club services.
 */
export const getClubServiceEvents = async () => {
  const db = getDb();
  const q = query(collection(db, CLUB_SERVICES_EVENTS_COLLECTION), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getAllClubServices = async (): Promise<ClubService[]> => {
  const db = getDb();
  const q = query(collection(db, SERVICES_COLLECTION), orderBy("name"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToClubService).filter(Boolean) as ClubService[];
};

export const addClubService = async (
  service: Omit<ClubService, "id">,
  userId: string,
  userName: string
): Promise<string> => {
  const db = getDb();
  const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
    ...service,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { userId, userName },
    updatedBy: { userId, userName },
  });
  
  await logClubServiceEvent(docRef.id, service.name, "create", userId, userName, `Създаден абонамент: Цена ${service.price} EUR`);
  
  return docRef.id;
};

export const updateClubService = async (
  id: string,
  service: Partial<ClubService>,
  userId: string,
  userName: string
): Promise<void> => {
  const db = getDb();
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  const oldDoc = await getDoc(serviceRef);
  
  let details = "Актуализирани данни за абонамента";
  let serviceName = service.name || "Неизвестен абонамент";

  if (oldDoc.exists()) {
    const oldData = oldDoc.data() as ClubService;
    serviceName = service.name || oldData.name;
    const changes: string[] = [];
    
    if (service.price !== undefined && service.price !== oldData.price) {
      changes.push(`Цена: ${oldData.price} -> ${service.price} EUR`);
    }
    if (service.name !== undefined && service.name !== oldData.name) {
      changes.push(`Име променено`);
    }
    if (service.billingPeriod !== undefined && service.billingPeriod !== oldData.billingPeriod) {
      changes.push(`Период: ${oldData.billingPeriod} -> ${service.billingPeriod}`);
    }
    
    if (changes.length > 0) {
      details = changes.join(", ");
    }
  }

  await updateDoc(serviceRef, {
    ...service,
    updatedAt: new Date().toISOString(),
    updatedBy: { userId, userName },
  });
  
  await logClubServiceEvent(id, serviceName, "update", userId, userName, details);
};

export const deleteClubService = async (id: string, userName: string, userId: string, serviceName: string = "Изтрит абонамент"): Promise<void> => {
  const db = getDb();
  const serviceRef = doc(db, SERVICES_COLLECTION, id);
  await deleteDoc(serviceRef);
  
  await logClubServiceEvent(id, serviceName, "delete", userId, userName, "Абонаментът е изтрит от каталога");
};

// --- Subscription Functions ---

/**
 * Fetches ALL member subscriptions in a SINGLE Firestore query.
 * Use this for list views instead of looping over members (N+1 bug prevention).
 */
export const getAllMemberSubscriptions = async (): Promise<Subscription[]> => {
  const db = getDb();
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    orderBy("startDate", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(docToMemberSubscription)
    .filter(Boolean) as Subscription[];
};

export const getSubscriptionsByMemberId = async (
  memberId: string
): Promise<Subscription[]> => {
  const db = getDb();
  const q = query(
    collection(db, SUBSCRIPTIONS_COLLECTION),
    where("memberId", "==", memberId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(docToMemberSubscription)
    .filter(Boolean) as Subscription[];
};

export const createSubscription = async (
  subscription: Omit<Subscription, "id">,
  _userId: string,
  _userName: string
): Promise<string> => {
  const db = getDb();
  const subRef = doc(collection(db, "memberSubscriptions"));

  // FIX: Определяме статуса на базата на цената
  const saleStatus = subscription.price > 0 ? "completed" : "informational";

  const saleData = {
    memberId: subscription.memberId,
    subscriptionId: subRef.id,
    saleDate: Timestamp.now(),
    items: [
      {
        productId: subscription.serviceId,
        name: subscription.serviceName,
        quantity: 1,
        price: subscription.price,
      },
    ],
    totalAmount: subscription.price,
    currency: subscription.currency,
    isPaid: subscription.pricePaid >= subscription.price,
    status: saleStatus, // <-- FIX: Използваме динамично определения статус
  };

  await runTransaction(db, async (transaction) => {
    // 1. Записваме абонамента
    transaction.set(subRef, { ...subscription, id: subRef.id });

    // 2. Записваме продажбата автоматично
    const saleRef = doc(collection(db, "sales"));
    transaction.set(saleRef, saleData);

    // 3. Обновяваме последната дата на плащане в профила на члена, само ако е имало реално плащане
    if (subscription.price > 0) {
      // <-- FIX
      const memberRef = doc(db, MEMBERS_COLLECTION, subscription.memberId);
      transaction.update(memberRef, {
        lastPaymentDate: new Date().toISOString(),
      });
    }
  });

  return subRef.id;
};

export const updateSubscription = async (
  id: string,
  subscriptionUpdate: Partial<Subscription>
): Promise<void> => {
  const db = getDb();
  const subRef = doc(db, SUBSCRIPTIONS_COLLECTION, id);
  const cleanSubscriptionUpdate: { [key: string]: unknown } = {};
  Object.entries(subscriptionUpdate).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanSubscriptionUpdate[key] = value;
    }
  });
  await updateDoc(subRef, cleanSubscriptionUpdate);
};
