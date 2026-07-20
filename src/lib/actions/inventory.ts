"use server";
import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { getAuthUser } from "@/lib/auth-utils";
import { FieldValue } from "firebase-admin/firestore";
import { serverCache } from "@/lib/server-cache";
import { serializeFirestoreData } from "@/lib/serialize-utils";

// --- Cache key ---
const PRODUCTS_CACHE_KEY = "products:all";
const PRODUCTS_CACHE_TTL = 60_000; // 1 minute

// --- Zod Schemas ---
const ProductSchema = z.object({
  name: z.string().min(2, "Името на продукта е задължително."),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Цената не може да бъде отрицателна."),
  stock: z.coerce.number().min(0, "Наличността не може да бъде отрицателна."),
  category: z.string().min(1, "Категорията е задължителна."),
  imageUrl: z.string().optional(),
  restockThreshold: z.coerce.number().nullable().optional(),
});

// --- Type for Server Action State ---
export type InventoryActionState = {
  errors?: { [key: string]: string[] | undefined };
  message?: string | null;
  success?: boolean;
};

/**
 * Returns all products, served from a 1-minute server-side cache.
 * Falls back to a direct Firestore read on cache miss.
 */
export async function getProductsServerAction() {
  return serverCache.get(
    PRODUCTS_CACHE_KEY,
    async () => {
      const adminDb = getAdminDb();
      const snapshot = await adminDb.collection("products").get();
      const products = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return serializeFirestoreData(products) as Record<string, unknown>[];
    },
    PRODUCTS_CACHE_TTL
  );
}

// --- Public Server Actions ---

/**
 * Creates a new product.
 */
export async function createProductAction(
  idToken: string,
  productData: Record<string, unknown>
): Promise<InventoryActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const validatedFields = ProductSchema.safeParse(productData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Валидацията не бе успешна.",
      };
    }

    const docRef = await adminDb.collection("products").add({
      ...validatedFields.data,
      currency: "EUR",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      createdBy: { uid: user.uid, email: user.email },
    });

    // Initial inventory event
    await adminDb.collection("inventoryEvents").add({
      productId: docRef.id,
      productName: validatedFields.data.name,
      type: "initial",
      quantityChange: validatedFields.data.stock,
      createdAt: FieldValue.serverTimestamp(),
      userId: user.uid,
      userName: user.displayName || user.email,
      notes: "Първоначално въвеждане",
    });

    revalidatePath("/inventory");
    serverCache.invalidate(PRODUCTS_CACHE_KEY);
    return {
      success: true,
      message: `Продуктът '${validatedFields.data.name}' бе създаден успешно.`,
    };
  } catch (error: unknown) {
    console.error("createProductAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестна грешка при създаване на продукт.",
    };
  }
}

/**
 * Updates product price and logs the event.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function updateProductPriceAction(
  id: string,
  idToken: string,
  newPrice: number
): Promise<InventoryActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const productRef = adminDb.collection("products").doc(id);

    await adminDb.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw new Error("Продуктът не бе намерен.");

      const oldPrice = productSnap.data()?.price || 0;
      const productName = productSnap.data()?.name;

      transaction.update(productRef, {
        price: newPrice,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = adminDb.collection("inventoryEvents").doc();
      transaction.set(eventRef, {
        productId: id,
        productName: productName,
        type: "price_update",
        quantityChange: 0,
        oldPrice,
        newPrice,
        createdAt: FieldValue.serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || user.email,
      });
    });

    revalidatePath("/inventory");
    serverCache.invalidate(PRODUCTS_CACHE_KEY);
    return { success: true, message: "Цената бе актуализирана успешно." };
  } catch (error: unknown) {
    console.error("updateProductPriceAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестна грешка при актуализиране на цена.",
    };
  }
}

/**
 * Restocks a product and logs the event.
 */
export async function restockProductAction(
  id: string,
  idToken: string,
  quantity: number,
  notes?: string
): Promise<InventoryActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const productRef = adminDb.collection("products").doc(id);

    await adminDb.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw new Error("Продуктът не бе намерен.");

      const currentStock = productSnap.data()?.stock || 0;
      const productName = productSnap.data()?.name;

      transaction.update(productRef, {
        stock: currentStock + quantity,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = adminDb.collection("inventoryEvents").doc();
      transaction.set(eventRef, {
        productId: id,
        productName: productName,
        type: "restock",
        quantityChange: quantity,
        createdAt: FieldValue.serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || user.email,
        notes: notes || "",
      });
    });

    revalidatePath("/inventory");
    serverCache.invalidate(PRODUCTS_CACHE_KEY);
    return { success: true, message: "Наличността бе обновена успешно." };
  } catch (error: unknown) {
    console.error("restockProductAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестна грешка при зареждане на наличност.",
    };
  }
}

/**
 * Adjusts product stock (manual correction).
 */
export async function adjustProductStockAction(
  id: string,
  idToken: string,
  newStock: number,
  notes?: string
): Promise<InventoryActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const productRef = adminDb.collection("products").doc(id);

    await adminDb.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw new Error("Продуктът не бе намерен.");

      const oldStock = productSnap.data()?.stock || 0;
      const productName = productSnap.data()?.name;

      transaction.update(productRef, {
        stock: newStock,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const eventRef = adminDb.collection("inventoryEvents").doc();
      transaction.set(eventRef, {
        productId: id,
        productName: productName,
        type: "correction",
        quantityChange: newStock - oldStock,
        createdAt: FieldValue.serverTimestamp(),
        userId: user.uid,
        userName: user.displayName || user.email,
        notes: notes || "",
      });
    });

    revalidatePath("/inventory");
    serverCache.invalidate(PRODUCTS_CACHE_KEY);
    return { success: true, message: "Наличността бе коригирана успешно." };
  } catch (error: unknown) {
    console.error("adjustProductStockAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестна грешка при корекция на наличност.",
    };
  }
}

/**
 * Deletes a product.
 */
export async function deleteProductAction(
  id: string,
  idToken: string
): Promise<InventoryActionState> {
  try {
    await getAuthUser(idToken);
    const adminDb = getAdminDb();

    await adminDb.collection("products").doc(id).delete();

    revalidatePath("/inventory");
    serverCache.invalidate(PRODUCTS_CACHE_KEY);
    return { success: true, message: "Продуктът бе изтрит успешно." };
  } catch (error: unknown) {
    console.error("deleteProductAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестна грешка при изтриване на продукт.",
    };
  }
}

/**
 * Updates a product's details (name, category, description, imageUrl, price, restockThreshold).
 */
export async function updateProductAction(
  productId: string,
  idToken: string,
  productData: Record<string, unknown>
): Promise<InventoryActionState> {
  try {
    const user = await getAuthUser(idToken);
    const adminDb = getAdminDb();

    const UpdateProductSchema = z.object({
      name: z.string().min(2, "Името на продукта е задължително."),
      description: z.string().optional(),
      price: z.coerce.number().min(0, "Цената не може да бъде неотрицателна."),
      category: z.string().min(1, "Категорията е задължителна."),
      imageUrl: z.string().optional(),
      restockThreshold: z.coerce.number().nullable().optional(),
    });

    const validatedFields = UpdateProductSchema.safeParse(productData);
    if (!validatedFields.success) {
      return {
        success: false,
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Валидацията не бе успешна.",
      };
    }

    const productRef = adminDb.collection("products").doc(productId);

    await adminDb.runTransaction(async (transaction) => {
      const productSnap = await transaction.get(productRef);
      if (!productSnap.exists) throw new Error("Продуктът не бе намерен.");

      const oldData = productSnap.data() || {};
      const oldPrice = oldData.price || 0;
      const newPrice = validatedFields.data.price;

      transaction.update(productRef, {
        name: validatedFields.data.name,
        description: validatedFields.data.description || "",
        category: validatedFields.data.category,
        price: newPrice,
        imageUrl: validatedFields.data.imageUrl || "",
        restockThreshold: validatedFields.data.restockThreshold || null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Log a price update event if price changed
      if (oldPrice !== newPrice) {
        const eventRef = adminDb.collection("inventoryEvents").doc();
        transaction.set(eventRef, {
          productId: productId,
          productName: validatedFields.data.name,
          type: "price_update",
          quantityChange: 0,
          oldPrice,
          newPrice,
          createdAt: FieldValue.serverTimestamp(),
          userId: user.uid,
          userName: user.displayName || user.email,
        });
      }
    });

    revalidatePath("/inventory");
    serverCache.invalidate(PRODUCTS_CACHE_KEY);
    return {
      success: true,
      message: `Продуктът бе актуализиран успешно.`,
    };
  } catch (error: unknown) {
    console.error("updateProductAction Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Неизвестна грешка при актуализиране на продукт.",
    };
  }
}
