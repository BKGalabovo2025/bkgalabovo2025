"use client";

import React, { createContext, useContext, useMemo } from "react";

import type { FinancialReportData } from "@/lib/actions/reports";
import type { AttendanceReportItem } from "@/services/report-service";
import type { Member, Product } from "@/types";

export interface ReportsDataState {
  initialFinancialData: FinancialReportData;
  initialLiabilities: Member[];
  initialLiabilitiesPeriod: {
    year: number;
    month: number;
  };
  initialAttendanceData: AttendanceReportItem[];
  initialAttendancePeriod: {
    startDate: string;
    endDate: string;
  };
  initialRestockProducts: Product[];
  activeBranch?: string;
}

export type ReportsContextType = ReportsDataState;

const ReportsContext = createContext<ReportsContextType | null>(null);

export function ReportsProvider({
  children,
  data,
}: {
  children: React.ReactNode;
  data: ReportsDataState;
}) {
  const value = useMemo(() => ({ ...data }), [data]);

  return (
    <ReportsContext.Provider value={value}>{children}</ReportsContext.Provider>
  );
}

export function useReportsContext(): ReportsContextType {
  const ctx = useContext(ReportsContext);
  if (!ctx) {
    throw new Error(
      "useReportsContext must be used within a <ReportsProvider />"
    );
  }
  return ctx;
}
