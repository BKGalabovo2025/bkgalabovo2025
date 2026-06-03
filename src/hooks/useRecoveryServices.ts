"use client";

import { useState, useEffect, useCallback } from "react";
import { Sale } from "@/types";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import {
  getRecoveryServiceHistoryAction,
  getRecoveryServiceSalesAction,
  getRecoveryReservationsAction,
  getRecoveryClientPackagesAction,
  getRecoveryClientsAction,
} from "@/lib/actions/recovery-services-server";

export function useRecoveryServices() {
  const [events, setEvents] = useState<any[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [clientPackages, setClientPackages] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeBranch } = useAppStore();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const branchId = "recoveryzone";
      const [eventsRes, salesRes, resRes, pkgsRes, clientsRes] =
        await Promise.all([
          getRecoveryServiceHistoryAction(branchId),
          getRecoveryServiceSalesAction(branchId),
          getRecoveryReservationsAction(branchId),
          getRecoveryClientPackagesAction(branchId),
          getRecoveryClientsAction(branchId),
        ]);

      if (eventsRes.success && eventsRes.data) {
        setEvents(eventsRes.data.filter((e: any) => e !== null));
      }
      if (salesRes.success && salesRes.data) {
        setSales(salesRes.data);
      }
      if (resRes.success && resRes.data) {
        setReservations(resRes.data);
      }
      if (pkgsRes.success && pkgsRes.data) {
        setClientPackages(pkgsRes.data);
      }
      if (clientsRes.success && clientsRes.data) {
        setClients(clientsRes.data);
      }
    } catch (err: any) {
      console.error("Error fetching recovery services data:", err);
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
    reservations,
    clientPackages,
    clients,
    isLoading,
    error,
    refetch: fetchData,
  };
}
