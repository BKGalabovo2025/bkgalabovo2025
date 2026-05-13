"use client";

import { useState, useEffect } from "react";
import { getDocs, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClientPackage } from "@/types";
import { getClientPackagesQuery } from "@/lib/firebase-collections";
import { useAppStore } from "@/store/use-app-store";

export function usePackages(memberId?: string) {
  const [packages, setPackages] = useState<ClientPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const q = getClientPackagesQuery(memberId);
        const querySnapshot = await getDocs(q);
        const packagesData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as ClientPackage[];
        setPackages(packagesData);
      } catch (err) {
        console.error("Error fetching packages:", err);
        setError("Failed to fetch packages.");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, [activeBranch, memberId]);

  const deductSession = async (packageId: string) => {
    try {
      const packageRef = doc(db, "client_packages", packageId);

      // Update in Firestore
      await updateDoc(packageRef, {
        sessionsRemaining: increment(-1),
      });

      // Update local state
      setPackages((prev) =>
        prev.map((pkg) =>
          pkg.id === packageId
            ? { ...pkg, sessionsRemaining: pkg.sessionsRemaining - 1 }
            : pkg
        )
      );

      return true;
    } catch (err) {
      console.error("Error deducting session:", err);
      return false;
    }
  };

  return { packages, loading, error, deductSession };
}
