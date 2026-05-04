import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  DocumentSnapshot,
  Timestamp,
  runTransaction,
  addDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Product, InventoryEvent } from "@/types";

const PRODUCTS_COLLECTION = "products";
const EVENTS_COLLECTION = "inventoryEvents";

const docToProduct = (doc: DocumentSnapshot): Product | null => {
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

const docToInventoryEvent = (doc: DocumentSnapshot): InventoryEvent | null => {
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
  };
  if (!event.productId || !event.userId) {
    return null; // Core fields must exist.
  }
  return event;
};

export const getInventoryEvents = async (): Promise<InventoryEvent[]> => {
  const db = getDb();
  const eventsCollection = collection(db, EVENTS_COLLECTION);
  const q = query(eventsCollection, orderBy("createdAt", "desc"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(docToInventoryEvent)
    .filter(Boolean) as InventoryEvent[];
};

export const getProducts = async (): Promise<Product[]> => {
  const db = getDb();
  const productsCollection = collection(db, PRODUCTS_COLLECTION);
  const q = query(productsCollection, orderBy("name"));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(docToProduct).filter(Boolean) as Product[];
};

export const addProduct = async (
  product: Omit<Product, "id">,
  userId: string,
  userName: string
): Promise<string> => {
  const db = getDb();
  const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
    ...product,
    createdAt: Timestamp.now(),
  });

  await addDoc(collection(db, EVENTS_COLLECTION), {
    productId: docRef.id,
    productName: product.name,
    type: "initial",
    quantityChange: product.stock,
    createdAt: Timestamp.now(),
    userId,
    userName,
    notes: "Първоначално въвеждане",
  });

  return docRef.id;
};

export const updateProduct = async (
  id: string,
  product: Partial<Product>,
  userId: string,
  userName: string
): Promise<void> => {
  const db = getDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await updateDoc(productRef, product);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const db = getDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  await deleteDoc(productRef);
};

export const updateProductPrice = async (
  id: string,
  newPrice: number,
  userId: string,
  userName: string
): Promise<void> => {
  const db = getDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) throw new Error("Product not found");
  const oldPrice = productSnap.data().price || 0;

  await runTransaction(db, async (transaction) => {
    transaction.update(productRef, { price: newPrice });

    const eventRef = doc(collection(db, EVENTS_COLLECTION));
    const eventData = {
      productId: id,
      productName: productSnap.data().name,
      type: "price_update",
      quantityChange: 0,
      oldPrice,
      newPrice,
      createdAt: Timestamp.now(),
      userId,
      userName,
    };
    transaction.set(eventRef, eventData);
  });
};

export const restockProduct = async (
  id: string,
  quantity: number,
  userId: string,
  userName: string,
  notes?: string
): Promise<void> => {
  const db = getDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) throw new Error("Product not found");

  await runTransaction(db, async (transaction) => {
    const currentStock = productSnap.data().stock || 0;
    transaction.update(productRef, { stock: currentStock + quantity });

    const eventRef = doc(collection(db, EVENTS_COLLECTION));
    const eventData = {
      productId: id,
      productName: productSnap.data().name,
      type: "restock",
      quantityChange: quantity,
      createdAt: Timestamp.now(),
      userId,
      userName,
      notes,
    };
    transaction.set(eventRef, eventData);
  });
};

export const adjustProductStock = async (
  id: string,
  newStock: number,
  userId: string,
  userName: string,
  notes?: string
): Promise<void> => {
  const db = getDb();
  const productRef = doc(db, PRODUCTS_COLLECTION, id);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) throw new Error("Product not found");

  await runTransaction(db, async (transaction) => {
    const oldStock = productSnap.data().stock || 0;
    transaction.update(productRef, { stock: newStock });

    const eventRef = doc(collection(db, EVENTS_COLLECTION));
    const eventData = {
      productId: id,
      productName: productSnap.data().name,
      type: "correction",
      quantityChange: newStock - oldStock,
      createdAt: Timestamp.now(),
      userId,
      userName,
      notes,
    };
    transaction.set(eventRef, eventData);
  });
};
