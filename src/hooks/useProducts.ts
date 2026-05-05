import { useState, useEffect, useCallback } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { Product } from "@/types";
import { docToProduct } from "@/services/inventory-service";
import { toast } from "sonner";
import { deleteProductAction } from "@/lib/actions/inventory";

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const db = getDb();
    const productsCollection = collection(db, "products");
    const q = query(productsCollection, orderBy("name"));

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
        console.error("Error fetching products:", err);
        setError(err);
        setIsLoading(false);
        toast.error("Грешка при зареждане на продуктите");
      }
    );

    return () => unsubscribe();
  }, []);

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
