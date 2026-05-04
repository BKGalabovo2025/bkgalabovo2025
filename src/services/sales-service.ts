import {
  getDocs,
  doc,
  getDoc,
  collection,
  DocumentSnapshot,
  Timestamp,
  runTransaction,
  query,
  where,
  limit,
  orderBy,
  updateDoc,
  deleteDoc,
  WithFieldValue,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  Sale,
  Subscription,
  InventoryEvent,
  Member,
  ClubService,
  ClubGeneralService,
} from "@/types";
import { docToMember } from "./member-service";
import {
  docToClubService,
  docToMemberSubscription,
} from "./subscription-service";
import {
  getSalesCollection,
  getMembersCollection,
  getMemberSubscriptionsCollection,
  getClubServicesCollection,
  getClubGeneralServicesCollection,
  getProductsCollection,
  getInventoryEventsCollection,
} from "@/lib/firebase-collections";

export const docToSale = (doc: DocumentSnapshot): Sale | null => {
  if (!doc.id || !doc.exists()) {
    return null;
  }
  const data = doc.data();
  const saleDate = data.saleDate?.toDate?.() || new Date();
  const createdAt = data.createdAt?.toDate?.() || new Date();

  return {
    id: doc.id,
    memberId: data.memberId,
    saleDate: saleDate.toISOString(),
    items: data.items || [],
    status: data.status || "completed",
    currency: data.currency || "EUR",
    totalAmount: Number(data.totalAmount) || 0,
    isPaid: typeof data.isPaid === "boolean" ? data.isPaid : true,
    subscriptionId: data.subscriptionId || null,
    billingMonth: data.billingMonth || null,
    billingYear: data.billingYear || null,
    relatedReservationId: data.relatedReservationId || null,
    clientName: data.clientName || null,
    createdAt: createdAt.toISOString(),
  };
};

export interface ReceiptDetails {
  sale: Sale;
  member: Member;
  relatedMember: Member | null;
  service?: ClubService | null;
  generalService?: ClubGeneralService | null;
  subscription?: Subscription | null;
}

export const getReceiptDetails = async (
  saleId: string
): Promise<ReceiptDetails | null> => {
  const saleRef = doc(getSalesCollection(), saleId);
  const saleSnap = await getDoc(saleRef);

  if (!saleSnap.exists()) {
    console.error("No sale found with ID:", saleId);
    return null;
  }

  const sale = docToSale(saleSnap);
  if (!sale || !sale.memberId) {
    console.error("Sale data is incomplete:", sale);
    return null;
  }

  // 1. Fetch member — gracefully handle missing member instead of blocking the receipt
  const memberSnap = await getDoc(doc(getMembersCollection(), sale.memberId));
  let member;
  if (!memberSnap.exists()) {
    console.warn(`Member not found for memberId: ${sale.memberId} — rendering receipt with placeholder.`);
    // Return a minimal placeholder so the receipt can still render
    member = {
      id: sale.memberId,
      firstName: "Външен",
      lastName: "Клиент",
      email: "",
      phone: "",
      role: "active" as const,
      relatedMemberId: null,
      createdAt: "",
      updatedAt: "",
    } as any;
  } else {
    member = docToMember(memberSnap);
    if (!member) return null;
  }

  // 2. Resolve related member if exists
  const relatedMemberSnap = member.relatedMemberId
    ? await getDoc(doc(getMembersCollection(), member.relatedMemberId))
    : null;
  const relatedMember = relatedMemberSnap?.exists() ? docToMember(relatedMemberSnap) : null;

  let subscription: Subscription | null = null;
  let service: ClubService | null = null;

  // 3. Try to fetch subscription and service if linked
  if (sale.subscriptionId) {
    const subSnap = await getDoc(doc(getMemberSubscriptionsCollection(), sale.subscriptionId));
    if (subSnap.exists()) {
      subscription = docToMemberSubscription(subSnap);
      if (subscription?.serviceId) {
        const svcSnap = await getDoc(doc(getClubServicesCollection(), subscription.serviceId));
        if (svcSnap.exists()) {
          service = docToClubService(svcSnap);
        }
      }
    }
  }

  // 4. Fallback: If no subscription but we have items, try to get service info from the first item's productId
  let generalService: ClubGeneralService | null = null;
  if (!service && sale.items && sale.items.length > 0 && sale.items[0].productId) {
    // Try ClubService collection
    const svcSnap = await getDoc(doc(getClubServicesCollection(), sale.items[0].productId));
    if (svcSnap.exists()) {
      service = docToClubService(svcSnap);
    } else {
      // Try ClubGeneralService collection
      const genSvcSnap = await getDoc(doc(getClubGeneralServicesCollection(), sale.items[0].productId));
      if (genSvcSnap.exists()) {
        generalService = genSvcSnap.data() as ClubGeneralService;
        generalService.id = genSvcSnap.id;
      }
    }
  }

  return { sale, member, relatedMember, service, subscription, generalService };
};


export const getInventorySales = async (): Promise<Sale[]> => {
  const q = query(
    getSalesCollection(),
    where("subscriptionId", "==", null),
    orderBy("saleDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const addSale = async (
  saleData: Omit<Sale, "id" | "createdAt">,
  userId: string,
  userName: string
): Promise<string> => {
  const db = getDb();
  const newSaleRef = doc(getSalesCollection());

  await runTransaction(db, async (transaction) => {
    // 1. First, perform all READS
    const productUpdates = [];
    for (const item of saleData.items) {
      // Първо проверяваме в продуктите
      const productRef = doc(getProductsCollection(), item.productId);
      const productDoc = await transaction.get(productRef);
      
      if (productDoc.exists()) {
        const currentStock = productDoc.data().stock || 0;
        const newStock = currentStock - item.quantity;
        if (newStock < 0) {
          throw new Error(`Няма достатъчна наличност за ${item.name}.`);
        }
        productUpdates.push({ ref: productRef, newStock, isProduct: true, name: item.name, quantity: item.quantity });
      } else {
        // Ако не е продукт, проверяваме в клубни услуги (абонаменти)
        const serviceRef = doc(getClubServicesCollection(), item.productId);
        const serviceDoc = await transaction.get(serviceRef);
        
        if (serviceDoc.exists()) {
          productUpdates.push({ ref: serviceRef, isProduct: false, name: item.name, quantity: item.quantity });
        } else {
          // Ако не е нито продукт, нито абонаментна услуга, проверяваме в общи услуги
          const generalServiceRef = doc(getClubGeneralServicesCollection(), item.productId);
          const generalServiceDoc = await transaction.get(generalServiceRef);
          
          if (!generalServiceDoc.exists()) {
            throw new Error(`Артикул с ID ${item.productId} не е намерен нито в продукти, нито в услуги.`);
          }
          productUpdates.push({ ref: generalServiceRef, isProduct: false, name: item.name, quantity: item.quantity });
        }
      }
    }

    // 2. Then, perform all WRITES
    const salePayload: WithFieldValue<Omit<Sale, "id">> = {
      ...saleData,
      createdAt: Timestamp.now(),
    };
    transaction.set(newSaleRef, salePayload);

    for (const update of productUpdates) {
      if (update.isProduct && update.newStock !== undefined) {
        transaction.update(update.ref, { stock: update.newStock });

        const eventRef = doc(getInventoryEventsCollection());
        const eventPayload: WithFieldValue<InventoryEvent> = {
          id: eventRef.id,
          productId: update.ref.id,
          productName: update.name,
          type: "sale",
          quantityChange: -update.quantity,
          createdAt: new Date().toISOString(),
          userId,
          userName,
          relatedSaleId: newSaleRef.id,
        };
        transaction.set(eventRef, eventPayload);
      }
    }
  });

  return newSaleRef.id;
};

export const getSales = async (limitCount: number = 100): Promise<Sale[]> => {
  const q = query(
    getSalesCollection(),
    orderBy("saleDate", "desc"),
    limit(limitCount)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
  if (!memberId) return [];
  const q = query(
    getSalesCollection(),
    where("memberId", "==", memberId),
    orderBy("saleDate", "desc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const hasMemberPaidForMonth = async (
  memberId: string,
  year: number,
  month: number
): Promise<boolean> => {
  const sales = await getSalesByMemberId(memberId);
  return sales.some((sale) => {
    if (!sale.subscriptionId) {
      return false; // Игнорираме продажби, които не са за абонамент
    }
    const saleDate = new Date(sale.saleDate);
    return (
      saleDate.getFullYear() === year && saleDate.getMonth() === month - 1 // Месеците в JS са 0-индексирани
    );
  });
};

export const getSaleById = async (id: string): Promise<Sale | null> => {
  if (!id) return null;
  const saleRef = doc(getSalesCollection(), id);
  const docSnap = await getDoc(saleRef);
  return docToSale(docSnap);
};

export const updateSale = async (
  id: string,
  data: Partial<Omit<Sale, "id" | "createdAt">>
): Promise<void> => {
  if (!id) throw new Error("Sale ID is required for update.");
  const saleRef = doc(getSalesCollection(), id);

  const dataToUpdate: { [key: string]: unknown } = { ...data };
  if (data.saleDate) {
    dataToUpdate.saleDate = Timestamp.fromDate(new Date(data.saleDate));
  }

  await updateDoc(saleRef, dataToUpdate);
};

export const deleteSale = async (id: string): Promise<void> => {
  if (!id) throw new Error("Sale ID is required for deletion.");
  const saleRef = doc(getSalesCollection(), id);
  await deleteDoc(saleRef);
};

export const findOrCreateSaleForSubscription = async (
  subscription: Subscription
): Promise<Sale | null> => {
  const db = getDb();
  const existingSale = await getSaleBySubscriptionId(subscription.id);
  if (existingSale) return existingSale;

  const firstPayment = subscription.paymentHistory?.[0];
  if (!firstPayment || !subscription.memberId) return null;

  try {
    const createdSale = await runTransaction(db, async (transaction) => {
      const subscriptionRef = doc(
        getMemberSubscriptionsCollection(),
        subscription.id
      );
      const newSaleRef = doc(getSalesCollection());

      const saleDataForFirestore: WithFieldValue<Omit<Sale, "id">> = {
        memberId: subscription.memberId,
        subscriptionId: subscription.id,
        saleDate: Timestamp.fromDate(new Date(firstPayment.date)),
        items: [
          {
            productId: subscription.serviceId,
            name: subscription.serviceName,
            quantity: 1,
            price: firstPayment.amount,
          },
        ],
        totalAmount: firstPayment.amount,
        currency: "EUR",
        isPaid: true,
        status: "completed",
        createdAt: Timestamp.now(),
      };

      transaction.set(newSaleRef, saleDataForFirestore);

      const updatedPaymentHistory = subscription.paymentHistory.map((p, i) =>
        i === 0 ? { ...p, saleId: newSaleRef.id } : p
      );
      transaction.update(subscriptionRef, {
        paymentHistory: updatedPaymentHistory,
      });

      // Manually construct the Sale object for return to avoid another DB read
      const saleToReturn = {
        id: newSaleRef.id,
        ...saleDataForFirestore,
        saleDate: (saleDataForFirestore.saleDate as Timestamp)
          .toDate()
          .toISOString(),
        createdAt: (saleDataForFirestore.createdAt as Timestamp)
          .toDate()
          .toISOString(),
      } as Sale;

      return saleToReturn;
    });

    if (createdSale) {
      console.log(
        `Self-healed: Created new sale ${createdSale.id} for subscription ${subscription.id}`
      );
    }
    return createdSale;
  } catch (error) {
    console.error(
      "Error in findOrCreateSaleForSubscription transaction:",
      error
    );
    throw error;
  }
};

const getSaleBySubscriptionId = async (
  subscriptionId: string
): Promise<Sale | null> => {
  if (!subscriptionId) return null;
  const q = query(
    getSalesCollection(),
    where("subscriptionId", "==", subscriptionId),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return docToSale(querySnapshot.docs[0]);
};

export interface MonthlyBillingInfo {
  month: number;
  year: number;
  attendanceCount: number;
  isPaid: boolean;
  sale?: Sale;
  eventIds: string[];
}

/**
 * Aggregates attendance and payment info per month for a member.
 * Combines data from 'events' and 'sales' collections.
 */
export const getMemberMonthlyBillingHistory = async (
  memberId: string
): Promise<MonthlyBillingInfo[]> => {
  const db = getDb();
  const [sales, eventsSnap] = await Promise.all([
    getSalesByMemberId(memberId),
    getDocs(
      query(
        collection(db, "events"),
        where("attendeeMemberIds", "array-contains", memberId)
      )
    ),
  ]);

  const billingMap: Record<string, MonthlyBillingInfo> = {};

  // 1. Process Attendances from events
  eventsSnap.docs.forEach((doc) => {
    const event = doc.data() as any;
    const attendee = event.attendees?.find((a: any) => a.memberId === memberId);
    if (!attendee?.attended) return;

    const date = event.startDate?.toDate
      ? event.startDate.toDate()
      : new Date(event.startDate);
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const key = `${year}-${month}`;

    if (!billingMap[key]) {
      billingMap[key] = {
        month,
        year,
        attendanceCount: 0,
        isPaid: false,
        eventIds: [],
      };
    }
    billingMap[key].attendanceCount++;
    billingMap[key].eventIds.push(doc.id);
  });

  // 2. Process Sales to mark months as paid
  sales.forEach((sale) => {
    let targetMonth = sale.billingMonth;
    let targetYear = sale.billingYear;

    // Smart inference if explicit fields are missing
    if (!targetMonth || !targetYear) {
      // Try to find a month name in parentheses in any item name
      // Example: "Месечна такса (Януари)"
      for (const item of sale.items) {
        const match = item.name.match(/\(([^)]+)\)/);
        if (match) {
          const monthName = match[1].toLowerCase();
          const monthsBG = ["януари", "февруари", "март", "април", "май", "юни", "юли", "август", "септември", "октомври", "ноември", "декември"];
          const monthIdx = monthsBG.findIndex(m => monthName.includes(m));
          if (monthIdx !== -1) {
            targetMonth = monthIdx + 1;
            targetYear = new Date(sale.saleDate).getFullYear();
            break;
          }
        }
      }

      // If still not found, and it looks like a subscription, use the sale date
      if (!targetMonth) {
        const isSubscription = sale.items.some(item => 
          item.name.toLowerCase().includes("абонамент") || 
          item.name.toLowerCase().includes("такса")
        );
        if (isSubscription) {
          const sDate = new Date(sale.saleDate);
          targetMonth = sDate.getMonth() + 1;
          targetYear = sDate.getFullYear();
        }
      }
    }

    if (targetMonth && targetYear) {
      const key = `${targetYear}-${targetMonth}`;
      if (!billingMap[key]) {
        billingMap[key] = {
          month: targetMonth,
          year: targetYear,
          attendanceCount: 0,
          isPaid: true,
          sale,
          eventIds: [],
        };
      } else {
        billingMap[key].isPaid = true;
        billingMap[key].sale = sale;
      }
    }
  });

  return Object.values(billingMap).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
};

