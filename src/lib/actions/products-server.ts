"use server";
import "server-only";

import * as admin from "firebase-admin";

import { logAuditEvent } from "@/lib/audit-logger";
import {
  ensureAdminFromSession,
  getAuthUserFromSessionCookie,
} from "@/lib/auth-utils";
import { getAdminDb } from "@/lib/firebase-admin";
import { serverCache } from "@/lib/server-cache";
import { Product } from "@/types";

function snapToData<T>(
  doc: admin.firestore.DocumentSnapshot | admin.firestore.QueryDocumentSnapshot
): T | null {
  if (!doc.exists) return null;
  const data = doc.data();
  if (!data) return null;

  const convertTimestamps = (val: unknown): unknown => {
    if (!val) return val;
    if (typeof (val as { toDate?: unknown }).toDate === "function") {
      return (val as admin.firestore.Timestamp).toDate().toISOString();
    }
    if (val instanceof admin.firestore.Timestamp) {
      return val.toDate().toISOString();
    }
    if (Array.isArray(val)) {
      return val.map(convertTimestamps);
    }
    if (typeof val === "object") {
      const copy: Record<string, unknown> = {};
      for (const key of Object.keys(val)) {
        copy[key] = convertTimestamps((val as Record<string, unknown>)[key]);
      }
      return copy;
    }
    return val;
  };

  return {
    id: doc.id,
    ...(convertTimestamps(data) as Record<string, unknown>),
  } as T;
}

export async function getProductsServerAction(activeBranch?: string): Promise<{
  success: boolean;
  data?: Product[];
  error?: string;
}> {
  try {
    const user = await getAuthUserFromSessionCookie();
    if (!user) {
      throw new Error("Неоторизиран достъп.");
    }

    const adminDb = getAdminDb();
    const snap = await adminDb.collection("products").get();

    let items = snap.docs
      .map((doc) => snapToData<Product>(doc))
      .filter((p): p is Product => Boolean(p));

    if (activeBranch && activeBranch !== "all") {
      items = items.filter(
        (p) =>
          !p.siteId || p.siteId === activeBranch || p.siteId === "bkgalabovo"
      );
    }

    items.sort((a, b) => a.name.localeCompare(b.name, "bg"));
    return { success: true, data: items };
  } catch (error: unknown) {
    console.error("Error getProductsServerAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при извличане на продуктите.",
    };
  }
}

export async function createProductAction(data: {
  name: string;
  category: string;
  price: number;
  stock: number;
  description?: string;
  imageUrl?: string | null;
  restockThreshold?: number | null;
  siteId?: string;
}) {
  try {
    const user = await ensureAdminFromSession();
    const adminDb = getAdminDb();
    const now = new Date().toISOString();

    const siteId = data.siteId || "bkgalabovo";
    const docRef = adminDb.collection("products").doc();

    const newProduct = {
      name: data.name.trim(),
      category: data.category.trim(),
      price: Number(data.price) || 0,
      currency: "EUR" as const,
      stock: Number(data.stock) || 0,
      description: data.description?.trim() || "",
      imageUrl: data.imageUrl || null,
      restockThreshold:
        data.restockThreshold !== undefined && data.restockThreshold !== null
          ? Number(data.restockThreshold)
          : null,
      siteId,
      createdAt: now,
      updatedAt: now,
      createdBy: {
        uid: user.uid,
        email: user.email || "Unknown",
      },
    };

    await docRef.set(newProduct);

    await adminDb.collection("inventoryEvents").add({
      productId: docRef.id,
      productName: newProduct.name,
      type: "initial",
      quantityChange: newProduct.stock,
      notes: "Първоначално създаване в каталога",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: user.uid,
      userName: user.email || "Unknown",
      siteId,
    });

    serverCache.invalidate("catalog:products");
    serverCache.invalidate("products");

    await logAuditEvent({
      action: "create_product",
      targetCollection: "products",
      targetId: docRef.id,
      siteId,
      details: `Добавен продукт "${newProduct.name}" (цена: ${newProduct.price} EUR, наличност: ${newProduct.stock})`,
      userId: user.uid,
      userEmail: user.email || undefined,
    });

    return { success: true, id: docRef.id };
  } catch (error: unknown) {
    console.error("Error createProductAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при създаване на продукт.",
    };
  }
}

function buildProductUpdatePayload(
  data: Partial<{
    name: string;
    category: string;
    price: number;
    stock: number;
    description?: string;
    imageUrl?: string | null;
    restockThreshold?: number | null;
  }>
) {
  const payload: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.category !== undefined) payload.category = data.category.trim();
  if (data.price !== undefined) payload.price = Number(data.price);
  if (data.stock !== undefined) payload.stock = Number(data.stock);
  if (data.description !== undefined)
    payload.description = data.description.trim();
  if (data.imageUrl !== undefined) payload.imageUrl = data.imageUrl;
  if (data.restockThreshold !== undefined) {
    payload.restockThreshold =
      data.restockThreshold !== null ? Number(data.restockThreshold) : null;
  }
  return payload;
}

async function recordProductEvents(
  adminDb: admin.firestore.Firestore,
  id: string,
  data: { name?: string; price?: number; stock?: number },
  oldData: Product,
  user: { uid: string; email?: string | null }
) {
  const siteId = oldData.siteId || "bkgalabovo";
  const productName = data.name || oldData.name;

  if (data.price !== undefined && data.price !== oldData.price) {
    await adminDb.collection("inventoryEvents").add({
      productId: id,
      productName,
      type: "price_update",
      oldPrice: oldData.price,
      newPrice: Number(data.price),
      quantityChange: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: user.uid,
      userName: user.email || "Unknown",
      siteId,
    });
  }

  if (data.stock !== undefined && data.stock !== oldData.stock) {
    const diff = Number(data.stock) - (oldData.stock || 0);
    await adminDb.collection("inventoryEvents").add({
      productId: id,
      productName,
      type: diff > 0 ? "restock" : "adjustment",
      quantityChange: diff,
      notes: "Ръчна корекция на наличност от каталога",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: user.uid,
      userName: user.email || "Unknown",
      siteId,
    });
  }
}

export async function updateProductAction(
  id: string,
  data: Partial<{
    name: string;
    category: string;
    price: number;
    stock: number;
    description?: string;
    imageUrl?: string | null;
    restockThreshold?: number | null;
  }>
) {
  try {
    const user = await ensureAdminFromSession();
    const adminDb = getAdminDb();

    const docRef = adminDb.collection("products").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Продуктът не е намерен.");

    const oldData = snap.data() as Product;
    const updatePayload = buildProductUpdatePayload(data);

    await docRef.update(updatePayload);
    await recordProductEvents(adminDb, id, data, oldData, user);

    serverCache.invalidate("catalog:products");
    serverCache.invalidate("products");

    await logAuditEvent({
      action: "update_product",
      targetCollection: "products",
      targetId: id,
      siteId: oldData.siteId || "bkgalabovo",
      details: `Редактиран продукт "${data.name || oldData.name}"`,
      userId: user.uid,
      userEmail: user.email || undefined,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updateProductAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при обновяване на продукта.",
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    const user = await ensureAdminFromSession();
    const adminDb = getAdminDb();

    const docRef = adminDb.collection("products").doc(id);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Продуктът не е намерен.");

    const oldData = snap.data() as Product;
    await docRef.delete();

    await adminDb.collection("inventoryEvents").add({
      productId: id,
      productName: oldData.name,
      type: "delete",
      quantityChange: -(oldData.stock || 0),
      notes: "Продуктът е премахнат от каталога",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      userId: user.uid,
      userName: user.email || "Unknown",
      siteId: oldData.siteId || "bkgalabovo",
    });

    serverCache.invalidate("catalog:products");
    serverCache.invalidate("products");

    await logAuditEvent({
      action: "delete_product",
      targetCollection: "products",
      targetId: id,
      siteId: oldData.siteId || "bkgalabovo",
      details: `Изтрит продукт "${oldData.name}" от магазина`,
      userId: user.uid,
      userEmail: user.email || undefined,
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleteProductAction:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Грешка при изтриване на продукта.",
    };
  }
}
