"use client";

import { useState, useEffect, useCallback } from "react";
import { GeneralService, GeneralServiceEvent, Sale } from "@/types";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import {
  getGeneralServicesServerAction,
  getGeneralServiceHistoryAction,
  getGeneralServiceSalesAction,
} from "@/lib/actions/general-services-server";

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
        getGeneralServiceSalesAction(activeBranch),
      ]);

      if (servicesRes.success && servicesRes.data) {
        setServices(servicesRes.data);
      } else {
        throw new Error(servicesRes.error || "Failed to fetch services");
      }

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data.filter((e): e is import("@/types").GeneralServiceEvent => e !== null));
      } else {
        throw new Error(eventsRes.error || "Failed to fetch events");
      }

      if (salesRes.success && salesRes.data) {
        setSales(salesRes.data);
      } else {
        throw new Error(salesRes.error || "Failed to fetch sales");
      }
    } catch (err: any) {
      console.error("Error fetching general services data:", err);
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
    services,
    events,
    sales,
    isLoading,
    error,
    refetch: fetchData,
  };
}
