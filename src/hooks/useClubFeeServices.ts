"use client";

import { useEffect, useState } from "react";

import { getClubFeeServicesAction } from "@/lib/actions/services";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  ClubFeeOption,
  DEFAULT_CLUB_FEES,
  filterTrainingServicesForDocuments,
} from "@/lib/services-fees";
import { ClubService } from "@/types";

/**
 * Hook that provides formatted training and membership fee options.
 * Fetches dynamic fees via server action first, and connects a real-time
 * listener only when a valid authenticated Firebase user is present.
 */
export function useClubFeeServices() {
  const [feeOptions, setFeeOptions] =
    useState<ClubFeeOption[]>(DEFAULT_CLUB_FEES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let unsubscribe: (() => void) | undefined;

    // 1. Always load the latest fee options via Server Action (zero permissions issues)
    getClubFeeServicesAction()
      .then((res) => {
        if (!isCancelled && res?.success && res.data && res.data.length > 0) {
          setFeeOptions(res.data);
        }
      })
      .catch(() => {
        // Fallback to default club fees silently
      });

    // 2. Only attach real-time Firestore listener if a Firebase Auth user is signed in
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) {
      return () => {
        isCancelled = true;
      };
    }

    const attachListener = async () => {
      try {
        const [{ onSnapshot }, { getClubServicesCollection }] =
          await Promise.all([
            import("firebase/firestore"),
            import("@/lib/firebase-collections"),
          ]);
        if (isCancelled) return;

        // Verify currentUser is still present
        if (!auth.currentUser) return;

        const colRef = getClubServicesCollection();
        unsubscribe = onSnapshot(
          colRef,
          (snapshot) => {
            if (!snapshot.empty) {
              const rawServices: ClubService[] = snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
              }));
              const filtered = filterTrainingServicesForDocuments(rawServices);
              setFeeOptions(filtered);
            }
            setLoading(false);
          },
          () => {
            // Silently fallback without logging console permission warnings
            setLoading(false);
          }
        );
      } catch {
        // Silently fallback without logging console errors
        setLoading(false);
      }
    };

    attachListener();

    return () => {
      isCancelled = true;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return {
    feeOptions,
    loading,
    /** Filtered subset: only monthly subscriptions */
    monthlySubscriptions: feeOptions.filter((f) => f.type === "Абонамент"),
    /** Filtered subset: one-time visits and personal sessions */
    oneTimeAndPersonal: feeOptions.filter(
      (f) => f.type === "Еднократно плащане"
    ),
  };
}
