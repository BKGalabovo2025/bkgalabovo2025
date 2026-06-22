"use client";

import { useState, useEffect, useCallback } from "react";
import { Sale } from "@/types";
import { toast } from "sonner";

import {
  getRecoveryServiceHistoryAction,
  getRecoveryServiceSalesAction,
  getRecoveryReservationsAction,
  getRecoveryClientPackagesAction,
  getRecoveryClientsAction,
} from "@/lib/actions/recovery-services-server";

export interface RecoveryEvent {
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

export interface RecoveryReservation {
  id: string;
  clientName: string;
  client2Name?: string;
  clientEmail?: string;
  clientPhone?: string;
  startTime: string | Date;
  endTime: string | Date;
  serviceName: string;
  sessionName?: string;
  status: string;
  price?: number;
  totalPrice?: number;
  sessionId?: string;
  courtId?: string;
}

export interface RecoveryPackage {
  id: string;
  clientName: string;
  client2Name?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt: string | Date;
  purchaseDate?: string | Date;
  packageId?: string;
  packageName?: string;
  sessionsRemaining: number;
  totalSessions?: number;
  sessionsTotal?: number;
  price?: number;
  status?: string;
}

export interface RecoveryClient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string | Date;
}

export function useRecoveryServices() {
  const [events, setEvents] = useState<RecoveryEvent[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [reservations, setReservations] = useState<RecoveryReservation[]>([]);
  const [clientPackages, setClientPackages] = useState<RecoveryPackage[]>([]);
  const [clients, setClients] = useState<RecoveryClient[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // unused: const { activeBranch } = useAppStore();

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
        setEvents(eventsRes.data.filter((e: unknown) => e !== null) as RecoveryEvent[]);
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
    } catch (err: unknown) {
      console.error("Error fetching recovery services data:", err);
      const message = err instanceof Error ? err.message : "Грешка при зареждане на данни";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
