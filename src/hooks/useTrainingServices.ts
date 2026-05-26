"use client";

import { useState, useEffect, useCallback } from "react";
import { Sale } from "@/types";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import {
  getTrainingServiceHistoryAction,
  getTrainingServiceSalesAction,
} from "@/lib/actions/training-services-server";

export function useTrainingServices() {
  const [events, setEvents] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventsRes, salesRes] = await Promise.all([
        getTrainingServiceHistoryAction(activeBranch),
        getTrainingServiceSalesAction(activeBranch),
      ]);

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data.filter((e: any) => e !== null));
      } else {
        throw new Error(eventsRes.error || "Failed to fetch events");
      }

      if (salesRes.success && salesRes.data) {
        setSales(salesRes.data);
      } else {
        throw new Error(salesRes.error || "Failed to fetch sales");
      }
    } catch (err: any) {
      console.error("Error fetching training services data:", err);
      setError(err.message || "Грешка при зареждане на данни");
      toast.error("Грешка при зареждане на данни");
    } finally {
      setIsLoading(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    events,
    sales,
    isLoading,
    error,
    refetch: fetchData,
  };
}
