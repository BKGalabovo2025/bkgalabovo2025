"use client";

import { getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

import { getInventoryEventsQuery } from "@/lib/firebase-collections";
import { useAppStore } from "@/store/use-app-store";
import { InventoryEvent } from "@/types";

export function useInventoryEvents() {
  const [events, setEvents] = useState<InventoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = getInventoryEventsQuery();
        // Note: We might need a composite index for siteId + createdAt
        const querySnapshot = await getDocs(q);
        const eventsData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as InventoryEvent[];

        // Sort manually if index is missing for now
        eventsData.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setEvents(eventsData);
      } catch (err) {
        console.error("Error fetching inventory events:", err);
        setError("Failed to fetch inventory events.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [activeBranch]);

  return { events, loading, error };
}
