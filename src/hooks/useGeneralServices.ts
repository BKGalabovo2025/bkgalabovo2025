"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getGeneralServiceHistoryAction,
  getGeneralServicesServerAction,
} from "@/lib/actions/general-services-server";
import { getServiceSalesAction } from "@/lib/actions/sales";
import { useAppStore } from "@/store/use-app-store";
import { GeneralService, GeneralServiceEvent, Sale } from "@/types";

export function useGeneralServices() {
  const [services, setServices] = useState<GeneralService[]>([]);
  const [events, setEvents] = useState<GeneralServiceEvent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [servicesRes, eventsRes, salesRes] = await Promise.all([
        getGeneralServicesServerAction(activeBranch),
        getGeneralServiceHistoryAction(activeBranch),
        getServiceSalesAction("general_service", activeBranch),
      ]);

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data);
      } else {
        throw new Error(servicesRes.error || "Failed to fetch services");
      }

      if (eventsRes.success && eventsRes.data) {
        setEvents(
          eventsRes.data.filter(
            (e): e is import("@/types").GeneralServiceEvent => e !== null
          )
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
      console.error("Error fetching general services data:", err);
      const message =
        err instanceof Error ? err.message : "Грешка при зареждане на данни";
      setError(message);
      toast.error("Грешка при зареждане на данни");
    } finally {
      setIsLoading(false);
    }
  }, [activeBranch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    services,
    events,
    sales,
    isLoading,
    error,
    refetch: fetchData,
  };
}
