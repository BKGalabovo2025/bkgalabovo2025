import {
  getDocs,
  doc,
  getDoc,
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
    createdAt: createdAt.toISOString(),
  };
};

export interface ReceiptDetails {
  sale: Sale;
  member: Member;
  relatedMember: Member | null;
  service: ClubService;
  subscription: Subscription;
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
  if (!sale || !sale.memberId || !sale.subscriptionId) {
    console.error("Sale data is incomplete:", sale);
    return null;
  }

  const [memberSnap, subscriptionSnap] = await Promise.all([
    getDoc(doc(getMembersCollection(), sale.memberId)),
    getDoc(doc(getMemberSubscriptionsCollection(), sale.subscriptionId)),
  ]);

  if (!memberSnap.exists() || !subscriptionSnap.exists()) {
    console.error("Member or subscription not found.");
    return null;
  }

  const member = docToMember(memberSnap);
  const subscription = docToMemberSubscription(subscriptionSnap);

  if (!member || !subscription || !subscription.serviceId) {
    console.error("Parsed member or subscription data is incomplete.");
    return null;
  }

  const serviceRef = doc(getClubServicesCollection(), subscription.serviceId);
  const relatedMemberRef = member.relatedMemberId
    ? doc(getMembersCollection(), member.relatedMemberId)
    : null;

  const [serviceSnap, relatedMemberSnap] = await Promise.all([
    getDoc(serviceRef),
    relatedMemberRef ? getDoc(relatedMemberRef) : Promise.resolve(null),
  ]);

  if (!serviceSnap.exists()) {
    console.error("Service not found");
    return null;
  }

  const service = docToClubService(serviceSnap);
  if (!service) return null;

  const relatedMember =
    relatedMemberSnap && relatedMemberSnap.exists()
      ? docToMember(relatedMemberSnap)
      : null;

  return { sale, member, relatedMember, service, subscription };
};

export const getSales = async (): Promise<Sale[]> => {
  const q = query(
    getSalesCollection(),
    orderBy("saleDate", "desc"),
    limit(100)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
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
    const salePayload: WithFieldValue<Omit<Sale, "id">> = {
      ...saleData,
      createdAt: Timestamp.now(),
    };
    transaction.set(newSaleRef, salePayload);

    for (const item of saleData.items) {
      const productRef = doc(getProductsCollection(), item.productId);
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      const currentStock = productDoc.data().stock || 0;
      const newStock = currentStock - item.quantity;
      if (newStock < 0) {
        throw new Error(`Not enough stock for ${item.name}.`);
      }

      transaction.update(productRef, { stock: newStock });

      const eventRef = doc(getInventoryEventsCollection());
      const eventPayload: WithFieldValue<InventoryEvent> = {
        id: eventRef.id,
        productId: item.productId,
        productName: item.name,
        type: "sale",
        quantityChange: -item.quantity,
        createdAt: new Date().toISOString(),
        userId,
        userName,
        relatedSaleId: newSaleRef.id,
      };
      transaction.set(eventRef, eventPayload);
    }
  });

  return newSaleRef.id;
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
