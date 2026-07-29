import { describe, it, expect, beforeEach } from "vitest";
import "./setup";
import { clearFirestore, db } from "./setup";
import { doc, setDoc } from "firebase/firestore";
import { docToProduct } from "@/services/inventory-service";
import { getProductsQuery } from "@/lib/firebase-collections";
import { getDocs } from "firebase/firestore";

describe("Inventory Integration Tests (Emulator)", () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  it("should create a product and read it using the Zod mapper equivalent", async () => {
    const siteId = "bkgalabovo";
    const productData = {
      name: "Water",
      price: 2.5,
      stock: 100,
      category: "Drinks",
      siteId,
    };

    // 1. Insert directly to DB
    const ref = doc(db, "products", "prod1");
    await setDoc(ref, productData);

    // 2. Read it
    const q = getProductsQuery();
    const snapshot = await getDocs(q);
    expect(snapshot.empty).toBe(false);

    // 3. Map using docToProduct
    const product = docToProduct(snapshot.docs[0]);

    expect(product).not.toBeNull();
    expect(product?.id).toBe("prod1");
    expect(product?.name).toBe("Water");
    expect(product?.price).toBe(2.5);
  });

  it("docToProduct should return null for product missing a name", async () => {
    const invalidData = {
      description: "Missing Name Product",
      price: 15,
      siteId: "bkgalabovo", // Required by Firestore Rules
    };

    // Force insert
    const ref = doc(db, "products", "invalid-prod");
    await setDoc(ref, invalidData);

    // 2. Read it
    const q = getProductsQuery();
    const snapshot = await getDocs(q);

    // 3. Map using docToProduct
    const product = docToProduct(snapshot.docs[0]);

    expect(product).toBeNull();
  });
});
