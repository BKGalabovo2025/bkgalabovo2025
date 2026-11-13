"use client";

import React, { createContext, useContext, useState } from "react";

import { ScheduleEvent } from "@/types";
import { BusinessTrip, TripExpense } from "@/types/business-trip.types";
import { Member } from "@/types/member.types";

interface TripDetailsContextType {
  trip: BusinessTrip;
  event: ScheduleEvent | null;
  expenses: TripExpense[];
  membersDict: Record<string, Member>;
  setTrip: React.Dispatch<React.SetStateAction<BusinessTrip>>;
  setExpenses: React.Dispatch<React.SetStateAction<TripExpense[]>>;
  refreshData: () => Promise<void>;
}

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
      }}
    >
      {children}
    </TripDetailsContext.Provider>
  );
}
