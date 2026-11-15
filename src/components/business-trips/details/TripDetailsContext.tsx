"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { ScheduleEvent } from "@/types";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

export type TripDialogAction =
  | "edit"
  | "manager"
  | "statement"
  | "protocol"
  | "report"
  | "signatures"
  | "add-expense"
  | "edit-expense"
  | null;

interface TripDetailsContextType {
  trip: BusinessTrip;
  event: ScheduleEvent | null;
  expenses: TripExpense[];
  membersDict: Record<string, Member>;
  setTrip: React.Dispatch<React.SetStateAction<BusinessTrip>>;
  setExpenses: React.Dispatch<React.SetStateAction<TripExpense[]>>;
  refreshData: () => Promise<void>;
  activeDialog: TripDialogAction;
  activeExpenseId: string | null;
  openDialog: (
    action: Exclude<TripDialogAction, null>,
    extraParams?: Record<string, string>
  ) => void;
  closeDialog: () => void;
}

const VALID_DIALOG_ACTIONS = new Set<string>([
  "edit",
  "manager",
  "statement",
  "protocol",
  "report",
  "signatures",
  "add-expense",
  "edit-expense",
]);

const TripDetailsContext = createContext<TripDetailsContextType | null>(null);

export function useTripDetails() {
  const context = useContext(TripDetailsContext);
  if (!context) {
    throw new Error("useTripDetails must be used within a TripDetailsProvider");
  }
  return context;
}

export function TripDetailsProvider({
  initialTrip,
  initialEvent,
  initialExpenses,
  initialMembersDict,
  children,
}: {
  initialTrip: BusinessTrip;
  initialEvent: ScheduleEvent | null;
  initialExpenses: TripExpense[];
  initialMembersDict: Record<string, Member>;
  children: React.ReactNode;
}) {
  const [trip, setTrip] = useState<BusinessTrip>(initialTrip);
  const [expenses, setExpenses] = useState<TripExpense[]>(initialExpenses);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setTrip(initialTrip);
  }, [initialTrip]);

  useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);

  const rawAction = searchParams.get("action");
  const activeDialog: TripDialogAction =
    rawAction && VALID_DIALOG_ACTIONS.has(rawAction)
      ? (rawAction as Exclude<TripDialogAction, null>)
      : null;
  const activeExpenseId = searchParams.get("expenseId");

  const openDialog = useCallback(
    (
      action: Exclude<TripDialogAction, null>,
      extraParams?: Record<string, string>
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("action", action);
      params.delete("expenseId");
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          params.set(k, v);
        });
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  const closeDialog = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("action");
    params.delete("expenseId");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  const refreshData = async () => {
    try {
      if (!trip.id) return;
      const { businessTripService } =
        await import("@/services/business-trip-service");
      const [freshTrip, freshExpenses] = await Promise.all([
        businessTripService.getTripById(trip.id),
        businessTripService.getExpensesByTrip(trip.id, trip.siteId),
      ]);
      if (freshTrip) setTrip(freshTrip);
      setExpenses(freshExpenses);
    } catch (e) {
      console.error("Грешка при обновяване на данни за командировката:", e);
    }
  };

  return (
    <TripDetailsContext.Provider
      value={{
        trip,
        event: initialEvent,
        expenses,
        membersDict: initialMembersDict,
        setTrip,
        setExpenses,
        refreshData,
        activeDialog,
        activeExpenseId,
        openDialog,
        closeDialog,
      }}
    >
      {children}
    </TripDetailsContext.Provider>
  );
}
