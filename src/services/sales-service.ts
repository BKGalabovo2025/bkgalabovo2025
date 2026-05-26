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
import { getSiteConfig } from "@/config/sites";

export const docToSale = (doc: DocumentSnapshot): Sale | null => {
  if (!doc.id || !doc.exists()) {
    return null;
  }
  const data = doc.data();
  const saleDate = data.saleDate?.toDate?.() || new Date();
  const createdAt = data.createdAt?.toDate?.() || new Date();

  console.log(`Sale ID: ${doc.id}, Raw Type: ${data.type}`);

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
    type: data.type || "inventory",

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

  const q1 = query(
    getSalesQuery(),
    where("memberId", "in", memberIds.slice(0, 30))
  );
  const q2 = query(
    getSalesQuery(),
    where(
      "memberIdsForAttendance",
      "array-contains-any",
      memberIds.slice(0, 10)
    )
  );

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const map = new Map<string, Sale>();

  snapshot1.docs.forEach((doc) => {
    const sale = docToSale(doc);
    if (sale) map.set(sale.id, sale);
  });

  snapshot2.docs.forEach((doc) => {
    const sale = docToSale(doc);
    if (sale) map.set(sale.id, sale);
  });

  const sales = Array.from(map.values());
  return sales.sort(
    (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()
  );
};

export const getSalesByMemberId = async (memberId: string): Promise<Sale[]> => {
  if (!memberId) return [];

  const q1 = query(getSalesQuery(), where("memberId", "==", memberId));
  const q2 = query(
    getSalesQuery(),
    where("memberIdsForAttendance", "array-contains", memberId)
  );

  const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

  const map = new Map<string, Sale>();

  snapshot1.docs.forEach((doc) => {
    const sale = docToSale(doc);
    if (sale) map.set(sale.id, sale);
  });

  snapshot2.docs.forEach((doc) => {
    const sale = docToSale(doc);
    if (sale) map.set(sale.id, sale);
  });

  const sales = Array.from(map.values());
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

  // Добавяме siteId към ъпдейта, за да минем през Firestore Security Rules,
  // в случай че старият документ няма такъв.
  const activeSiteId = getSiteConfig().id;
  dataToUpdate.siteId = activeSiteId;

  await updateDoc(saleRef, dataToUpdate);
};

export const deleteSale = async (id: string): Promise<void> => {
  if (!id) throw new Error("Sale ID is required for deletion.");
  const saleRef = doc(getSalesCollection(), id);
  await deleteDoc(saleRef);
};
