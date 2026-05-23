import {
  getDocs,
  doc,
  getDoc,
  DocumentSnapshot,
  Timestamp,
  query,
  where,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { Sale } from "@/types";
import { getSalesQuery, getSalesCollection } from "@/lib/firebase-collections";
import { getDb } from "@/lib/firebase";

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

export const getSales = async (): Promise<Sale[]> => {
  const q = query(getSalesQuery());
  const querySnapshot = await getDocs(q);
  const sales = querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
  return sales.sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );
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
  const sales = querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
  return sales.sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );
};

export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
  if (!memberId) return [];
  const q = query(getSalesQuery(), where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);
  const sales = querySnapshot.docs.map(docToSale).filter(Boolean) as Sale[];
  return sales.sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );
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

  // FIX: Синхронизиране на абонамента, ако продажбата е маркирана като платена или неплатена
  const docSnap = await getDoc(saleRef);
  if (docSnap.exists()) {
    const saleDataObj = docSnap.data();
    if (saleDataObj.subscriptionId) {
      const subRef = doc(
        getDb(),
        "memberSubscriptions",
        saleDataObj.subscriptionId
      );
      const subSnap = await getDoc(subRef);
      if (subSnap.exists()) {
        if (data.status === "completed" && data.isPaid === true) {
          await updateDoc(subRef, {
            status: "active",
            pricePaid: saleDataObj.totalAmount || 0,
            updatedAt: new Date().toISOString(),
          });

          // Обновяваме lastPaymentDate на члена
          if (saleDataObj.memberId && (saleDataObj.totalAmount || 0) > 0) {
            const memberRef = doc(getDb(), "members", saleDataObj.memberId);
            await updateDoc(memberRef, {
              lastPaymentDate: new Date().toISOString(),
            });
          }
        } else if (data.status === "pending" && data.isPaid === false) {
          // Отменено плащане -> връщаме в чакащи
          await updateDoc(subRef, {
            status: "pending_payment",
            pricePaid: 0,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    }
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  if (!id) throw new Error("Sale ID is required for deletion.");
  const saleRef = doc(getSalesCollection(), id);
  await deleteDoc(saleRef);
};
