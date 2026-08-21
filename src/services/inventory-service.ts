import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { InventoryItem } from "@/types/inventory.types";

const INVENTORY_COLLECTION = "inventory";

export const inventoryService = {
  async getInventory(siteId: string): Promise<InventoryItem[]> {
    const q = query(
      collection(db, INVENTORY_COLLECTION),
      where("siteId", "==", siteId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as InventoryItem
    );
  },

  async addInventoryItem(
    siteId: string,
    data: Omit<InventoryItem, "id" | "siteId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const newDocRef = doc(collection(db, INVENTORY_COLLECTION));
    const item: Omit<InventoryItem, "id"> = {
      ...data,
      siteId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(newDocRef, item);
    return newDocRef.id;
  },

  async updateInventoryItem(
    id: string,
    data: Partial<InventoryItem>
  ): Promise<void> {
    const docRef = doc(db, INVENTORY_COLLECTION, id);
    await updateDoc(docRef, { ...data, updatedAt: new Date().toISOString() });
  },

  async deleteInventoryItem(id: string): Promise<void> {
    await deleteDoc(doc(db, INVENTORY_COLLECTION, id));
  },

  // Seed default inventory if empty
  async seedDefaultInventory(siteId: string): Promise<void> {
    const existing = await this.getInventory(siteId);
    if (existing.length > 0) return;

    const defaults: Omit<
      InventoryItem,
      "id" | "siteId" | "createdAt" | "updatedAt"
    >[] = [
      { name: "Ракети", totalQuantity: 30, allocationType: "per_child" },
      {
        name: "Пера",
        totalQuantity: 100,
        allocationType: "per_child",
        ratioValue: 2,
      }, // 2 пера на дете
      { name: "Балони", totalQuantity: 50, allocationType: "per_child" },
      {
        name: "Конуси",
        totalQuantity: 40,
        allocationType: "per_station",
        ratioValue: 4,
      }, // 4 конуса за очертаване на станция
      { name: "Въжета", totalQuantity: 20, allocationType: "per_child" },
      { name: "Въже", totalQuantity: 20, allocationType: "per_child" },
      { name: "Ластици", totalQuantity: 10, allocationType: "per_child" },
      {
        name: "Стълбичка",
        totalQuantity: 2,
        allocationType: "per_station",
        ratioValue: 1,
      },
      {
        name: "Медицинска топка",
        totalQuantity: 5,
        allocationType: "ratio",
        ratioValue: 0.5,
      }, // 1 топка на 2 деца
      {
        name: "Преносими мрежи",
        totalQuantity: 2,
        allocationType: "per_station",
        ratioValue: 1,
      },
      { name: "Постелки", totalQuantity: 15, allocationType: "per_child" },
    ];

    const batch = writeBatch(db);
    defaults.forEach((item) => {
      const docRef = doc(collection(db, INVENTORY_COLLECTION));
      batch.set(docRef, {
        ...item,
        siteId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    await batch.commit();
  },
};
