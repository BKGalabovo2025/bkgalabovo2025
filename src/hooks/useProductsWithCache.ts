import { onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  deleteProductAction,
  getProductsServerAction,
} from "@/lib/actions/inventory";
import { getProductsQuery } from "@/lib/firebase-collections";
import { docToProduct } from "@/services/inventory-service";
import { useAppStore } from "@/store/use-app-store";
import { Product } from "@/types";

/**
 * Products hook with server-side caching (1-min TTL).
 *
 * Strategy:
 * 1. On mount: calls `getProductsServerAction()` which serves from a 1-min
 *    server cache → instant initial render, no Firestore spinner.
 * 2. After initial data is shown: starts a Firestore `onSnapshot` listener
 *    for real-time updates (stock changes, price edits, new products).
 *
 * This is effectively a "cache-first, then live" pattern.
 */
export const useProductsWithCache = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { activeBranch } = useAppStore();

  // Phase 1: Seed initial data from server cache (fast)
  useEffect(() => {
    let cancelled = false;

    getProductsServerAction()
      .then((rawProducts) => {
        if (cancelled) return;
        // Map raw Firestore data to Product type (same shape as docToProduct)
        const mapped = rawProducts.map((p) => p as unknown as Product);
        setProducts(mapped);
        setIsLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error loading products from cache:", err);
        // Don't set error yet — onSnapshot below might still succeed
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeBranch]);

  // Phase 2: Real-time listener for live updates
  useEffect(() => {
    const q = getProductsQuery();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const productsData = snapshot.docs
          .map(docToProduct)
          .filter(Boolean) as Product[];
        setProducts(productsData);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error in products real-time listener:", err);
        setError(err);
        toast.error("Грешка при синхронизация на продуктите");
      }
    );

    return () => unsubscribe();
  }, [activeBranch]);

  const deleteProduct = useCallback(
    async (productId: string, idToken: string) => {
      try {
        const result = await deleteProductAction(productId, idToken);
        if (result.success) {
          toast.success("Продуктът е изтрит");
        } else {
          toast.error(result.message || "Грешка при изтриване");
        }
      } catch (err) {
        console.error("Error deleting product:", err);
        toast.error("Грешка при изтриване");
        throw err;
      }
    },
    []
  );

  return {
    products,
    isLoading,
    error,
    deleteProduct,
  };
};
