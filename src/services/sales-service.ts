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
  updateDoc,
  deleteDoc,
  WithFieldValue,
  collection,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  Sale,
  Subscription,
  InventoryEvent,
  Member,
  ClubService,
  Family,
} from "@/types";
import { docToMember } from "./member-service";
import {
  docToClubService,
  docToMemberSubscription,
} from "./subscription-service";
import {
  getProductsCollection,
  getInventoryEventsCollection,
  getSalesQuery,
  getSalesCollection,
  getMembersCollection,
  getMemberSubscriptionsCollection,
  getClubServicesCollection,
} from "@/lib/firebase-collections";
import { getSiteConfig } from "@/config/sites";

export const docToSale = (doc: DocumentSnapshot): Sale | null => {
  if (!doc.id || !doc.exists()) {
    return null;
  }
  const data = doc.data();
  const saleDate = data.saleDate?.toDate?.() || new Date();
  const createdAt = data.createdAt?.toDate?.() || new Date();

  return {
    id: doc.id,
    siteId: data.siteId || "default",
    memberId: data.memberId,
    saleDate: saleDate.toISOString(),
    items: data.items || [],
    status: data.status || "completed",
    currency: data.currency || "EUR",
    totalAmount: Number(data.totalAmount) || 0,
    isPaid: typeof data.isPaid === "boolean" ? data.isPaid : true,
    paymentMethod: data.paymentMethod || "В брой",
    note: data.note || "",
    subscriptionId: data.subscriptionId || null,
    createdAt: createdAt.toISOString(),
  };
};

export interface ReceiptDetails {
  sale: Sale;
  member: Member;
  relatedMember: Member | null;
  service: ClubService | null;
  subscription: Subscription | null;
  family: Family | null;
  familyMembers: Member[];
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
    console.error("Sale data is incomplete (missing memberId):", sale);
    return null;
  }

  const memberSnap = await getDoc(doc(getMembersCollection(), sale.memberId));
  if (!memberSnap.exists()) {
    console.error("Member not found for sale:", sale.memberId);
    return null;
  }

  const member = docToMember(memberSnap);
  if (!member) return null;

  let subscription: Subscription | null = null;
  let service: ClubService | null = null;

  if (sale.subscriptionId) {
    const subscriptionSnap = await getDoc(
      doc(getMemberSubscriptionsCollection(), sale.subscriptionId)
    );
    if (subscriptionSnap.exists()) {
      subscription = docToMemberSubscription(subscriptionSnap);
      if (subscription?.serviceId) {
        const serviceSnap = await getDoc(
          doc(getClubServicesCollection(), subscription.serviceId)
        );
        if (serviceSnap.exists()) {
          service = docToClubService(serviceSnap);
        }
      }
    }
  }

  const relatedMemberRef = member.relatedMemberId
    ? doc(getMembersCollection(), member.relatedMemberId)
    : null;

  const relatedMemberSnap = relatedMemberRef
    ? await getDoc(relatedMemberRef)
    : null;

  const relatedMember =
    relatedMemberSnap && relatedMemberSnap.exists()
      ? docToMember(relatedMemberSnap)
      : null;

  let family: Family | null = null;
  const familyMembers: Member[] = [];

  const familiesRef = collection(getDb(), "families");
  const familyQ = query(
    familiesRef,
    where("memberIds", "array-contains", sale.memberId)
  );
  const familySnapshot = await getDocs(familyQ);

  if (!familySnapshot.empty) {
    const familyDoc = familySnapshot.docs[0];
    const familyData = { ...familyDoc.data(), id: familyDoc.id } as Family;
    family = familyData;

    // Fetch other members of the same family
    const otherMemberIds = familyData.memberIds.filter(
      (id) => id !== sale.memberId
    );
    if (otherMemberIds.length > 0) {
      const membersRef = getMembersCollection();
      const mq = query(
        membersRef,
        where("__name__", "in", otherMemberIds.slice(0, 30))
      );
      const mSnapshot = await getDocs(mq);
      familyMembers.push(
        ...(mSnapshot.docs.map(docToMember).filter(Boolean) as Member[])
      );
    }
  }

  return {
    sale,
    member,
    relatedMember,
    service,
    subscription,
    family,
    familyMembers,
  };
};

export const getSales = async (): Promise<Sale[]> => {
  const q = query(getSalesQuery(), limit(100));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const getSalesByMemberIds = async (
  memberIds: string[]
): Promise<Sale[]> => {
  if (!memberIds || memberIds.length === 0) return [];
  const q = query(
    getSalesQuery(),
    where("memberId", "in", memberIds.slice(0, 30))
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
};

export const getInventorySales = async (): Promise<Sale[]> => {
  const q = query(getSalesQuery(), where("subscriptionId", "==", null));
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
        siteId: getSiteConfig().id,
      };
      transaction.set(eventRef, eventPayload);
    }
  });

  return newSaleRef.id;
};

export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
  if (!memberId) return [];
  const q = query(getSalesQuery(), where("memberId", "==", memberId));
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
        siteId: "default",
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
        paymentMethod: firstPayment.paymentMethod || "В брой",
        note: firstPayment.note || "",
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
    getSalesQuery(),
    where("subscriptionId", "==", subscriptionId),
    limit(1)
  );
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  return docToSale(querySnapshot.docs[0]);
};
