"use client";

import { useState, useEffect, useCallback } from "react";
import { Sale } from "@/types";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { getTrainingServiceHistoryAction } from "@/lib/actions/training-services-server";
import { getServiceSalesAction } from "@/lib/actions/sales";

export interface TrainingEvent {
  id: string;
  createdAt: string | Date;
  timestamp: string | Date;
  serviceName: string;
  type: string;
  userName: string;
  oldPrice?: number;
  newPrice?: number;
  clientName?: string;
  action?: string;
  changes?: string;
}

export function useTrainingServices() {
  const [events, setEvents] = useState<TrainingEvent[]>([]);
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
        getServiceSalesAction("training_service", activeBranch),
      ]);

      if (eventsRes.success && eventsRes.data) {
        setEvents(
          eventsRes.data.filter((e: unknown) => e !== null) as TrainingEvent[]
        );
      } else {
        throw new Error(eventsRes.error || "Failed to fetch events");
      }

      if (salesRes.success && salesRes.data) {
        setSales(salesRes.data);
      } else {
        throw new Error(salesRes.error || "Failed to fetch sales");
      }
    } catch (err: unknown) {
      console.error("Error fetching training services data:", err);
      const message =
        err instanceof Error ? err.message : "Грешка при зареждане на данни";
      setError(message);
      toast.error(message);
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
