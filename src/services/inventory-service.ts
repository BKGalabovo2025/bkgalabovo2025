import { getDocs, DocumentSnapshot, Timestamp } from "firebase/firestore";
import {
  getProductsQuery,
  getInventoryEventsQuery,
} from "@/lib/firebase-collections";
import { Product, InventoryEvent } from "@/types";

export const docToProduct = (doc: DocumentSnapshot): Product | null => {
  if (!doc.id || !doc.exists()) {
    console.error("docToProduct: Invalid document snapshot.", { id: doc.id });
    return null;
  }
  const data = doc.data() || {};

  const name = data.name;
  if (typeof name !== "string" || name.trim() === "") {
    console.warn(
      `docToProduct: Skipping product with invalid or missing name.`,
      { id: doc.id }
    );
    return null;
  }

  const product: Product = {
    id: doc.id,
    siteId: typeof data.siteId === "string" ? data.siteId : "default",
    name: name,
    description: typeof data.description === "string" ? data.description : "",
    price: typeof data.price === "number" ? data.price : 0,
    currency: "EUR", // Force EUR
    stock: typeof data.stock === "number" ? data.stock : 0,
    category:
      typeof data.category === "string" ? data.category : "Без категория",
    imageUrl: typeof data.imageUrl === "string" ? data.imageUrl : "",
    restockThreshold:
      typeof data.restockThreshold === "number" ? data.restockThreshold : null,
  };

  return product;
};

const docToInventoryEvent = (
  doc: DocumentSnapshot
): InventoryEvent | null => {
  if (!doc.id || !doc.exists()) {
    console.error("docToInventoryEvent: Invalid document snapshot.", {
      id: doc.id,
    });
    return null;
  }
  const data = doc.data() || {};
  const event: InventoryEvent = {
    id: doc.id,
    productId: typeof data.productId === "string" ? data.productId : "",
    productName: typeof data.productName === "string" ? data.productName : "",
    type: ["restock", "correction", "price_update", "sale", "initial"].includes(
      data.type
    )
      ? data.type
      : "correction",
    quantityChange:
      typeof data.quantityChange === "number" ? data.quantityChange : 0,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt.toDate().toISOString()
        : new Date().toISOString(),
    userId: typeof data.userId === "string" ? data.userId : "",
    userName: typeof data.userName === "string" ? data.userName : "",
    notes: typeof data.notes === "string" ? data.notes : undefined,
    oldPrice: typeof data.oldPrice === "number" ? data.oldPrice : undefined,
    newPrice: typeof data.newPrice === "number" ? data.newPrice : undefined,
    siteId: data.siteId || "default",
  };
  if (!event.productId || !event.userId) {
    return null; // Core fields must exist.
  }
  return event;
};

export const getInventoryEvents = async (): Promise<InventoryEvent[]> => {
  const q = getInventoryEventsQuery();
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(docToInventoryEvent)
    .filter(Boolean) as InventoryEvent[];
};

const getProducts = async (): Promise<Product[]> => {
  const q = getProductsQuery();
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToProduct).filter(Boolean) as Product[];
};

/**
 * Returns products that have stock less than or equal to their restockThreshold.
 */
const getLowStockProducts = async (): Promise<Product[]> => {
  const products = await getProducts();
  return products.filter(
    (p) =>
      typeof p.restockThreshold === "number" && p.stock <= p.restockThreshold
  );
};
