"use client";

import { collection, onSnapshot, query } from "firebase/firestore";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { getFamiliesFeedAction } from "@/lib/actions/families";
import { db } from "@/lib/firebase";
import { useAppStore } from "@/store/use-app-store";

export interface Family {
  id: string;
  name?: string;
  memberIds: string[];
  siteId?: string;
}

export function useFamilies(initialFamilies?: Family[]) {
  const [families, setFamilies] = useState<Family[]>(initialFamilies ?? []);
  const [loading, setLoading] = useState(!initialFamilies);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      if (!initialFamilies) {
        getFamiliesFeedAction()
          .then((res) => {
            if (res.success && res.families.length > 0) {
              setFamilies(res.families as Family[]);
              setError(null);
            }
            setLoading(false);
          })
          .catch(() => {
            setLoading(false);
          });
      }
      return;
    }

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
  }, [activeBranch, user, initialFamilies]);

  return { families, loading, error };
}
