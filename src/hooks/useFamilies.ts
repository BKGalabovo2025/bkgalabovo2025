"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/use-app-store";

export interface Family {
  id: string;
  name?: string;
  memberIds: string[];
  siteId?: string;
}

export function useFamilies() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const familiesRef = collection(db, "families");
        // Families might not have siteId yet, but we should eventually add it
        const q = query(familiesRef);
        const querySnapshot = await getDocs(q);
        const familiesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Family[];

        setFamilies(familiesData);
      } catch (err) {
        console.error("Error fetching families:", err);
        setError("Failed to fetch families.");
      } finally {
        setLoading(false);
      }
    };

    fetchFamilies();
  }, [activeBranch]);

  return { families, loading, error };
}
