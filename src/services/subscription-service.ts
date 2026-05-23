import {
  getDocs,
  doc,
  query,
  where,
  runTransaction,
  updateDoc,
  orderBy,
  DocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  getMemberSubscriptionsCollection,
  getMemberSubscriptionsQuery,
  getClubServicesQuery,
  getSessionsQuery,
  getSalesCollection,
  getMembersCollection,
} from "@/lib/firebase-collections";
import { getDb } from "@/lib/firebase";
import { getSiteConfig } from "@/config/sites";
import { Subscription, ClubService } from "@/types/index";

// --- Converters ---
export const docToClubService = (doc: DocumentSnapshot): ClubService | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    siteId: data.siteId || "default",
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
    // Recovery Zone specific fields
    requiredResources: data.requiredResources,
    isExclusive:
      typeof data.isExclusive === "boolean" ? data.isExclusive : false,
    bufferAfter: typeof data.bufferAfter === "number" ? data.bufferAfter : 0,

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

export const sessionToClubService = (
  doc: DocumentSnapshot
): ClubService | null => {
  if (!doc.id || !doc.exists()) return null;
  const data = doc.data() || {};
  return {
    id: doc.id,
    siteId: "recoveryzone",
    name: typeof data.name === "string" ? data.name : "Неименувана услуга",
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : 0,
    currency: "EUR",
    type: "Еднократно плащане",
    billingPeriod: null,
    targetGroups: [],
    isCoachLed: false,
    durationMinutes: typeof data.duration === "number" ? data.duration : 0,
    requiresBooking: true,
    category: typeof data.category === "string" ? data.category : "Други",
    zones: Array.isArray(data.zones)
      ? data.zones
      : typeof data.zones === "string"
        ? data.zones.split(",").map((z: string) => z.trim())
        : [],
    athleteCount: typeof data.athleteCount === "number" ? data.athleteCount : 1,
    numberOfDays: typeof data.numberOfDays === "number" ? data.numberOfDays : 1,
    proceduresPerDay:
      typeof data.proceduresPerDay === "number" ? data.proceduresPerDay : 1,
    sessionType:
      typeof data.sessionType === "string"
        ? data.sessionType
        : "Възстановяване",
    minMembers: 0,
    maxMembers: 0,
    specialRights: [],
    cancellationPolicy: {
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
    createdBy: { userId: "", userName: "" },
    updatedBy: { userId: "", userName: "" },
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
    siteId: data.siteId || "default",
  };
};

// --- Service Functions ---

export const getAllClubServices = async (): Promise<ClubService[]> => {
  const siteConfig = getSiteConfig();

  if (siteConfig.id === "recoveryzone") {
    const q = getSessionsQuery();
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(sessionToClubService)
      .filter(Boolean) as ClubService[];
  }

  const q = getClubServicesQuery();
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docToClubService).filter(Boolean) as ClubService[];
};

// --- Subscription Functions ---

/**
 * Fetches ALL member subscriptions in a SINGLE Firestore query.
 * Use this for list views instead of looping over members (N+1 bug prevention).
 */
export const getAllMemberSubscriptions = async (): Promise<Subscription[]> => {
  const q = query(getMemberSubscriptionsQuery(), orderBy("startDate", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(docToMemberSubscription)
    .filter(Boolean) as Subscription[];
};

export const getSubscriptionsByMemberId = async (
  memberId: string
): Promise<Subscription[]> => {
  const q = query(
    getMemberSubscriptionsQuery(),
    where("memberId", "==", memberId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(docToMemberSubscription)
    .filter(Boolean) as Subscription[];
};

export const createSubscription = async (
  subscription: Omit<Subscription, "id" | "siteId">,
  _userId: string,
  _userName: string
): Promise<string> => {
  const db = getDb();
  const subRef = doc(getMemberSubscriptionsCollection());

  // FIX: Определяме статуса на базата на цената и платеното
  const isPaid = subscription.pricePaid >= subscription.price;
  const saleStatus =
    subscription.price > 0
      ? isPaid
        ? "completed"
        : "pending"
      : "informational";

  const saleRef = doc(getSalesCollection());
  const saleData = {
    id: saleRef.id,
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
    isPaid: isPaid,
    status: saleStatus,
    siteId: getSiteConfig().id,
  };

  await runTransaction(db, async (transaction) => {
    // 1. Записваме абонамента
    transaction.set(subRef, {
      ...subscription,
      id: subRef.id,
      siteId: getSiteConfig().id,
    });

    // 2. Записваме продажбата автоматично
    transaction.set(saleRef, saleData as Record<string, unknown>);

    // 3. Обновяваме последната дата на плащане в профила на члена, само ако е РЕАЛНО платено
    if (isPaid && subscription.price > 0) {
      const memberRef = doc(getMembersCollection(), subscription.memberId);
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
  const subRef = doc(getMemberSubscriptionsCollection(), id);
  const cleanSubscriptionUpdate: { [key: string]: unknown } = {};
  Object.entries(subscriptionUpdate).forEach(([key, value]) => {
    if (value !== undefined) {
      cleanSubscriptionUpdate[key] = value;
    }
  });
  await updateDoc(subRef, cleanSubscriptionUpdate);
};
