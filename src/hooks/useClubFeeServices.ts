"use client";

import { useEffect, useState } from "react";

import {
  ClubFeeOption,
  DEFAULT_CLUB_FEES,
  filterTrainingServicesForDocuments,
} from "@/lib/services-fees";
import { ClubService } from "@/types";

/**
 * Real-time hook that listens to the `clubServices` collection ("Каталози - Услуги").
 * Automatically calculates dynamic options for:
 * 1. "Месечни абонаменти за деца"
 * 2. "Еднократни посещения и персонални тренировки"
 *
 * If prices or names are modified in the Catalog, all document components
 * update immediately in real time.
 */
export function useClubFeeServices() {
  const [feeOptions, setFeeOptions] =
    useState<ClubFeeOption[]>(DEFAULT_CLUB_FEES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasAuth =
      typeof window !== "undefined" &&
      (window.localStorage.getItem("firebase:hasAuth") === "1" ||
        document.cookie.includes("session="));

    if (!hasAuth) {
      return;
    }

    let unsubscribe: (() => void) | undefined;
    let isCancelled = false;

    const attachListener = async () => {
      try {
        const [{ onSnapshot }, { getClubServicesCollection }] =
          await Promise.all([
            import("firebase/firestore"),
            import("@/lib/firebase-collections"),
          ]);
        if (isCancelled) return;
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
            } else {
              setFeeOptions(DEFAULT_CLUB_FEES);
            }
            setLoading(false);
          },
          (error) => {
            console.warn(
              "Could not listen to clubServices in real-time, using defaults:",
              error
            );
            setFeeOptions(DEFAULT_CLUB_FEES);
            setLoading(false);
          }
        );
      } catch (err) {
        console.warn("Failed to attach clubServices listener:", err);
        setFeeOptions(DEFAULT_CLUB_FEES);
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
