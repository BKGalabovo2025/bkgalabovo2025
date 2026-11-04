import { Metadata } from "next";

import { ShopCatalogView } from "@/components/catalogs/views/ShopCatalogView";
import { getAdminDb } from "@/lib/firebase-admin";
import { serializeFirestoreData } from "@/lib/serialize-utils";
import { serverCache } from "@/lib/server-cache";
import { sanitizeImageUrl } from "@/lib/utils";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Клубен магазин & Стоки | Каталози - БК Гълъбово",
  description:
    "Наличности, цени и детайли за ракети, пера, грипове, спортно облекло и аксесоари.",
};

async function getShopProducts(): Promise<Product[]> {
  try {
    const adminDb = getAdminDb();
    return await serverCache.get(
      "catalog:products",
      async () => {
        const snapshot = await adminDb.collection("products").get();
        return snapshot.docs.map((doc) => {
          const data = doc.data();
          const serialized = serializeFirestoreData({
            id: doc.id,
            ...data,
          }) as Record<string, unknown>;

          return {
            id: doc.id,
            name: String(serialized.name || ""),
            category: String(serialized.category || "Общи"),
            price: Number(serialized.price) || 0,
            currency: "EUR" as const,
            stock: Number(serialized.stock) || 0,
            description: serialized.description
              ? String(serialized.description)
              : "",
            imageUrl: sanitizeImageUrl(
              serialized.imageUrl ? String(serialized.imageUrl) : null
            ),
            restockThreshold:
              serialized.restockThreshold !== undefined &&
              serialized.restockThreshold !== null
                ? Number(serialized.restockThreshold)
                : null,
            siteId: String(serialized.siteId || "bkgalabovo"),
          } as Product;
        });
      },
      300000
    );
  } catch (error) {
    console.error("Грешка при зареждане на магазин:", error);
    return [];
  }
}

export default async function ShopCatalogPage() {
  const products = await getShopProducts();
  return <ShopCatalogView initialProducts={products} />;
}
