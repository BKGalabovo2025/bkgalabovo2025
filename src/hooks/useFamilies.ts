"use client";

import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { getFamiliesFeedAction } from "@/lib/actions/families";
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
    const familiesRef = collection(db, "families");
    const q = query(familiesRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const familiesData = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Family[];
        setFamilies(familiesData);
        setLoading(false);
      },
      (err) => {
        console.warn(
          "Client onSnapshot for families failed, falling back to server feed:",
          err
        );
        getFamiliesFeedAction()
          .then((res) => {
            if (res.success && res.families.length > 0) {
              setFamilies(res.families as Family[]);
              setError(null);
            } else {
              setError("Failed to fetch families.");
            }
            setLoading(false);
          })
          .catch(() => {
            setError("Failed to fetch families.");
            setLoading(false);
          });
      }
    );

    return () => unsubscribe();
  }, [activeBranch]);

  return { families, loading, error };
}
